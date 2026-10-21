import { z } from 'zod';

// 1. Zod Schema kiểm tra dữ liệu yêu cầu từ Client
export const createDraftOrderRequestSchema = z.object({
  message: z
    .string()
    .min(3, 'Tin nhắn phải có ít nhất 3 ký tự')
    .max(2000, 'Tin nhắn không được vượt quá 2000 ký tự'),
  scenario: z
    .enum(['success', 'malformed_json', 'timeout', 'error', 'injection', 'ambiguous'])
    .optional(),
});

export type CreateDraftOrderRequestDto = z.infer<typeof createDraftOrderRequestSchema>;

// 2. Schema Zod nghiêm ngặt cho cấu trúc JSON do AI trả về
export const aiCustomerOutputSchema = z.object({
  name: z.string().nullable().default(null),
  phone: z.string().nullable().default(null),
  address: z.string().nullable().default(null),
});

export const aiOrderItemOutputSchema = z.object({
  raw_text: z.string(),
  product_name_query: z.string().min(1, 'Tên tìm kiếm sản phẩm không được rỗng'),
  variant_attributes: z
    .object({
      size: z.string().optional(),
      color: z.string().optional(),
    })
    .default({}),
  quantity: z.number().int().min(1).default(1),
});

export const aiDraftOrderOutputSchema = z.object({
  intent: z.enum(['ORDER_CREATE', 'ORDER_INQUIRY', 'PRICE_ASK', 'OTHER']),
  confidence: z.number().min(0).max(1),
  customer: aiCustomerOutputSchema,
  items: z.array(aiOrderItemOutputSchema).default([]),
  needs_clarification: z.boolean().default(false),
  questions_for_staff: z.array(z.string()).default([]),
  warning_flags: z.array(z.string()).default([]),
});

export type AICustomerOutput = z.infer<typeof aiCustomerOutputSchema>;
export type AIOrderItemOutput = z.infer<typeof aiOrderItemOutputSchema>;
export type AIDraftOrderOutput = z.infer<typeof aiDraftOrderOutputSchema>;

