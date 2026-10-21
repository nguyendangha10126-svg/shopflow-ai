import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthService } from '../../services/auth.service';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.validator';

const router = Router();

// Rate limiting nghiêm ngặt cho cụm /auth (Chống tấn công Brute-force mật khẩu & spam đăng ký)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 30, // Tối đa 30 requests/IP trong 15 phút
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Bạn đã thử đăng nhập/đăng ký quá nhiều lần. Vui lòng thử lại sau 15 phút',
    },
  },
});

router.post(
  '/register',
  authRateLimiter,
  validate({ body: registerSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({
        message: 'Đăng ký cửa hàng và tài khoản chủ shop thành công',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/login',
  authRateLimiter,
  validate({ body: loginSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json({
        message: 'Đăng nhập thành công',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/refresh',
  validate({ body: refreshSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokens = await AuthService.refresh(req.body.refresh_token);
      res.status(200).json({
        message: 'Làm mới token thành công',
        data: { tokens },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/logout', (_req: Request, res: Response) => {
  // Với Stateless JWT, client chỉ cần xóa token khỏi storage
  res.status(200).json({
    message: 'Đăng xuất thành công',
  });
});

router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await AuthService.getMe(req.user!.userId);
    res.status(200).json({
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
