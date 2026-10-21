export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_SERVER_ERROR',
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Dữ liệu yêu cầu không hợp lệ', code = 'BAD_REQUEST', details?: unknown) {
    super(message, 400, code, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message = 'Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn',
    code = 'UNAUTHORIZED'
  ) {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Bạn không có quyền thực hiện hành động này', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Không tìm thấy tài nguyên yêu cầu', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(
    message = 'Xung đột dữ liệu hoặc tài nguyên đã tồn tại',
    code = 'CONFLICT',
    details?: unknown
  ) {
    super(message, 409, code, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Dữ liệu không thỏa mãn quy tắc kiểm tra', details?: unknown) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(
    message = 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau',
    code = 'TOO_MANY_REQUESTS'
  ) {
    super(message, 429, code);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(
    message = 'Không thể xử lý thực thể yêu cầu',
    code = 'UNPROCESSABLE_ENTITY',
    details?: unknown
  ) {
    super(message, 422, code, details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(
    message = 'Dịch vụ tạm thời không khả dụng',
    code = 'SERVICE_UNAVAILABLE',
    details?: unknown
  ) {
    super(message, 503, code, details);
  }
}
