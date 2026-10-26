import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../core/errors/app-error';
import { logger } from '../../core/logger';
import { env } from '../../config/env';
import { isDbConnectionError, isDbSchemaError } from '../../core/db-fallback';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 1. Phân loại lỗi
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Đã có lỗi xảy ra trên hệ thống. Vui lòng thử lại sau';
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof SyntaxError && 'body' in err) {
    // Lỗi JSON body sai định dạng cú pháp
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Dữ liệu JSON gửi lên không đúng định dạng';
  } else if (err.message && err.message.includes('CORS')) {
    statusCode = 403;
    code = 'CORS_FORBIDDEN';
    message = err.message;
  } else if ((err as any).type === 'entity.too.large') {
    // Lỗi kích thước body vượt quá giới hạn
    statusCode = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Kích thước dữ liệu gửi lên vượt quá giới hạn cho phép';
  } else if (isDbConnectionError(err)) {
    // DB không kết nối được: báo 503 rõ ràng, KHÔNG trả dữ liệu giả
    statusCode = 503;
    code = 'DB_UNAVAILABLE';
    message = 'Không kết nối được cơ sở dữ liệu. Vui lòng kiểm tra PostgreSQL đang chạy rồi thử lại';
    logger.error({ err, url: req.originalUrl }, '🔌 [DB] Không kết nối được PostgreSQL');
  } else if (isDbSchemaError(err)) {
    // Thiếu bảng/cột: thường do chưa chạy migration
    statusCode = 503;
    code = 'DB_NOT_MIGRATED';
    message = 'Cơ sở dữ liệu chưa được cập nhật cấu trúc. Hãy chạy: npm run prisma:deploy';
    logger.error({ err, url: req.originalUrl }, '🗄️ [DB] Thiếu bảng/cột - chưa migrate');
  } else {
    // Lỗi hệ thống chưa được kiểm soát
    logger.error(
      {
        err,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
      },
      `🔥 [Unhandled Error] ${err.message}`
    );
  }

  // 2. Định dạng phản hồi chuẩn OpenAPI
  const errorResponse: {
    error: {
      code: string;
      message: string;
      details?: unknown;
      stack?: string;
    };
  } = {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
      // Tuyệt đối không để lộ stack trace ra ngoài production
      ...(env.NODE_ENV === 'development' && statusCode === 500 ? { stack: err.stack } : {}),
    },
  };

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;
