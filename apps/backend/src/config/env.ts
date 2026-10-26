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
  // KHÔNG có giá trị mặc định ở đây. Xem phần kiểm tra bên dưới.
  JWT_SECRET: z.string().optional().default(''),
  // Chế độ DEMO: chỉ dùng khi trình diễn không có CSDL. TUYỆT ĐỐI không bật ở production.
  // Số lớp proxy phía trước backend (Nginx trong Docker = 1, chạy trực tiếp = 0)
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
  DEMO_MODE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
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

const DEV_ONLY_JWT_SECRET = 'dev_only_secret_khong_dung_o_production_0123456789abcdef';
const data = parsed.data;

if (data.NODE_ENV === 'production') {
  const problems: string[] = [];
  if (!data.JWT_SECRET || data.JWT_SECRET.length < 32) {
    problems.push('JWT_SECRET bắt buộc phải đặt và dài tối thiểu 32 ký tự ở production');
  }
  if (data.DEMO_MODE) {
    problems.push('DEMO_MODE=true bị cấm ở production (sẽ cho phép dữ liệu giả và đăng nhập demo)');
  }
  if (problems.length > 0) {
    console.error('\n❌ [FAIL-FAST] CẤU HÌNH PRODUCTION KHÔNG AN TOÀN:');
    problems.forEach((m) => console.error(` • ${m}`));
    process.exit(1);
  }
} else if (!data.JWT_SECRET || data.JWT_SECRET.length < 16) {
  console.warn('⚠️  JWT_SECRET chưa đặt hoặc quá ngắn: đang dùng khóa tạm chỉ dành cho máy dev.');
}

export const env = {
  ...data,
  JWT_SECRET:
    data.JWT_SECRET && data.JWT_SECRET.length >= 16 ? data.JWT_SECRET : DEV_ONLY_JWT_SECRET,
};
export type Env = typeof env;
