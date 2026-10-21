import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/auth.service';
import { UnauthorizedError } from '../../core/errors/app-error';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      
      // Đặt Refresh Token vào HttpOnly Secure Cookie (Hạn 7 ngày)
      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(201).json({
        user: result.user,
        access_token: result.accessToken
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);

      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        user: result.user,
        access_token: result.accessToken
      });
    } catch (err) {
      next(err);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (!refreshToken) {
        throw new UnauthorizedError(
          'REFRESH_TOKEN_MISSING',
          'Không tìm thấy refresh token trong cookie'
        );
      }

      const result = await authService.refreshToken(refreshToken);
      res.status(200).json({ access_token: result.accessToken });
    } catch (err) {
      next(err);
    }
  }

  async logout(_req: Request, res: Response) {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.status(200).json({ message: 'Đăng xuất thành công' });
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.getMe(req.user!.userId, req.user!.shopId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

