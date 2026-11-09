import { z } from "zod";

export const teamSchema = z.object({
  nameEn: z.string().trim().min(2).max(120),
  nameHi: z.string().trim().min(2).max(120),
  roleEn: z.string().trim().min(2).max(160),
  roleHi: z.string().trim().min(2).max(160),
  bioEn: z.string().trim().max(3000).optional().nullable(),
  bioHi: z.string().trim().max(3000).optional().nullable(),
  photoUrl: z.string().trim().max(500).optional().nullable(),
  orderIndex: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
