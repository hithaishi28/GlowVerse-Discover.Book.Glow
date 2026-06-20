import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { apiRoutes } from './routes/index.js';
import { errorHandler, notFound } from './utils/errors.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }), apiRoutes);
app.use(notFound);
app.use(errorHandler);
