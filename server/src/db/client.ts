import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export interface DatabaseStatus {
  postgres: 'connected' | 'disconnected' | 'unconfigured';
  mongo: 'connected' | 'disconnected' | 'unconfigured';
}

export async function checkDatabaseConnections(): Promise<DatabaseStatus> {
  let postgres: 'connected' | 'disconnected' | 'unconfigured' = 'unconfigured';
  let mongo: 'connected' | 'disconnected' | 'unconfigured' = 'unconfigured';

  if (process.env.DATABASE_URL) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      postgres = 'connected';
    } catch {
      postgres = 'disconnected';
    }
  }

  if (process.env.MONGODB_URI) {
    try {
      if (mongoose.connection.readyState === 1) {
        mongo = 'connected';
      } else {
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
        mongo = 'connected';
      }
    } catch {
      mongo = 'disconnected';
    }
  }

  return { postgres, mongo };
}