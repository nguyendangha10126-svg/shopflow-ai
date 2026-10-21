/// <reference path="../../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../../core/errors/app-error';

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('UNAUTHORIZED', 'Người dùng chưa được xác thực');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        'INSUFFICIENT_PERMISSIONS',
        `Hành động này yêu cầu một trong các quyền: [${allowedRoles.join(', ')}]. Vai trò hiện tại của bạn là: ${req.user.role}`
      );
    }

    next();
  };
};
