import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../core/errors/app-error';
import { logger } from '../../core/logger';
import { env } from '../../config/env';

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
    message = 'Kích thước dữ liệu gửi lên vượt quá giới hạn cho phép (1MB)';
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
