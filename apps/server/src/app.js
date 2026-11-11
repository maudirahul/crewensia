import cors from 'cors';
import express from 'express';
import { HttpError, errorHandler } from './lib/http.js';
import { adminRouter } from './routes/admin.routes.js';
import { applicationsRouter } from './routes/applications.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { eventsRouter } from './routes/events.routes.js';
import { meRouter } from './routes/me.routes.js';
import { organizersRouter } from './routes/organizers.routes.js';

export const app = express();
const clientOrigins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean);
const allowedOrigins = new Set([...clientOrigins, 'https://client-gamma-one-36.vercel.app']);

app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)) }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'crewensia-api' });
});

app.use('/api/auth', authRouter);
app.use('/api/me', meRouter);
app.use('/api/organizers', organizersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/events', eventsRouter);
app.use('/api', applicationsRouter);

app.use((_request, _response, next) => next(new HttpError(404, 'ROUTE_NOT_FOUND', 'API route not found.')));
app.use(errorHandler);
