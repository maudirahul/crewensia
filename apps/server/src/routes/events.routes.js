import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { asyncRoute, HttpError, optionalString, pagination, parseDate, requiredString, requireObject } from '../lib/http.js';

export const eventsRouter = Router();

function dateRange(body) {
  const startsAt = parseDate(body.startsAt, 'startsAt');
  const endsAt = parseDate(body.endsAt, 'endsAt');
  const applicationDeadline = parseDate(body.applicationDeadline, 'applicationDeadline');
  if (endsAt <= startsAt) throw new HttpError(400, 'VALIDATION_ERROR', 'endsAt must be after startsAt.');
  if (applicationDeadline >= startsAt) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'applicationDeadline must be before the event starts.');
  }
  return { startsAt, endsAt, applicationDeadline };
}

function validateRoles(value, eventStartsAt, eventEndsAt) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 50) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'roles must contain between 1 and 50 roles.');
  }

  return value.map((role, roleIndex) => {
    requireObject(role, `roles[${roleIndex}]`);
    const title = requiredString(role.title, `roles[${roleIndex}].title`, { max: 120 });
    const responsibilities = requiredString(role.responsibilities, `roles[${roleIndex}].responsibilities`, { max: 3000 });
    const compensationType = role.compensationType;
    if (!['PAID', 'UNPAID'].includes(compensationType)) {
      throw new HttpError(400, 'VALIDATION_ERROR', `roles[${roleIndex}].compensationType must be PAID or UNPAID.`);
    }

    let compensationAmount = null;
    let compensationBasis = null;
    let expectedPaymentAt = null;
    if (compensationType === 'PAID') {
      const amount = Number(role.compensationAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new HttpError(400, 'VALIDATION_ERROR', `roles[${roleIndex}].compensationAmount must be greater than zero for paid work.`);
      }
      if (!['PER_HOUR', 'PER_SHIFT', 'PER_EVENT'].includes(role.compensationBasis)) {
        throw new HttpError(400, 'VALIDATION_ERROR', `roles[${roleIndex}].compensationBasis is required for paid work.`);
      }
      compensationAmount = amount.toFixed(2);
      compensationBasis = role.compensationBasis;
      expectedPaymentAt = requiredString(role.expectedPaymentAt, `roles[${roleIndex}].expectedPaymentAt`, { max: 200 });
    }

    const requiredSkills = role.requiredSkills ?? [];
    if (!Array.isArray(requiredSkills) || requiredSkills.length > 50 || requiredSkills.some((skill) => typeof skill !== 'string' || skill.trim().length > 80)) {
      throw new HttpError(400, 'VALIDATION_ERROR', `roles[${roleIndex}].requiredSkills must be an array of up to 50 short strings.`);
    }
    if (!Array.isArray(role.shifts) || role.shifts.length === 0 || role.shifts.length > 100) {
      throw new HttpError(400, 'VALIDATION_ERROR', `roles[${roleIndex}].shifts must contain at least one shift.`);
    }
    const shifts = role.shifts.map((shift, shiftIndex) => {
      requireObject(shift, `roles[${roleIndex}].shifts[${shiftIndex}]`);
      const startsAt = parseDate(shift.startsAt, `roles[${roleIndex}].shifts[${shiftIndex}].startsAt`);
      const endsAt = parseDate(shift.endsAt, `roles[${roleIndex}].shifts[${shiftIndex}].endsAt`);
      if (endsAt <= startsAt || startsAt < eventStartsAt || endsAt > eventEndsAt) {
        throw new HttpError(400, 'VALIDATION_ERROR', `roles[${roleIndex}].shifts[${shiftIndex}] must fit within the event schedule.`);
      }
      const openings = Number(shift.openings);
      if (!Number.isInteger(openings) || openings < 1 || openings > 10000) {
        throw new HttpError(400, 'VALIDATION_ERROR', `roles[${roleIndex}].shifts[${shiftIndex}].openings must be a positive integer.`);
      }
      return { startsAt, endsAt, openings };
    });

    return { title, responsibilities, requiredSkills: requiredSkills.map((skill) => skill.trim()), compensationType, compensationAmount, compensationBasis, expectedPaymentAt, shifts };
  });
}

eventsRouter.get('/', asyncRoute(async (request, response) => {
  const { page, pageSize, skip, take } = pagination(request.query);
  const where = {
    status: 'PUBLISHED',
    startsAt: { gte: request.query.from ? parseDate(request.query.from, 'from') : new Date() },
  };
  if (request.query.to) where.startsAt.lte = parseDate(request.query.to, 'to');
  if (request.query.city) where.city = { equals: requiredString(request.query.city, 'city', { max: 120 }), mode: 'insensitive' };

  const roleConditions = [];
  if (request.query.role) roleConditions.push({ title: { contains: requiredString(request.query.role, 'role', { max: 120 }), mode: 'insensitive' } });
  if (request.query.skill) roleConditions.push({ requiredSkills: { has: requiredString(request.query.skill, 'skill', { max: 80 }) } });
  if (roleConditions.length) where.roles = { some: { AND: roleConditions } };

  const [items, total] = await prisma.$transaction([
    prisma.event.findMany({
      where,
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      skip,
      take,
      include: {
        organizer: { select: { organizationName: true, user: { select: { name: true } } } },
        roles: { include: { shifts: { orderBy: { startsAt: 'asc' } } } },
      },
    }),
    prisma.event.count({ where }),
  ]);

  response.json({ data: items, pagination: { page, pageSize, total } });
}));

eventsRouter.get('/:eventId', authenticate({ required: false }), asyncRoute(async (request, response) => {
  const event = await prisma.event.findUnique({
    where: { id: request.params.eventId },
    include: {
      organizer: { select: { organizationName: true, user: { select: { name: true } } } },
      roles: { include: { shifts: { orderBy: { startsAt: 'asc' } } } },
    },
  });
  if (!event) throw new HttpError(404, 'EVENT_NOT_FOUND', 'Event not found.');
  const isOwner = request.auth && event.organizer.userId === request.auth.user.id;
  if (event.status !== 'PUBLISHED' && !isOwner) throw new HttpError(404, 'EVENT_NOT_FOUND', 'Event not found.');
  response.json({ data: event });
}));

eventsRouter.post('/', authenticate(), requireRole('ORGANIZER'), asyncRoute(async (request, response) => {
  const body = requireObject(request.body);
  const profile = await prisma.organizerProfile.findUnique({ where: { userId: request.auth.user.id } });
  if (!profile || profile.verificationStatus !== 'APPROVED') {
    throw new HttpError(403, 'ORGANIZER_NOT_APPROVED', 'An approved organizer account is required to create events.');
  }
  const schedule = dateRange(body);
  const roles = validateRoles(body.roles, schedule.startsAt, schedule.endsAt);
  const latitude = body.latitude === undefined || body.latitude === null ? null : Number(body.latitude);
  const longitude = body.longitude === undefined || body.longitude === null ? null : Number(body.longitude);
  if ((latitude === null) !== (longitude === null)) throw new HttpError(400, 'VALIDATION_ERROR', 'latitude and longitude must be provided together.');
  if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) throw new HttpError(400, 'VALIDATION_ERROR', 'latitude must be between -90 and 90.');
  if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) throw new HttpError(400, 'VALIDATION_ERROR', 'longitude must be between -180 and 180.');

  const event = await prisma.event.create({
    data: {
      organizerId: profile.id,
      title: requiredString(body.title, 'title', { max: 200 }),
      description: requiredString(body.description, 'description', { max: 10000 }),
      category: optionalString(body.category, 'category', { max: 120 }),
      venueName: optionalString(body.venueName, 'venueName', { max: 200 }),
      venueAddress: requiredString(body.venueAddress, 'venueAddress', { max: 500 }),
      locality: optionalString(body.locality, 'locality', { max: 120 }),
      city: requiredString(body.city, 'city', { max: 120 }),
      latitude,
      longitude,
      ...schedule,
      eligibility: optionalString(body.eligibility, 'eligibility', { max: 2000 }),
      benefits: optionalString(body.benefits, 'benefits', { max: 2000 }),
      dressCode: optionalString(body.dressCode, 'dressCode', { max: 1000 }),
      arrivalInstructions: optionalString(body.arrivalInstructions, 'arrivalInstructions', { max: 3000 }),
      otherConditions: optionalString(body.otherConditions, 'otherConditions', { max: 3000 }),
      roles: {
        create: roles.map(({ shifts, ...role }) => ({
          ...role,
          shifts: { create: shifts },
        })),
      },
    },
    include: { roles: { include: { shifts: true } } },
  });
  response.status(201).json({ data: event });
}));

eventsRouter.post('/:eventId/publish', authenticate(), requireRole('ORGANIZER'), asyncRoute(async (request, response) => {
  const profile = await prisma.organizerProfile.findUnique({ where: { userId: request.auth.user.id } });
  if (!profile || profile.verificationStatus !== 'APPROVED') {
    throw new HttpError(403, 'ORGANIZER_NOT_APPROVED', 'An approved organizer account is required to publish events.');
  }
  const event = await prisma.event.findFirst({
    where: { id: request.params.eventId, organizerId: profile.id },
    include: { roles: { include: { shifts: true } } },
  });
  if (!event) throw new HttpError(404, 'EVENT_NOT_FOUND', 'Event not found.');
  if (event.status !== 'DRAFT') throw new HttpError(409, 'EVENT_NOT_DRAFT', 'Only draft events can be published.');
  if (event.startsAt <= new Date() || event.applicationDeadline <= new Date()) {
    throw new HttpError(409, 'EVENT_DATES_PASSED', 'The event and application deadline must be in the future.');
  }
  if (!event.roles.length || event.roles.some((role) => !role.shifts.length)) {
    throw new HttpError(409, 'EVENT_INCOMPLETE', 'Add at least one role and one shift before publishing.');
  }

  const published = await prisma.event.update({
    where: { id: event.id },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
    include: { roles: { include: { shifts: true } } },
  });
  response.json({ data: published });
}));

eventsRouter.post('/:eventId/cancel', authenticate(), requireRole('ORGANIZER'), asyncRoute(async (request, response) => {
  const body = requireObject(request.body);
  const reason = requiredString(body.reason, 'Cancellation reason', { max: 1000 });
  const profile = await prisma.organizerProfile.findUnique({ where: { userId: request.auth.user.id } });
  if (!profile) throw new HttpError(403, 'ORGANIZER_PROFILE_REQUIRED', 'Organizer profile required.');
  const event = await prisma.event.findFirst({ where: { id: request.params.eventId, organizerId: profile.id } });
  if (!event) throw new HttpError(404, 'EVENT_NOT_FOUND', 'Event not found.');
  if (!['DRAFT', 'PUBLISHED'].includes(event.status)) {
    throw new HttpError(409, 'EVENT_CANNOT_BE_CANCELLED', 'Only draft or published events can be cancelled.');
  }

  const cancelled = await prisma.$transaction(async (tx) => {
    const updated = await tx.event.update({
      where: { id: event.id },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancellationReason: reason },
    });
    await tx.eventUpdate.create({
      data: { eventId: event.id, authorId: request.auth.user.id, type: 'CANCELLATION', message: reason },
    });
    const applicantRows = await tx.application.findMany({
      where: {
        status: { in: ['PENDING', 'APPROVED', 'WAITLISTED'] },
        eventShift: { eventRole: { eventId: event.id } },
      },
      select: { volunteerId: true },
    });
    const volunteerIds = [...new Set(applicantRows.map((row) => row.volunteerId))];
    if (volunteerIds.length) {
      await tx.notification.createMany({
        data: volunteerIds.map((userId) => ({
          userId,
          type: 'EVENT_CANCELLED',
          title: 'Event cancelled',
          message: `${event.title} has been cancelled. ${reason}`,
          eventId: event.id,
        })),
      });
    }
    return updated;
  });
  response.json({ data: cancelled });
}));
