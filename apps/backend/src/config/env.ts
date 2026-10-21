import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Nạp file .env từ thư mục gốc hoặc thư mục cục bộ
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL không được để trống'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET phải có độ dài tối thiểu 16 ký tự')
    .default('shopflow_super_secret_jwt_key_2026_change_in_production_min32chars'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  AI_PROVIDER: z.enum(['mock', 'gemini']).default('mock'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
  AI_TIMEOUT_MS: z.coerce.number().default(8000),
  AI_MAX_RETRIES: z.coerce.number().default(1),
  AI_TEMPERATURE: z.coerce.number().default(0.1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌ [FAIL-FAST] LỖI CẤU HÌNH BIẾN MÔI TRƯỜNG (.env):');
  parsed.error.issues.forEach((issue) => {
    console.error(` • Trường [${issue.path.join('.')}]: ${issue.message}`);
  });
  console.error('👉 Hãy kiểm tra lại file .env hoặc sao chép từ .env.example!\n');
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
