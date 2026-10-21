import { z } from 'zod';

export const createFaqDocumentSchema = z.object({
  title: z
    .string()
    .min(2, 'Tiêu đề tài liệu phải có ít nhất 2 ký tự')
    .max(200, 'Tiêu đề tài liệu không được vượt quá 200 ký tự'),
  content_type: z.string().default('POLICIES'),
  raw_text: z
    .string()
    .min(10, 'Nội dung tài liệu chính sách phải có ít nhất 10 ký tự')
    .max(10000, 'Nội dung không được vượt quá 10.000 ký tự'),
});

export const updateFaqDocumentSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  content_type: z.string().optional(),
  raw_text: z.string().min(10).max(10000).optional(),
  is_active: z.boolean().optional(),
});

export const faqQueryRequestSchema = z.object({
  question: z
    .string()
    .min(2, 'Câu hỏi phải có ít nhất 2 ký tự')
    .max(500, 'Câu hỏi không được vượt quá 500 ký tự'),
});

export type CreateFaqDocumentDto = z.infer<typeof createFaqDocumentSchema>;
export type UpdateFaqDocumentDto = z.infer<typeof updateFaqDocumentSchema>;
export type FaqQueryRequestDto = z.infer<typeof faqQueryRequestSchema>;

