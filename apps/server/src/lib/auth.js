import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { prisma } from '../db.js';
import { HttpError } from './http.js';

const scrypt = promisify(scryptCallback);
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const SCRYPT_KEY_LENGTH = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, SCRYPT_KEY_LENGTH);
  return `scrypt$${salt.toString('base64url')}$${Buffer.from(derivedKey).toString('base64url')}`;
}

export const dummyPasswordHash = hashPassword(randomBytes(32).toString('hex'));

export async function verifyPassword(password, encodedHash) {
  const [algorithm, saltText, keyText] = encodedHash.split('$');
  if (algorithm !== 'scrypt' || !saltText || !keyText) return false;
  const salt = Buffer.from(saltText, 'base64url');
  const expected = Buffer.from(keyText, 'base64url');
  const actual = Buffer.from(await scrypt(password, salt, expected.length));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
  await prisma.session.create({ data: { userId, tokenHash: hashSessionToken(token), expiresAt } });
  return { token, expiresAt };
}

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
    name: user.name,
    phone: user.phone,
    roles: user.roles,
    activeRole: user.activeRole,
    accountStatus: user.accountStatus,
    volunteerProfile: user.volunteerProfile
      ? {
          homeCity: user.volunteerProfile.homeCity,
          locality: user.volunteerProfile.locality,
          skills: user.volunteerProfile.skills,
        }
      : null,
    organizerProfile: user.organizerProfile
      ? {
          organizationName: user.organizerProfile.organizationName,
          verificationStatus: user.organizerProfile.verificationStatus,
        }
      : null,
    createdAt: user.createdAt,
  };
}

function bearerToken(request) {
  const value = request.headers.authorization;
  if (!value) return null;
  const match = /^Bearer\s+([^\s]+)$/i.exec(value);
  if (!match) throw new HttpError(401, 'INVALID_AUTHORIZATION', 'Authorization must use a Bearer token.');
  return match[1];
}

export async function loadAuth(request, { required = true } = {}) {
  const token = bearerToken(request);
  if (!token) {
    if (!required) return null;
    throw new HttpError(401, 'AUTHENTICATION_REQUIRED', 'Sign in to continue.');
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: { include: { volunteerProfile: true, organizerProfile: true } } },
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    throw new HttpError(401, 'INVALID_SESSION', 'Your session is invalid or has expired. Sign in again.');
  }
  if (session.user.accountStatus !== 'ACTIVE') {
    throw new HttpError(403, 'ACCOUNT_UNAVAILABLE', 'This account is not currently active.');
  }

  return { user: session.user, sessionId: session.id };
}

export function authenticate({ required = true } = {}) {
  return async (request, _response, next) => {
    try {
      request.auth = await loadAuth(request, { required });
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireRole(role) {
  return (request, _response, next) => {
    if (!request.auth?.user?.roles.includes(role)) {
      return next(new HttpError(403, 'ROLE_REQUIRED', `${role.toLowerCase()} access is required.`));
    }
    next();
  };
}

export function requireActiveRole(role) {
  return (request, _response, next) => {
    if (request.auth?.user?.activeRole !== role) {
      return next(new HttpError(403, 'SWITCH_ROLE', `Switch to ${role.toLowerCase()} mode to continue.`));
    }
    next();
  };
}
