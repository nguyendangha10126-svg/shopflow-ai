import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { validate } from '../middlewares/validate.middleware';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { ConflictError, ForbiddenError } from '../../core/errors/app-error';

const router = Router();

const testUserSchema = z.object({
  name: z.string().min(2, 'Tên phải có tối thiểu 2 ký tự'),
  email: z.string().email('Email không đúng định dạng'),
});

router.post('/validate', validate({ body: testUserSchema }), (req: Request, res: Response) => {
  res.status(200).json({ success: true, data: req.body });
});

router.get('/conflict', (_req: Request, _res: Response) => {
  throw new ConflictError('Dữ liệu đã tồn tại trong hệ thống', 'DUPLICATE_ENTRY', {
    field: 'email',
  });
});

router.get('/forbidden', (_req: Request, _res: Response) => {
  throw new ForbiddenError('Chỉ chủ cửa hàng mới có quyền thực hiện');
});

// Endpoint kiểm thử Middleware Role: Chỉ OWNER mới được vào
router.get(
  '/owner-only',
  authenticate,
  requireRole(UserRole.OWNER),
  (req: Request, res: Response) => {
    res.status(200).json({
      message: 'Chào mừng Chủ shop',
      user: req.user,
    });
  }
);

export default router;
