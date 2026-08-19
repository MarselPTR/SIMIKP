import { z } from "zod";

export const PriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const ActivityStatusEnum = z.enum([
  "DRAFT",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const createActivitySchema = z.object({
  activityCode: z.string().min(3).max(100).optional(),
  title: z.string().min(3, "Judul kegiatan minimal 3 karakter").max(255),
  strakomNumber: z.string().max(100).optional().nullable(),
  activityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  activityTime: z.string().max(50).optional().nullable(),
  locationId: z.string().optional().nullable(),
  priority: PriorityEnum.default("MEDIUM"),
  status: ActivityStatusEnum.default("SCHEDULED"),
  description: z.string().optional().nullable(),
  strategicIssueIds: z.array(z.string()).optional().default([]),
  personIds: z.array(z.string()).optional().default([]),
  keywordIds: z.array(z.string()).optional().default([]),
});

export const updateActivitySchema = createActivitySchema.partial();

export const queryActivitiesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: ActivityStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  locationId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(["activityDate", "createdAt", "title"]).default("activityDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type QueryActivitiesInput = z.infer<typeof queryActivitiesSchema>;
