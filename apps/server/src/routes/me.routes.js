import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticate, publicUser, requireRole } from '../lib/auth.js';
import { asyncRoute, HttpError, optionalString, pagination, requiredString, requireObject } from '../lib/http.js';

export const meRouter = Router();
meRouter.use(authenticate());

meRouter.get('/', asyncRoute(async (request, response) => {
  response.json({ data: { user: publicUser(request.auth.user) } });
}));

meRouter.patch('/profile', asyncRoute(async (request, response) => {
  const body = requireObject(request.body);
  const data = {};
  if (body.name !== undefined) data.name = requiredString(body.name, 'Name', { max: 120 });
  if (body.phone !== undefined) {
    data.phone = optionalString(body.phone, 'Phone', { max: 40 });
    if (!data.phone && request.auth.user.roles.includes('ORGANIZER')) {
      throw new HttpError(400, 'PHONE_REQUIRED', 'Organizer accounts must keep a contact phone number.');
    }
  }
  const user = await prisma.user.update({
    where: { id: request.auth.user.id },
    data,
    include: { volunteerProfile: true, organizerProfile: true },
  });
  response.json({ data: { user: publicUser(user) } });
}));

meRouter.patch('/volunteer-profile', requireRole('VOLUNTEER'), asyncRoute(async (request, response) => {
  const body = requireObject(request.body);
  const data = {};
  if (body.homeCity !== undefined) data.homeCity = optionalString(body.homeCity, 'Home city', { max: 120 });
  if (body.locality !== undefined) data.locality = optionalString(body.locality, 'Locality', { max: 120 });
  if (body.skills !== undefined) {
    if (!Array.isArray(body.skills) || body.skills.length > 50 || body.skills.some((skill) => typeof skill !== 'string' || !skill.trim() || skill.trim().length > 80)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'skills must contain up to 50 non-empty strings of at most 80 characters.');
    }
    data.skills = [...new Set(body.skills.map((skill) => skill.trim()))];
  }
  const profile = await prisma.volunteerProfile.update({ where: { userId: request.auth.user.id }, data });
  response.json({ data: profile });
}));

meRouter.patch('/active-role', asyncRoute(async (request, response) => {
  const body = requireObject(request.body);
  const role = body.role;
  if (!['VOLUNTEER', 'ORGANIZER', 'ADMIN'].includes(role)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'role must be VOLUNTEER, ORGANIZER, or ADMIN.');
  }
  if (!request.auth.user.roles.includes(role)) {
    throw new HttpError(403, 'ROLE_NOT_ASSIGNED', 'Add this role to your account before switching to it.');
  }
  const user = await prisma.user.update({
    where: { id: request.auth.user.id },
    data: { activeRole: role },
    include: { volunteerProfile: true, organizerProfile: true },
  });
  response.json({ data: { user: publicUser(user) } });
}));

meRouter.post('/roles', asyncRoute(async (request, response) => {
  const body = requireObject(request.body);
  const role = body.role;
  if (!['VOLUNTEER', 'ORGANIZER'].includes(role)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Only VOLUNTEER or ORGANIZER can be added to an account.');
  }

  const user = await prisma.$transaction(async (tx) => {
    const current = await tx.user.findUnique({ where: { id: request.auth.user.id } });
    if (!current) throw new HttpError(404, 'NOT_FOUND', 'Account not found.');
    if (current.roles.includes(role)) throw new HttpError(409, 'ROLE_ALREADY_ASSIGNED', 'This account already has that role.');

    if (role === 'VOLUNTEER') {
      return tx.user.update({
        where: { id: current.id },
        data: {
          roles: [...current.roles, role],
          volunteerProfile: {
            create: {
              homeCity: optionalString(body.homeCity, 'Home city', { max: 120 }),
              locality: optionalString(body.locality, 'Locality', { max: 120 }),
            },
          },
        },
        include: { volunteerProfile: true, organizerProfile: true },
      });
    }

    const organizationName = requiredString(body.organizationName, 'Organization name', { max: 200 });
    const credentialType = requiredString(body.credentialType, 'Credential type', { max: 120 });
    const credentialDetails = requiredString(body.credentialDetails, 'Credential details', { max: 3000 });
    if (!current.phone) throw new HttpError(400, 'PHONE_REQUIRED', 'Add a contact phone before starting organizer onboarding.');

    return tx.user.update({
      where: { id: current.id },
      data: {
        roles: [...current.roles, role],
        organizerProfile: {
          create: {
            organizationName,
            verificationStatus: 'PENDING',
            verificationRequests: { create: { credentialType, credentialDetails } },
          },
        },
      },
      include: { volunteerProfile: true, organizerProfile: true },
    });
  });

  response.status(201).json({ data: { user: publicUser(user) } });
}));

meRouter.get('/applications', requireRole('VOLUNTEER'), asyncRoute(async (request, response) => {
  const applications = await prisma.application.findMany({
    where: { volunteerId: request.auth.user.id },
    orderBy: { appliedAt: 'desc' },
    include: {
      eventShift: {
        include: {
          eventRole: {
            include: {
              event: { select: { id: true, title: true, city: true, venueAddress: true, startsAt: true, endsAt: true, status: true } },
            },
          },
        },
      },
      attendance: true,
    },
  });
  response.json({ data: applications });
}));

meRouter.get('/notifications', asyncRoute(async (request, response) => {
  const { page, pageSize, skip, take } = pagination(request.query);
  const [items, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where: { userId: request.auth.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.notification.count({ where: { userId: request.auth.user.id } }),
  ]);
  response.json({ data: items, pagination: { page, pageSize, total } });
}));

meRouter.get('/notifications/unread-count', asyncRoute(async (request, response) => {
  const count = await prisma.notification.count({ where: { userId: request.auth.user.id, readAt: null } });
  response.json({ data: { count } });
}));

meRouter.patch('/notifications/:notificationId/read', asyncRoute(async (request, response) => {
  const updated = await prisma.notification.updateMany({
    where: { id: request.params.notificationId, userId: request.auth.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  if (updated.count === 0) {
    const existing = await prisma.notification.findFirst({ where: { id: request.params.notificationId, userId: request.auth.user.id } });
    if (!existing) throw new HttpError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found.');
    return response.json({ data: existing });
  }
  const notification = await prisma.notification.findUnique({ where: { id: request.params.notificationId } });
  response.json({ data: notification });
}));
