import { z } from "zod";

export const draftOrderSchema = z.object({
  raw_message: z
    .string()
    .min(5, "Nội dung tin nhắn quá ngắn (tối thiểu 5 ký tự)")
    .max(
      2000,
      "Nội dung tin nhắn vượt quá giới hạn cho phép (tối đa 2.000 ký tự)",
    ),
  customer_context: z
    .object({
      suggested_phone: z.string().optional(),
    })
    .optional(),
});

export const faqAnswerSchema = z.object({
  question: z
    .string()
    .min(3, "Câu hỏi quá ngắn")
    .max(1000, "Câu hỏi vượt quá giới hạn 1.000 ký tự"),
});

export type DraftOrderInput = z.infer<typeof draftOrderSchema>;
export type FaqAnswerInput = z.infer<typeof faqAnswerSchema>;
