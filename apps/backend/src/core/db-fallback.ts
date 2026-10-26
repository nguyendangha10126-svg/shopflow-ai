import { env } from '../config/env';

/**
 * Lỗi do KHÔNG kết nối được tới PostgreSQL (DB tắt, sai DATABASE_URL, mạng...).
 */
export function isDbConnectionError(err: any): boolean {
  if (!err) return false;
  const msg: string = typeof err.message === 'string' ? err.message : '';
  return (
    err.name === 'PrismaClientInitializationError' ||
    msg.includes("Can't reach database server") ||
    err.code === 'P1001' ||
    err.code === 'P1002' ||
    err.code === 'P1017'
  );
}

/**
 * Lỗi do DB chưa được migrate (thiếu bảng/cột). Hay gặp khi quên chạy prisma migrate.
 */
export function isDbSchemaError(err: any): boolean {
  return !!err && (err.code === 'P2021' || err.code === 'P2022');
}

/**
 * Chỉ cho phép dùng dữ liệu mẫu trong bộ nhớ khi DEMO_MODE=true VÀ DB thật sự không kết nối được.
 * Mặc định (DEMO_MODE=false) hàm này luôn trả false => lỗi được ném ra và API trả 503,
 * giao diện hiện thông báo lỗi thật thay vì số liệu giả.
 */
export function shouldUseDemoFallback(err: any): boolean {
  return env.DEMO_MODE === true && isDbConnectionError(err);
}
