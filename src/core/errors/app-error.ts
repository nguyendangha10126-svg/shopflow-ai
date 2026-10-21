export interface ErrorDetail {
  field?: string;
  message: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: ErrorDetail[];

  constructor(statusCode: number, code: string, message: string, details?: ErrorDetail[]) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(code: string = 'BAD_REQUEST', message: string = 'Yêu cầu không hợp lệ', details?: ErrorDetail[]) {
    super(400, code, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(code: string = 'UNAUTHORIZED', message: string = 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn') {
    super(401, code, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(code: string = 'FORBIDDEN', message: string = 'Bạn không có quyền thực hiện hành động này') {
    super(403, code, message);
  }
}

export class NotFoundError extends AppError {
  constructor(code: string = 'NOT_FOUND', message: string = 'Không tìm thấy tài nguyên yêu cầu') {
    super(404, code, message);
  }
}

export class ConflictError extends AppError {
  constructor(code: string = 'CONFLICT', message: string = 'Dữ liệu bị xung đột hoặc đã tồn tại') {
    super(409, code, message);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(code: string = 'UNPROCESSABLE_ENTITY', message: string = 'Không thể xử lý nội dung dữ liệu') {
    super(422, code, message);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(code: string = 'TOO_MANY_REQUESTS', message: string = 'Quá nhiều yêu cầu. Vui lòng thử lại sau') {
    super(429, code, message);
  }
}

export class InternalServerError extends AppError {
  constructor(code: string = 'INTERNAL_SERVER_ERROR', message: string = 'Đã có lỗi xảy ra từ phía hệ thống') {
    super(500, code, message);
  }
}

