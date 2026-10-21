import { z } from 'zod';

export const createVariantSchema = z.object({
  sku: z.string().min(1, 'SKU không được để trống').max(100),
  variant_name: z.string().min(1, 'Tên phân loại không được để trống').max(150),
  size: z.string().max(30).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  price_vnd: z.number().int().min(0, 'Giá bán phải lớn hơn hoặc bằng 0'),
  stock: z.number().int().min(0, 'Tồn kho không được âm'),
  low_stock_threshold: z.number().int().min(0).default(5),
});

export const createProductSchema = z.object({
  name: z.string().min(2, 'Tên sản phẩm phải có ít nhất 2 ký tự').max(200),
  category: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  variants: z
    .array(createVariantSchema)
    .min(1, 'Sản phẩm phải có ít nhất một biến thể hoặc kích cỡ'),
});

export const updateProductSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  category: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

export const updateVariantSchema = z.object({
  price_vnd: z.number().int().min(0, 'Giá bán không được âm').optional(),
  stock: z.number().int().min(0, 'Tồn kho không được âm').optional(),
  low_stock_threshold: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  low_stock: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
export type UpdateVariantDto = z.infer<typeof updateVariantSchema>;
export type ProductQueryDto = z.infer<typeof productQuerySchema>;
