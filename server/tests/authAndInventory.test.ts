import { describe, it, expect, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db/client.js';

const app = createApp();

describe('Phase 2 Acceptance Gate: Auth, Sessions, Policies & Inventory', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  let engineerToken: string;
  let adminToken: string;
  let refreshTokenCookie: string;

  // 1. Authentication Tests
  it('POST /api/v1/auth/login — succeeds with valid engineer credentials and sets HttpOnly cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'alex.engineer@opsflow.internal',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user.role).toBe('ENGINEER');
    expect(res.body.user.email).toBe('alex.engineer@opsflow.internal');

    engineerToken = res.body.accessToken;

    // Check HttpOnly refresh cookie was set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const refreshCookie = (cookies as unknown as string[]).find((c: string) => c.startsWith('opsflow_refresh='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('HttpOnly');

    refreshTokenCookie = refreshCookie!;
  });

  it('POST /api/v1/auth/login — rejects invalid password with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'alex.engineer@opsflow.internal',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('POST /api/v1/auth/refresh — rotates session and returns new access token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [refreshTokenCookie]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user.email).toBe('alex.engineer@opsflow.internal');
  });

  it('Login as Admin for policy testing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'jordan.admin@opsflow.internal',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('ADMIN');
    adminToken = res.body.accessToken;
  });

  // 2. Policy & Authorization Tests
  it('GET /api/v1/servers — returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/v1/servers');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/servers — returns 200 and paginated server list for authenticated Engineer', async () => {
    const res = await request(app)
      .get('/api/v1/servers?page=1&pageSize=10')
      .set('Authorization', `Bearer ${engineerToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(10);
    expect(res.body.pagination.total).toBe(100);
  });

  it('POST /api/v1/servers — returns 403 Forbidden when Engineer attempts to create a server', async () => {
    const res = await request(app)
      .post('/api/v1/servers')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({
        hostname: 'unauthorized-test-01.internal',
        environment: 'STAGING',
        status: 'ACTIVE',
        ownerTeam: 'Platform Engineering',
        os: 'Ubuntu 22.04 LTS',
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('POST /api/v1/servers — succeeds with 201 when Admin creates a server', async () => {
    const testHostname = `srv-admin-test-${Date.now()}.internal`;

    const res = await request(app)
      .post('/api/v1/servers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        hostname: testHostname,
        environment: 'QA',
        status: 'ACTIVE',
        ownerTeam: 'Platform Engineering',
        os: 'Debian 12 Bookworm',
      });

    expect(res.status).toBe(201);
    expect(res.body.server.hostname).toBe(testHostname);
    expect(res.body.server.environment).toBe('QA');
  });
});