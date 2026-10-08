import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRole } from '@opsflow/shared';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'dev_access_secret_min_32_chars_replace_in_prod';
const JWT_ISSUER = process.env.JWT_ISSUER || 'opsflow-auth';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'opsflow-api';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_HASH_SECRET || 'dev_refresh_hash_secret_replace_in_prod';

// Access Token: 15 minutes lifetime, kept only in client memory
export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m',
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithm: 'HS256',
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithms: ['HS256'],
  }) as TokenPayload;
}

// Generate random cryptographically secure refresh token
export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

// Hash refresh token for storage in PostgreSQL
export function hashRefreshToken(token: string): string {
  return crypto.createHmac('sha256', REFRESH_SECRET).update(token).digest('hex');
}