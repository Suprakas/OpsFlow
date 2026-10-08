import bcrypt from 'bcryptjs';

export const SEED_USERS = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Alex Rivera',
    email: 'alex.engineer@opsflow.internal',
    role: 'ENGINEER' as const,
    isActive: true,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Sam Chen',
    email: 'sam.approver@opsflow.internal',
    role: 'APPROVER' as const,
    isActive: true,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Jordan Taylor',
    email: 'jordan.admin@opsflow.internal',
    role: 'ADMIN' as const,
    isActive: true,
  },
];

export const DEFAULT_PASSWORD = 'Password123!';
export const DEFAULT_PASSWORD_HASH = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

const TEAMS = ['Platform Engineering', 'Core Infrastructure', 'Data Platform', 'Edge & Networking', 'Security Operations'];
const OS_LIST = ['Ubuntu 22.04 LTS', 'Ubuntu 24.04 LTS', 'Red Hat Enterprise Linux 9.2', 'Debian 12 Bookworm', 'Rocky Linux 9'];
const ROLES = ['web', 'api', 'db', 'cache', 'queue', 'worker', 'mon', 'auth'];

export function generateSyntheticServers() {
  const servers = [];
  const envs = ['PROD', 'STAGING', 'QA', 'DR'] as const;

  for (let i = 1; i <= 100; i++) {
    const pad = String(i).padStart(3, '0');
    const env = envs[(i - 1) % envs.length];
    const role = ROLES[(i - 1) % ROLES.length];
    const team = TEAMS[(i - 1) % TEAMS.length];
    const os = OS_LIST[(i - 1) % OS_LIST.length];

    let status: 'ACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED' = 'ACTIVE';
    if (i % 17 === 0) status = 'MAINTENANCE';
    if (i % 31 === 0) status = 'DECOMMISSIONED';

    const hostname = `${role}-${env.toLowerCase()}-${pad}.internal`;
    const id = `a0000000-0000-4000-8000-${String(i).padStart(12, '0')}`;

    servers.push({
      id,
      hostname,
      environment: env,
      status,
      ownerTeam: team,
      os,
      archivedAt: status === 'DECOMMISSIONED' ? new Date('2026-09-01T00:00:00Z') : null,
    });
  }

  return servers;
}

export const SEED_SERVERS = generateSyntheticServers();