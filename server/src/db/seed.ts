import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import { SEED_USERS, DEFAULT_PASSWORD_HASH, SEED_SERVERS } from './seedData.js';
// import { CommentModel, NotificationModel, ActivityItemModel } from '../models/index.js';

const prisma = new PrismaClient();

export async function runSeed() {
  console.log('--- Starting OpsFlow Deterministic Database Seed ---');

  console.log(`Seeding ${SEED_USERS.length} demo users...`);
  for (const user of SEED_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        passwordHash: DEFAULT_PASSWORD_HASH,
      },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        passwordHash: DEFAULT_PASSWORD_HASH,
      },
    });
  }
  console.log('✓ Users seeded.');

  console.log(`Seeding ${SEED_SERVERS.length} synthetic servers...`);
  for (const server of SEED_SERVERS) {
    await prisma.server.upsert({
      where: { hostname: server.hostname },
      update: {
        environment: server.environment,
        status: server.status,
        ownerTeam: server.ownerTeam,
        os: server.os,
        archivedAt: server.archivedAt,
      },
      create: {
        id: server.id,
        hostname: server.hostname,
        environment: server.environment,
        status: server.status,
        ownerTeam: server.ownerTeam,
        os: server.os,
        archivedAt: server.archivedAt,
      },
    });
  }
  console.log('✓ 100 Servers seeded.');

  if (process.env.MONGODB_URI) {
    try {
      console.log('Connecting to MongoDB for supporting projections seed...');
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
      console.log('✓ MongoDB connected.');
      await mongoose.disconnect();
    } catch {
      console.warn('Notice: MongoDB not reachable during seed. Skipping Mongo projections.');
    }
  }

  console.log('--- Database Seeding Complete ---');
}

runSeed()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });