/// <reference path="../../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UnauthorizedError } from '../../core/errors/app-error';
import type { AuthenticatedUser } from '../../types/express';

interface JwtPayload {
  userId: string;
  shopId: string;
  role: 'OWNER' | 'STAFF';
  phone: string;
}

export const authenticateToken = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError(
      'TOKEN_MISSING',
      'Yêu cầu Bearer Access Token trong header Authorization'
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    if (!decoded.userId || !decoded.shopId || !decoded.role) {
      throw new UnauthorizedError(
        'TOKEN_INVALID_PAYLOAD',
        'Token không chứa đủ thông tin định danh shop và người dùng'
      );
    }

    req.user = {
      userId: decoded.userId,
      shopId: decoded.shopId,
      role: decoded.role,
      phone: decoded.phone
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedError('TOKEN_EXPIRED', 'Access Token đã hết hạn. Vui lòng cấp lại');
    }
    throw new UnauthorizedError('TOKEN_INVALID', 'Access Token không hợp lệ');
  }
};

