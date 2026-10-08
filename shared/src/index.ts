import { z } from 'zod';

// ==============================================================================
// Enums
// ==============================================================================

export const UserRoleEnum = z.enum(['ENGINEER', 'APPROVER', 'ADMIN']);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const ServerEnvironmentEnum = z.enum(['PROD', 'STAGING', 'QA', 'DR']);
export type ServerEnvironment = z.infer<typeof ServerEnvironmentEnum>;

export const ServerStatusEnum = z.enum(['ACTIVE', 'MAINTENANCE', 'DECOMMISSIONED']);
export type ServerStatus = z.infer<typeof ServerStatusEnum>;

export const ChangeStatusEnum = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
]);
export type ChangeStatus = z.infer<typeof ChangeStatusEnum>;

export const ApprovalDecisionEnum = z.enum(['APPROVED', 'REJECTED']);
export type ApprovalDecision = z.infer<typeof ApprovalDecisionEnum>;

// ==============================================================================
// User Contracts
// ==============================================================================

export const userDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: UserRoleEnum,
  isActive: z.boolean(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});
export type UserDto = z.infer<typeof userDtoSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email().transform((val) => val.trim().toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

// ==============================================================================
// Server Contracts
// ==============================================================================

export const serverDtoSchema = z.object({
  id: z.string().uuid(),
  hostname: z.string().min(3).max(100),
  environment: ServerEnvironmentEnum,
  status: ServerStatusEnum,
  ownerTeam: z.string().min(1).max(100),
  os: z.string().min(1).max(100),
  archivedAt: z.string().datetime().or(z.date()).nullable().optional(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});
export type ServerDto = z.infer<typeof serverDtoSchema>;

export const createServerSchema = z.object({
  hostname: z.string().trim().min(3).max(100),
  environment: ServerEnvironmentEnum,
  status: ServerStatusEnum.default('ACTIVE'),
  ownerTeam: z.string().trim().min(1).max(100),
  os: z.string().trim().min(1).max(100),
});
export type CreateServerInput = z.infer<typeof createServerSchema>;

export const updateServerSchema = createServerSchema.partial().extend({
  archived: z.boolean().optional(),
});
export type UpdateServerInput = z.infer<typeof updateServerSchema>;

// ==============================================================================
// Change Request Contracts
// ==============================================================================

const scheduleRefinement = (
  data: { startAt?: string | Date | null; endAt?: string | Date | null },
  ctx: z.RefinementCtx
) => {
  if (data.startAt && data.endAt) {
    const start = new Date(data.startAt).getTime();
    const end = new Date(data.endAt).getTime();
    if (isNaN(start) || isNaN(end)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endAt'],
        message: 'Invalid schedule dates',
      });
    } else if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endAt'],
        message: 'End date and time must be strictly after start date and time',
      });
    }
  }
};

export const saveDraftSchema = z
  .object({
    title: z.string().trim().max(120).optional(),
    description: z.string().trim().max(5000).optional(),
    serverIds: z.array(z.string().uuid()).optional(),
    startAt: z.string().datetime().or(z.date()).nullable().optional(),
    endAt: z.string().datetime().or(z.date()).nullable().optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    implementationPlan: z.string().trim().max(10000).optional(),
    rollbackPlan: z.string().trim().max(10000).optional(),
  })
  .superRefine(scheduleRefinement);
export type SaveDraftInput = z.infer<typeof saveDraftSchema>;

export const submitRequestSchema = z
  .object({
    title: z.string().trim().min(5).max(120),
    description: z.string().trim().min(20).max(5000),
    serverIds: z.array(z.string().uuid()).min(1),
    startAt: z.string().datetime().or(z.date()),
    endAt: z.string().datetime().or(z.date()),
    assigneeId: z.string().uuid(),
    implementationPlan: z.string().trim().min(10).max(10000),
    rollbackPlan: z.string().trim().min(10).max(10000),
    expectedVersion: z.number().int().nonnegative(),
  })
  .superRefine((data, ctx) => {
    scheduleRefinement(data, ctx);
    const start = new Date(data.startAt).getTime();
    if (!isNaN(start) && start < Date.now() - 5 * 60 * 1000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startAt'],
        message: 'Maintenance window start time must be in the future',
      });
    }
  });
export type SubmitRequestInput = z.infer<typeof submitRequestSchema>;

export const decisionSchema = z
  .object({
    decision: ApprovalDecisionEnum,
    reason: z.string().trim().max(2000).optional(),
    expectedVersion: z.number().int().nonnegative(),
  })
  .superRefine((data, ctx) => {
    if (data.decision === 'REJECTED' && (!data.reason || data.reason.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: 'A detailed reason is required when rejecting a change request',
      });
    }
  });
export type DecisionInput = z.infer<typeof decisionSchema>;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  status: z.string().optional(),
  environment: z.string().optional(),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;