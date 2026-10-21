import { z } from 'zod';

export const createFaqDocSchema = z.object({
  title: z.string().min(2, 'Tiêu đề tài liệu phải có ít nhất 2 ký tự').max(200),
  raw_text: z.string().min(10, 'Nội dung tài liệu chính sách quá ngắn (tối thiểu 10 ký tự)'),
  content_type: z.enum(['POLICIES', 'SIZE_CHART', 'SHIPPING', 'PROMOTIONS']).default('POLICIES')
});

export type CreateFaqDocInput = z.infer<typeof createFaqDocSchema>;

