import { randomUUID } from 'crypto';
import { prisma } from '../db/client.js';
import { hashRefreshToken, generateRefreshToken, signAccessToken, TokenPayload } from './jwt.js';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'ENGINEER' | 'APPROVER' | 'ADMIN';
    isActive: boolean;
  };
}

export async function createSession(userId: string): Promise<SessionResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) {
    throw new Error('User not found or inactive');
  }

  const rawRefreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const familyId = randomUUID();
  const expiry = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await prisma.refreshSession.create({
    data: {
      userId: user.id,
      tokenHash,
      familyId,
      expiry,
    },
  });

  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const accessToken = signAccessToken(tokenPayload);

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    },
  };
}

export async function rotateSession(rawRefreshToken: string): Promise<SessionResult> {
  const incomingHash = hashRefreshToken(rawRefreshToken);

  const existingSession = await prisma.refreshSession.findFirst({
    where: { tokenHash: incomingHash },
    include: { user: true },
  });

  // Token not found
  if (!existingSession) {
    throw new Error('INVALID_REFRESH_TOKEN');
  }

  // Token reuse detection: if a revoked or replaced token is presented, revoke the entire family!
  if (existingSession.revokedAt || (existingSession.replacedById && existingSession.replacedById !== null)) {
    console.warn(`[Security Alert] Potential token reuse detected for family ${existingSession.familyId}. Revoking family.`);
    await prisma.refreshSession.updateMany({
      where: { familyId: existingSession.familyId },
      data: { revokedAt: new Date() },
    });
    throw new Error('REVOKED_REFRESH_TOKEN');
  }

  // Check expiration
  if (existingSession.expiry < new Date()) {
    await prisma.refreshSession.update({
      where: { id: existingSession.id },
      data: { revokedAt: new Date() },
    });
    throw new Error('EXPIRED_REFRESH_TOKEN');
  }

  const user = existingSession.user;
  if (!user || !user.isActive) {
    throw new Error('USER_INACTIVE');
  }

  // Issue new token and mark previous session replaced
  const newRawRefreshToken = generateRefreshToken();
  const newHash = hashRefreshToken(newRawRefreshToken);
  const newExpiry = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  const newSession = await prisma.refreshSession.create({
    data: {
      userId: user.id,
      tokenHash: newHash,
      familyId: existingSession.familyId, // Maintain family
      expiry: newExpiry,
    },
  });

  await prisma.refreshSession.update({
    where: { id: existingSession.id },
    data: {
      replacedById: newSession.id,
      revokedAt: new Date(),
    },
  });

  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  return {
    accessToken: signAccessToken(tokenPayload),
    refreshToken: newRawRefreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    },
  };
}

export async function revokeSession(rawRefreshToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(rawRefreshToken);
  await prisma.refreshSession.updateMany({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  });
}