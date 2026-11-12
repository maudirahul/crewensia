import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { asyncRoute, HttpError, optionalString, pagination, requiredString, requireObject } from '../lib/http.js';

export const adminRouter = Router();
adminRouter.use(authenticate(), requireRole('ADMIN'));

adminRouter.get('/events', asyncRoute(async (request, response) => {
  const { page, pageSize, skip, take } = pagination(request.query);
  const status = request.query.status ?? 'ALL';
  const allowedStatuses = ['ALL', 'DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED', 'HIDDEN'];
  if (!allowedStatuses.includes(status)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'status is not a valid event status.');
  }
  const where = status === 'ALL' ? {} : { status };
  const [items, total] = await prisma.$transaction([
    prisma.event.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip,
      take,
      include: {
        organizer: {
          select: {
            organizationName: true,
            verificationStatus: true,
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        roles: {
          orderBy: { createdAt: 'asc' },
          include: {
            shifts: {
              orderBy: { startsAt: 'asc' },
              include: {
                applications: {
                  orderBy: { appliedAt: 'desc' },
                  include: {
                    volunteer: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        volunteerProfile: { select: { homeCity: true, locality: true, skills: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.event.count({ where }),
  ]);
  response.json({ data: items, pagination: { page, pageSize, total } });
}));

adminRouter.get('/organizer-verifications', asyncRoute(async (request, response) => {
  const { page, pageSize, skip, take } = pagination(request.query);
  const status = request.query.status ?? 'PENDING';
  const allowedStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_INFORMATION'];
  if (!allowedStatuses.includes(status)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'status is not a valid verification status.');
  }
  const where = { status };
  const [items, total] = await prisma.$transaction([
    prisma.verificationRequest.findMany({
      where,
      orderBy: { submittedAt: 'asc' },
      skip,
      take,
      include: {
        organizer: {
          include: { user: { select: { id: true, name: true, email: true, phone: true } } },
        },
      },
    }),
    prisma.verificationRequest.count({ where }),
  ]);
  response.json({ data: items, pagination: { page, pageSize, total } });
}));

adminRouter.patch('/organizer-verifications/:requestId', asyncRoute(async (request, response) => {
  const body = requireObject(request.body);
  const decision = body.decision;
  const allowedDecisions = ['APPROVED', 'REJECTED', 'NEEDS_INFORMATION'];
  if (!allowedDecisions.includes(decision)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'decision must be APPROVED, REJECTED, or NEEDS_INFORMATION.');
  }
  const notes = optionalString(body.notes, 'Review notes', { max: 3000 });
  if (decision !== 'APPROVED' && !notes) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Review notes are required when a request is not approved.');
  }

  const current = await prisma.verificationRequest.findUnique({
    where: { id: request.params.requestId },
    include: { organizer: true },
  });
  if (!current) throw new HttpError(404, 'VERIFICATION_NOT_FOUND', 'Verification request not found.');
  if (current.status !== 'PENDING' && current.status !== 'NEEDS_INFORMATION') {
    throw new HttpError(409, 'VERIFICATION_ALREADY_REVIEWED', 'This verification request has already been decided.');
  }

  const actionByDecision = {
    APPROVED: 'ORGANIZER_APPROVED',
    REJECTED: 'ORGANIZER_REJECTED',
    NEEDS_INFORMATION: 'VERIFICATION_NEEDS_INFORMATION',
  };

  const result = await prisma.$transaction(async (tx) => {
    const verificationRequest = await tx.verificationRequest.update({
      where: { id: current.id },
      data: {
        status: decision,
        reviewedById: request.auth.user.id,
        reviewedAt: new Date(),
        reviewNotes: notes,
      },
    });
    await tx.organizerProfile.update({
      where: { id: current.organizerId },
      data: { verificationStatus: decision },
    });
    await tx.adminAction.create({
      data: {
        actorId: request.auth.user.id,
        action: actionByDecision[decision],
        subjectType: 'VERIFICATION_REQUEST',
        subjectId: current.id,
        details: { organizerId: current.organizerId, decision, notes },
      },
    });
    await tx.notification.create({
      data: {
        userId: current.organizer.userId,
        type: 'ORGANIZER_VERIFICATION_UPDATED',
        title: decision === 'APPROVED' ? 'Organizer account approved' : 'Organizer verification updated',
        message: decision === 'APPROVED'
          ? 'Your organizer account has been approved. You can now publish events.'
          : `Your organizer verification needs attention. ${notes}`,
      },
    });
    return verificationRequest;
  });

  response.json({ data: result });
}));
