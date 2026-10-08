import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/client.js';
import { loginRequestSchema } from '@opsflow/shared';
import { createSession, rotateSession, revokeSession } from '../auth/sessionService.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const authRouter = Router();

const COOKIE_NAME = 'opsflow_refresh';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Helper to set HttpOnly refresh cookie
function setRefreshCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PRODUCTION && process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// POST /api/v1/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  const parseResult = loginRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid login payload',
      fieldErrors: parseResult.error.flatten().fieldErrors,
    });
    return;
  }

  const { email, password } = parseResult.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    res.status(401).json({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    });
    return;
  }

  const session = await createSession(user.id);
  setRefreshCookie(res, session.refreshToken);

  res.status(200).json({
    accessToken: session.accessToken,
    user: session.user,
  });
});

// POST /api/v1/auth/refresh
authRouter.post('/refresh', async (req: Request, res: Response) => {
  const rawRefreshToken = req.cookies[COOKIE_NAME];

  if (!rawRefreshToken) {
    res.status(401).json({
      code: 'REFRESH_TOKEN_MISSING',
      message: 'Refresh token cookie not found',
    });
    return;
  }

  try {
    const session = await rotateSession(rawRefreshToken);
    setRefreshCookie(res, session.refreshToken);

    res.status(200).json({
      accessToken: session.accessToken,
      user: session.user,
    });
  } catch (err: unknown) {
    res.clearCookie(COOKIE_NAME, { path: '/api/v1/auth' });
    const message = err instanceof Error ? err.message : 'FAILED_REFRESH';
    res.status(401).json({
      code: message,
      message: 'Failed to refresh authentication session',
    });
  }
});

// POST /api/v1/auth/logout
authRouter.post('/logout', async (req: Request, res: Response) => {
  const rawRefreshToken = req.cookies[COOKIE_NAME];
  if (rawRefreshToken) {
    await revokeSession(rawRefreshToken).catch(() => {});
  }

  res.clearCookie(COOKIE_NAME, { path: '/api/v1/auth' });
  res.status(200).json({ status: 'ok', message: 'Logged out successfully' });
});

// GET /api/v1/auth/me
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user || !user.isActive) {
    res.status(404).json({ code: 'USER_NOT_FOUND', message: 'User does not exist or is deactivated' });
    return;
  }

  res.status(200).json({ user });
});