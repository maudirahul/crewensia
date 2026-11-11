import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticate, createSession, dummyPasswordHash, hashPassword, publicUser, verifyPassword } from '../lib/auth.js';
import { asyncRoute, HttpError, optionalString, requireEmail, requiredString, requireObject } from '../lib/http.js';

export const authRouter = Router();

authRouter.post('/signup', asyncRoute(async (request, response) => {
  const body = requireObject(request.body);
  const name = requiredString(body.name, 'Name', { max: 120 });
  const email = requireEmail(body.email);
  if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 256) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Password must be between 12 and 256 characters.');
  }
  const password = body.password;
  const phone = optionalString(body.phone, 'Phone', { max: 40 });
  const initialRole = body.initialRole;

  if (!['VOLUNTEER', 'ORGANIZER'].includes(initialRole)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'initialRole must be VOLUNTEER or ORGANIZER.');
  }

  const passwordHash = await hashPassword(password);
  let profileCreate;
  if (initialRole === 'VOLUNTEER') {
    profileCreate = {
      volunteerProfile: {
        create: {
          homeCity: optionalString(body.homeCity, 'Home city', { max: 120 }),
          locality: optionalString(body.locality, 'Locality', { max: 120 }),
        },
      },
    };
  } else {
    if (!phone) throw new HttpError(400, 'VALIDATION_ERROR', 'Phone is required for organizer onboarding.');
    const organizationName = requiredString(body.organizationName, 'Organization name', { max: 200 });
    const credentialType = requiredString(body.credentialType, 'Credential type', { max: 120 });
    const credentialDetails = requiredString(body.credentialDetails, 'Credential details', { max: 3000 });
    profileCreate = {
      organizerProfile: {
        create: {
          organizationName,
          verificationStatus: 'PENDING',
          verificationRequests: {
            create: { credentialType, credentialDetails },
          },
        },
      },
    };
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      roles: [initialRole],
      activeRole: initialRole,
      ...profileCreate,
    },
    include: { volunteerProfile: true, organizerProfile: true },
  });
  const session = await createSession(user.id);

  response.status(201).json({
    data: { user: publicUser(user), session: { token: session.token, expiresAt: session.expiresAt } },
  });
}));

authRouter.post('/login', asyncRoute(async (request, response) => {
  const body = requireObject(request.body);
  const email = requireEmail(body.email);
  if (typeof body.password !== 'string' || body.password.length < 1 || body.password.length > 256) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Password must be between 1 and 256 characters.');
  }
  const password = body.password;
  const user = await prisma.user.findUnique({
    where: { email },
    include: { volunteerProfile: true, organizerProfile: true },
  });

  const validPassword = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, await dummyPasswordHash);

  if (!user || !validPassword) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  if (user.accountStatus !== 'ACTIVE') throw new HttpError(403, 'ACCOUNT_UNAVAILABLE', 'This account is not currently active.');

  const session = await createSession(user.id);
  response.json({ data: { user: publicUser(user), session: { token: session.token, expiresAt: session.expiresAt } } });
}));

authRouter.post('/logout', authenticate(), asyncRoute(async (request, response) => {
  await prisma.session.update({ where: { id: request.auth.sessionId }, data: { revokedAt: new Date() } });
  response.status(204).end();
}));
