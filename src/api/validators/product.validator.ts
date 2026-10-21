import { z } from "zod";

export const updateStockSchema = z.object({
  stock: z.number().int().nonnegative("Số lượng tồn kho không được âm"),
});

export const listProductsQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type UpdateStockInput = z.infer<typeof updateStockSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
