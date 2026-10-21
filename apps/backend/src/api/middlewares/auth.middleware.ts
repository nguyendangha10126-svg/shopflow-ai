import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { JwtService } from '../../core/auth/jwt.service';
import { UnauthorizedError, ForbiddenError } from '../../core/errors/app-error';

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Yêu cầu cung cấp Authorization Bearer Token');
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    throw new UnauthorizedError('Token xác thực không được để trống');
  }

  // Giải mã token và trích xuất thông tin người dùng cùng shop_id
  const decoded = JwtService.verifyAccessToken(token);
  req.user = decoded;

  next();
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Bạn chưa đăng nhập');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(`Vai trò '${req.user.role}' không có quyền truy cập chức năng này`);
    }

    next();
  };
};

export default {
  authenticate,
  requireRole,
};
