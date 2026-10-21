import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Họ tên khách hàng phải có ít nhất 2 ký tự').max(100),
  phone: z.string().regex(/^[0-9+]{9,15}$/, 'Số điện thoại không hợp lệ (9-15 chữ số)'),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^[0-9+]{9,15}$/)
    .optional(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
export type CustomerQueryDto = z.infer<typeof customerQuerySchema>;
