import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL là bắt buộc'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET phải có ít nhất 16 ký tự'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  AI_PROVIDER: z.enum(['gemini', 'mock']).default('mock'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
  AI_TIMEOUT_MS: z.coerce.number().default(8000),
  AI_MAX_RETRIES: z.coerce.number().default(1),
  AI_TEMPERATURE: z.coerce.number().default(0.1),
  FRONTEND_URL: z.string().default('http://localhost:3000')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Lỗi nạp biến môi trường không hợp lệ:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;

