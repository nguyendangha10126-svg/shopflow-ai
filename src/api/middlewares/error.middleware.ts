import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../core/errors/app-error';

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 1. Lỗi nghiệp vụ có chủ đích (AppError)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && err.details.length > 0 ? { details: err.details } : {})
      }
    });
    return;
  }

  // 2. Lỗi validation định dạng dữ liệu (ZodError)
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));

    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu đầu vào không hợp lệ',
        details
      }
    });
    return;
  }

  // 3. Lỗi Prisma ORM (Database Constraints)
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      res.status(409).json({
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'Dữ liệu đã tồn tại trong hệ thống (vi phạm khóa duy nhất)'
        }
      });
      return;
    }
  }

  // 4. Lỗi máy chủ không xác định (Internal Server Error)
  console.error('Unhandled System Exception:', err);

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'Đã xảy ra lỗi nội bộ máy chủ'
          : err.message || 'Lỗi hệ thống'
    }
  });
};

