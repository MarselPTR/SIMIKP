import { z } from "zod";

export const AssignmentStatusEnum = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "SUBMITTED",
  "REVISION_REQUESTED",
  "APPROVED",
  "CANCELLED",
]);

export const createAssignmentSchema = z.object({
  activityId: z.string().min(1, "ID Kegiatan wajib diisi"),
  userId: z.string().min(1, "ID Petugas (User) wajib diisi"),
  contentTypeId: z.string().min(1, "ID Jenis Konten wajib diisi"),
  deadline: z.string({ message: "Deadline wajib diisi" }),
  instruction: z.string().optional().nullable(),
  status: AssignmentStatusEnum.default("PENDING"),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

export const queryAssignmentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  activityId: z.string().optional(),
  userId: z.string().optional(),
  contentTypeId: z.string().optional(),
  status: AssignmentStatusEnum.optional(),
  search: z.string().optional(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type QueryAssignmentsInput = z.infer<typeof queryAssignmentsSchema>;
