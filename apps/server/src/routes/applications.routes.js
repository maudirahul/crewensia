import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { asyncRoute, HttpError, optionalString, requireObject } from '../lib/http.js';

export const applicationsRouter = Router();
applicationsRouter.use(authenticate());

applicationsRouter.post('/shifts/:shiftId/applications', requireRole('VOLUNTEER'), asyncRoute(async (request, response) => {
  const body = requireObject(request.body ?? {});
  const message = optionalString(body.message, 'message', { max: 1000 });
  const volunteerProfile = await prisma.volunteerProfile.findUnique({ where: { userId: request.auth.user.id } });
  if (!volunteerProfile) throw new HttpError(409, 'VOLUNTEER_PROFILE_REQUIRED', 'Create a volunteer profile before applying.');

  const shift = await prisma.eventShift.findUnique({
    where: { id: request.params.shiftId },
    include: { eventRole: { include: { event: { include: { organizer: true } } } } },
  });
  if (!shift || shift.eventRole.event.status !== 'PUBLISHED') throw new HttpError(404, 'SHIFT_NOT_FOUND', 'Available shift not found.');
  const event = shift.eventRole.event;
  if (event.applicationDeadline <= new Date() || shift.startsAt <= new Date()) {
    throw new HttpError(409, 'APPLICATION_CLOSED', 'The application deadline for this shift has passed.');
  }
  if (event.organizer.userId === request.auth.user.id) {
    throw new HttpError(403, 'OWN_EVENT_APPLICATION', 'You cannot apply to a shift at your own event.');
  }

  const application = await prisma.$transaction(async (tx) => {
    const latestShift = await tx.eventShift.findUnique({
      where: { id: shift.id },
      include: { eventRole: { include: { event: { include: { organizer: true } } } } },
    });
    if (!latestShift || latestShift.eventRole.event.status !== 'PUBLISHED' || latestShift.eventRole.event.applicationDeadline <= new Date() || latestShift.startsAt <= new Date()) {
      throw new HttpError(409, 'APPLICATION_CLOSED', 'The application window for this shift has closed.');
    }
    const created = await tx.application.create({
      data: {
        eventShiftId: latestShift.id,
        volunteerId: request.auth.user.id,
        message,
        statusHistory: { create: { fromStatus: null, toStatus: 'PENDING', changedById: request.auth.user.id } },
      },
      include: { eventShift: { include: { eventRole: { include: { event: true } } } } },
    });
    await tx.notification.create({
      data: {
        userId: latestShift.eventRole.event.organizer.userId,
        type: 'APPLICATION_RECEIVED',
        title: 'New volunteer application',
        message: `${request.auth.user.name} applied for ${latestShift.eventRole.title}.`,
        eventId: latestShift.eventRole.event.id,
        applicationId: created.id,
      },
    });
    return created;
  }, { isolationLevel: 'Serializable' });
  response.status(201).json({ data: application });
}));

applicationsRouter.patch('/applications/:applicationId', requireRole('ORGANIZER'), asyncRoute(async (request, response) => {
  const body = requireObject(request.body);
  const decision = body.decision;
  if (!['APPROVED', 'REJECTED', 'WAITLISTED'].includes(decision)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'decision must be APPROVED, REJECTED, or WAITLISTED.');
  }
  const note = optionalString(body.note, 'note', { max: 1000 });
  const application = await prisma.application.findUnique({
    where: { id: request.params.applicationId },
    include: {
      eventShift: { include: { eventRole: { include: { event: { include: { organizer: true } } } } } },
    },
  });
  if (!application) throw new HttpError(404, 'APPLICATION_NOT_FOUND', 'Application not found.');
  const event = application.eventShift.eventRole.event;
  if (event.organizer.userId !== request.auth.user.id) throw new HttpError(404, 'APPLICATION_NOT_FOUND', 'Application not found.');
  if (!['PENDING', 'WAITLISTED'].includes(application.status)) {
    throw new HttpError(409, 'APPLICATION_ALREADY_DECIDED', 'Only pending or waitlisted applications can be decided.');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const latest = await tx.application.findUnique({ where: { id: application.id } });
    if (!latest || !['PENDING', 'WAITLISTED'].includes(latest.status)) {
      throw new HttpError(409, 'APPLICATION_ALREADY_DECIDED', 'This application has already been decided.');
    }
    if (decision === 'APPROVED') {
      const approvedCount = await tx.application.count({
        where: { eventShiftId: application.eventShiftId, status: 'APPROVED', id: { not: application.id } },
      });
      if (approvedCount >= application.eventShift.openings) {
        throw new HttpError(409, 'SHIFT_FULL', 'All openings for this shift are filled. Keep the applicant waitlisted or free an opening first.');
      }
    }

    const result = await tx.application.update({
      where: { id: application.id },
      data: {
        status: decision,
        decidedById: request.auth.user.id,
        decidedAt: new Date(),
        statusHistory: { create: { fromStatus: latest.status, toStatus: decision, changedById: request.auth.user.id, note } },
      },
      include: { eventShift: { include: { eventRole: { include: { event: true } } } } },
    });
    await tx.notification.create({
      data: {
        userId: application.volunteerId,
        type: decision === 'APPROVED' ? 'APPLICATION_APPROVED' : decision === 'REJECTED' ? 'APPLICATION_REJECTED' : 'APPLICATION_WAITLISTED',
        title: decision === 'APPROVED' ? 'Your application was approved' : decision === 'REJECTED' ? 'Application update' : 'You are on the waitlist',
        message: decision === 'APPROVED'
          ? `You are confirmed for ${event.title}. Check the event page for timing and arrival instructions.`
          : decision === 'REJECTED'
            ? `Your application for ${event.title} was not selected.${note ? ` ${note}` : ''}`
            : `You are on the waitlist for ${event.title}.${note ? ` ${note}` : ''}`,
        eventId: event.id,
        applicationId: application.id,
      },
    });
    return result;
  }, { isolationLevel: 'Serializable' });

  response.json({ data: updated });
}));

applicationsRouter.post('/applications/:applicationId/withdraw', requireRole('VOLUNTEER'), asyncRoute(async (request, response) => {
  const current = await prisma.application.findFirst({
    where: { id: request.params.applicationId, volunteerId: request.auth.user.id },
    include: {
      eventShift: { include: { eventRole: { include: { event: { include: { organizer: true } } } } } },
    },
  });
  if (!current) throw new HttpError(404, 'APPLICATION_NOT_FOUND', 'Application not found.');
  if (!['PENDING', 'APPROVED', 'WAITLISTED'].includes(current.status)) {
    throw new HttpError(409, 'APPLICATION_CANNOT_BE_WITHDRAWN', 'This application can no longer be withdrawn.');
  }
  if (current.eventShift.startsAt <= new Date()) {
    throw new HttpError(409, 'SHIFT_ALREADY_STARTED', 'An application cannot be withdrawn after the shift starts.');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const latest = await tx.application.findUnique({ where: { id: current.id } });
    if (!latest || !['PENDING', 'APPROVED', 'WAITLISTED'].includes(latest.status)) {
      throw new HttpError(409, 'APPLICATION_CANNOT_BE_WITHDRAWN', 'This application can no longer be withdrawn.');
    }
    const result = await tx.application.update({
      where: { id: current.id },
      data: {
        status: 'WITHDRAWN',
        statusHistory: { create: { fromStatus: latest.status, toStatus: 'WITHDRAWN', changedById: request.auth.user.id } },
      },
    });
    const event = current.eventShift.eventRole.event;
    await tx.notification.create({
      data: {
        userId: event.organizer.userId,
        type: 'APPLICATION_WITHDRAWN',
        title: 'Volunteer withdrew',
        message: `${request.auth.user.name} withdrew from a shift at ${event.title}.`,
        eventId: event.id,
        applicationId: current.id,
      },
    });
    return result;
  });
  response.json({ data: updated });
}));
