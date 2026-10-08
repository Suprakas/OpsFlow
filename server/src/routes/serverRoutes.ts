import { Router, Request, Response } from 'express';
import { prisma } from '../db/client.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import {
  paginationQuerySchema,
  createServerSchema,
  updateServerSchema,
  ServerEnvironment,
  ServerStatus,
} from '@opsflow/shared';

export const serverRouter = Router();

// GET /api/v1/servers — All authenticated roles can view inventory
serverRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  const queryResult = paginationQuerySchema.safeParse(req.query);
  if (!queryResult.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid pagination query parameters',
      fieldErrors: queryResult.error.flatten().fieldErrors,
    });
    return;
  }

  const { page, pageSize, search, environment, status } = queryResult.data;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (environment) {
    where.environment = environment as ServerEnvironment;
  }

  if (status) {
    where.status = status as ServerStatus;
  }

  if (search && search.trim().length > 0) {
    where.hostname = {
      contains: search.trim().toLowerCase(),
      mode: 'insensitive',
    };
  }

  const [total, servers] = await Promise.all([
    prisma.server.count({ where }),
    prisma.server.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { hostname: 'asc' },
    }),
  ]);

  res.status(200).json({
    data: servers,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

// GET /api/v1/servers/:id
serverRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;

  const server = await prisma.server.findUnique({
    where: { id },
  });

  if (!server) {
    res.status(404).json({
      code: 'SERVER_NOT_FOUND',
      message: `Server with ID '${id}' was not found`,
    });
    return;
  }

  res.status(200).json({ server });
});

// POST /api/v1/servers — Admin only
serverRouter.post('/', requireAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const parseResult = createServerSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid server payload',
      fieldErrors: parseResult.error.flatten().fieldErrors,
    });
    return;
  }

  const { hostname, environment, status, ownerTeam, os } = parseResult.data;

  // Check unique hostname
  const existing = await prisma.server.findUnique({ where: { hostname } });
  if (existing) {
    res.status(409).json({
      code: 'HOSTNAME_CONFLICT',
      message: `Server with hostname '${hostname}' already exists`,
    });
    return;
  }

  const created = await prisma.server.create({
    data: {
      hostname,
      environment,
      status,
      ownerTeam,
      os,
    },
  });

  res.status(201).json({ server: created });
});

// PATCH /api/v1/servers/:id — Admin only
serverRouter.patch('/:id', requireAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseResult = updateServerSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid update payload',
      fieldErrors: parseResult.error.flatten().fieldErrors,
    });
    return;
  }

  const server = await prisma.server.findUnique({ where: { id } });
  if (!server) {
    res.status(404).json({ code: 'SERVER_NOT_FOUND', message: 'Server not found' });
    return;
  }

  const { hostname, environment, status, ownerTeam, os, archived } = parseResult.data;

  const updated = await prisma.server.update({
    where: { id },
    data: {
      hostname: hostname ?? undefined,
      environment: environment ?? undefined,
      status: status ?? undefined,
      ownerTeam: ownerTeam ?? undefined,
      os: os ?? undefined,
      archivedAt: archived !== undefined ? (archived ? new Date() : null) : undefined,
    },
  });

  res.status(200).json({ server: updated });
});