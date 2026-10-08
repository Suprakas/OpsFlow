import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { checkDatabaseConnections } from './db/client.js';
import { SEED_USERS, SEED_SERVERS } from './db/seedData.js';
import { authRouter } from './routes/authRoutes.js';
import { serverRouter } from './routes/serverRoutes.js';

export function createApp() {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));

  const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || corsOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));

  // Root healthcheck (called by native fetch)
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'opsflow-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  const apiV1 = express.Router();

  apiV1.get('/health', async (_req: Request, res: Response) => {
    const dbStatus = await checkDatabaseConnections();
    res.status(200).json({
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      databases: dbStatus,
    });
  });

  apiV1.get('/meta', async (_req: Request, res: Response) => {
    const dbStatus = await checkDatabaseConnections();
    res.status(200).json({
      service: 'OpsFlow Operations & Change Management Portal',
      phase: 'Phase 2: Auth, Sessions, Policies & Inventory',
      status: 'OPERATIONAL',
      timestamp: new Date().toISOString(),
      databases: dbStatus,
      seedFixtures: {
        totalServers: SEED_SERVERS.length,
        totalDemoUsers: SEED_USERS.length,
        users: SEED_USERS.map((u) => ({ name: u.name, email: u.email, role: u.role })),
      },
    });
  });

  // Mount API routers
  apiV1.use('/auth', authRouter);
  apiV1.use('/servers', serverRouter);

  app.use('/api/v1', apiV1);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled API Error:', err);
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected internal error occurred',
      requestId: `err-${Date.now()}`,
    });
  });

  return app;
}