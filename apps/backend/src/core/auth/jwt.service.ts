import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { AuthUserPayload } from '../../types/express';
import { UnauthorizedError } from '../errors/app-error';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in_seconds: number;
}

export class JwtService {
  private static parseDurationToSeconds(duration: string): number {
    const unit = duration.slice(-1);
    const value = parseInt(duration.slice(0, -1), 10);
    if (isNaN(value)) return 900; // Mặc định 15 phút (900s)

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900;
    }
  }

  public static generateTokens(payload: AuthUserPayload): TokenPair {
    const accessOptions: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as any,
    };

    const refreshOptions: SignOptions = {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    };

    const access_token = jwt.sign(payload, env.JWT_SECRET, accessOptions);
    const refresh_token = jwt.sign(
      { userId: payload.userId, shopId: payload.shopId, type: 'refresh' },
      env.JWT_SECRET,
      refreshOptions
    );

    return {
      access_token,
      refresh_token,
      token_type: 'Bearer',
      expires_in_seconds: this.parseDurationToSeconds(env.JWT_EXPIRES_IN),
    };
  }

  public static verifyAccessToken(token: string): AuthUserPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUserPayload;
      return decoded;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại');
      }
      throw new UnauthorizedError('Token xác thực không hợp lệ');
    }
  }

  public static verifyRefreshToken(token: string): { userId: string; shopId: string } {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        userId: string;
        shopId: string;
        type: string;
      };
      if (decoded.type !== 'refresh') {
        throw new UnauthorizedError('Token không phải là refresh token hợp lệ');
      }
      return { userId: decoded.userId, shopId: decoded.shopId };
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Refresh token đã hết hạn. Vui lòng đăng nhập lại');
      }
      throw new UnauthorizedError('Refresh token không hợp lệ');
    }
  }
}

export default JwtService;
