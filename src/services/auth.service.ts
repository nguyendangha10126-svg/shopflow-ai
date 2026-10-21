import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../infrastructure/database/prisma';
import { env } from '../config/env';
import { UnauthorizedError, ConflictError, NotFoundError } from '../core/errors/app-error';
import { LoginInput, RegisterInput } from '../api/validators/auth.validator';
import { UserRole } from '@prisma/client';

export class AuthService {
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (existingUser) {
      throw new ConflictError('EMAIL_ALREADY_EXISTS', 'Email này đã được đăng ký');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    // Chạy trong transaction: Tạo Shop -> Tạo ShopCounter (#1000) -> Tạo User OWNER -> Gán gói mặc định
    return await prisma.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: {
          name: input.shopName,
          phone: input.phone
        }
      });

      await tx.shopCounter.create({
        data: {
          shop_id: shop.id,
          last_order_number: 1000 // Đơn đầu tiên sẽ là #1001
        }
      });

      const user = await tx.user.create({
        data: {
          shop_id: shop.id,
          email: input.email,
          password_hash: passwordHash,
          full_name: input.fullName,
          role: UserRole.OWNER
        }
      });

      const defaultPlan = await tx.plan.findFirst({
        where: { code: 'FREE' }
      });

      if (defaultPlan) {
        await tx.subscription.create({
          data: {
            shop_id: shop.id,
            plan_id: defaultPlan.id,
            status: 'TRIAL',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 ngày dùng thử
          }
        });
      }

      const tokens = this.generateTokens({
        userId: user.id,
        shopId: shop.id,
        role: user.role,
        phone: input.phone
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          shopId: shop.id,
          shopName: shop.name
        },
        ...tokens
      };
    });
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { shop: true }
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedError('INVALID_CREDENTIALS', 'Email hoặc mật khẩu không chính xác');
    }

    const isMatch = await bcrypt.compare(input.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('INVALID_CREDENTIALS', 'Email hoặc mật khẩu không chính xác');
    }

    const tokens = this.generateTokens({
      userId: user.id,
      shopId: user.shop_id,
      role: user.role,
      phone: user.shop.phone
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        shopId: user.shop_id,
        shopName: user.shop.name
      },
      ...tokens
    };
  }

  async refreshToken(refreshTokenString: string) {
    try {
      const decoded = jwt.verify(refreshTokenString, env.JWT_SECRET) as {
        userId: string;
        shopId: string;
        role: UserRole;
        phone: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || !user.is_active) {
        throw new UnauthorizedError('USER_INACTIVE', 'Tài khoản đã bị khóa hoặc không tồn tại');
      }

      const accessToken = jwt.sign(
        {
          userId: user.id,
          shopId: user.shop_id,
          role: user.role,
          phone: decoded.phone
        },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN as any }
      );

      return { accessToken };
    } catch {
      throw new UnauthorizedError('INVALID_REFRESH_TOKEN', 'Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }

  async getMe(userId: string, shopId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, shop_id: shopId },
      include: {
        shop: {
          include: {
            subscriptions: {
              where: { status: 'ACTIVE' },
              include: { plan: true },
              take: 1
            }
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundError('USER_NOT_FOUND', 'Không tìm thấy hồ sơ người dùng');
    }

    const activeSubscription = user.shop.subscriptions[0];

    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      shop: {
        id: user.shop.id,
        name: user.shop.name,
        phone: user.shop.phone,
        plan: activeSubscription?.plan.name || 'Gói Dùng thử'
      }
    };
  }

  private generateTokens(payload: {
    userId: string;
    shopId: string;
    role: UserRole;
    phone: string;
  }) {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any
    });

    const refreshToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any
    });

    return { accessToken, refreshToken };
  }
}
