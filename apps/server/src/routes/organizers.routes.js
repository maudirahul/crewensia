import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { asyncRoute, HttpError, pagination, requiredString, requireObject } from '../lib/http.js';

export const organizersRouter = Router();
organizersRouter.use(authenticate(), requireRole('ORGANIZER'));

organizersRouter.get('/me', asyncRoute(async (request, response) => {
  const profile = await prisma.organizerProfile.findUnique({
    where: { userId: request.auth.user.id },
    include: { verificationRequests: { orderBy: { submittedAt: 'desc' } } },
  });
  if (!profile) throw new HttpError(404, 'ORGANIZER_PROFILE_NOT_FOUND', 'Organizer profile not found.');
  response.json({ data: profile });
}));

organizersRouter.post('/me/verification-requests', asyncRoute(async (request, response) => {
  const body = requireObject(request.body);
  const credentialType = requiredString(body.credentialType, 'Credential type', { max: 120 });
  const credentialDetails = requiredString(body.credentialDetails, 'Credential details', { max: 3000 });
  const profile = await prisma.organizerProfile.findUnique({ where: { userId: request.auth.user.id } });
  if (!profile) throw new HttpError(404, 'ORGANIZER_PROFILE_NOT_FOUND', 'Organizer profile not found.');
  if (profile.verificationStatus === 'APPROVED') {
    throw new HttpError(409, 'ORGANIZER_ALREADY_VERIFIED', 'This organizer account is already approved.');
  }

  const openRequest = await prisma.verificationRequest.findFirst({
    where: { organizerId: profile.id, status: 'PENDING' },
  });
  if (openRequest) throw new HttpError(409, 'VERIFICATION_ALREADY_PENDING', 'A verification request is already awaiting review.');

  const created = await prisma.$transaction(async (tx) => {
    const verificationRequest = await tx.verificationRequest.create({
      data: { organizerId: profile.id, credentialType, credentialDetails },
    });
    await tx.organizerProfile.update({ where: { id: profile.id }, data: { verificationStatus: 'PENDING' } });
    return verificationRequest;
  });
  response.status(201).json({ data: created });
}));

organizersRouter.get('/me/events', asyncRoute(async (request, response) => {
  const events = await prisma.event.findMany({
    where: { organizer: { userId: request.auth.user.id } },
    orderBy: [{ startsAt: 'asc' }, { createdAt: 'desc' }],
  });
  response.json({ data: events });
}));

organizersRouter.get('/me/volunteers/:volunteerId', asyncRoute(async (request, response) => {
  const application = await prisma.application.findFirst({
    where: {
      volunteerId: request.params.volunteerId,
      eventShift: { eventRole: { event: { organizer: { userId: request.auth.user.id } } } },
    },
    select: { id: true },
  });
  if (!application) throw new HttpError(404, 'VOLUNTEER_NOT_FOUND', 'Volunteer profile not found.');

  const [volunteer, applications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: request.params.volunteerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        volunteerProfile: {
          select: {
            homeCity: true,
            locality: true,
            skills: true,
            availabilityWindows: {
              where: { isAvailable: true, endsAt: { gt: new Date() } },
              orderBy: { startsAt: 'asc' },
              take: 10,
            },
          },
        },
      },
    }),
    prisma.application.findMany({
      where: {
        volunteerId: request.params.volunteerId,
        eventShift: { eventRole: { event: { organizer: { userId: request.auth.user.id } } } },
      },
      orderBy: { appliedAt: 'desc' },
      include: {
        eventShift: { include: { eventRole: { include: { event: { select: { id: true, title: true, city: true, startsAt: true } } } } } },
      },
    }),
  ]);
  if (!volunteer?.volunteerProfile) throw new HttpError(404, 'VOLUNTEER_NOT_FOUND', 'Volunteer profile not found.');
  response.json({ data: { ...volunteer, applications } });
}));

organizersRouter.get('/me/events/:eventId/applications', asyncRoute(async (request, response) => {
  const { page, pageSize, skip, take } = pagination(request.query);
  const status = request.query.status;
  const allowedStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'WAITLISTED', 'COMPLETED'];
  if (status && !allowedStatuses.includes(status)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'status is not a valid application status.');
  }

  const event = await prisma.event.findFirst({
    where: { id: request.params.eventId, organizer: { userId: request.auth.user.id } },
    select: { id: true },
  });
  if (!event) throw new HttpError(404, 'EVENT_NOT_FOUND', 'Event not found.');

  const where = { eventShift: { eventRole: { eventId: event.id } }, ...(status ? { status } : {}) };
  const [items, total] = await prisma.$transaction([
    prisma.application.findMany({
      where,
      orderBy: { appliedAt: 'desc' },
      skip,
      take,
      include: {
        volunteer: { select: { id: true, name: true, email: true, phone: true, volunteerProfile: true } },
        eventShift: { include: { eventRole: { select: { title: true } } } },
        attendance: true,
      },
    }),
    prisma.application.count({ where }),
  ]);

  response.json({ data: items, pagination: { page, pageSize, total } });
}));
