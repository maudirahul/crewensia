export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function asyncRoute(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}

export function requireObject(value, label = 'Request body') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'INVALID_BODY', `${label} must be a JSON object.`);
  }
  return value;
}

export function requiredString(value, label, { min = 1, max = 5000 } = {}) {
  if (typeof value !== 'string') throw new HttpError(400, 'VALIDATION_ERROR', `${label} is required.`);
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${label} must be between ${min} and ${max} characters.`);
  }
  return normalized;
}

export function optionalString(value, label, { max = 5000 } = {}) {
  if (value === undefined || value === null || value === '') return null;
  return requiredString(value, label, { min: 0, max });
}

export function parseDate(value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${label} must be an ISO date-time string.`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${label} must be an ISO date-time string.`);
  }
  return date;
}

export function requireEmail(value) {
  const email = requiredString(value, 'Email', { max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Email must be a valid email address.');
  }
  return email;
}

export function pagination(query) {
  const page = Number.parseInt(query.page ?? '1', 10);
  const pageSize = Number.parseInt(query.pageSize ?? '20', 10);
  if (!Number.isInteger(page) || page < 1) throw new HttpError(400, 'VALIDATION_ERROR', 'page must be a positive integer.');
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'pageSize must be between 1 and 50.');
  }
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function errorHandler(error, _request, response, _next) {
  if (error instanceof HttpError) {
    const body = { error: { code: error.code, message: error.message } };
    if (error.details !== undefined) body.error.details = error.details;
    return response.status(error.status).json(body);
  }

  if (error?.code === 'P2002') {
    return response.status(409).json({
      error: { code: 'ALREADY_EXISTS', message: 'A record with those details already exists.' },
    });
  }

  if (error?.code === 'P2025') {
    return response.status(404).json({ error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' } });
  }

  if (error?.code === 'P2034') {
    return response.status(409).json({
      error: { code: 'CONCURRENT_UPDATE', message: 'The record changed while this request was being processed. Please retry.' },
    });
  }

  if (error?.type === 'entity.parse.failed') {
    return response.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } });
  }
  if (error?.status === 413 || error?.type === 'entity.too.large') {
    return response.status(413).json({ error: { code: 'BODY_TOO_LARGE', message: 'Request body is too large.' } });
  }

  console.error(error);
  return response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } });
}
