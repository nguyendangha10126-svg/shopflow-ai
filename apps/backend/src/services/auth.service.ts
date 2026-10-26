import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { prisma } from '../db';
import { RegisterDto, LoginDto } from '../api/validators/auth.validator';
import { JwtService, TokenPair } from '../core/auth/jwt.service';
import { ConflictError, UnauthorizedError, NotFoundError } from '../core/errors/app-error';
import { env } from '../config/env';
import { shouldUseDemoFallback } from '../core/db-fallback';

export interface UserResponse {
  id: string;
  shop_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
}

export interface AuthResponse {
  user: UserResponse;
  tokens: TokenPair;
}

// Hằng số cho chế độ DEMO offline (chỉ có tác dụng khi DEMO_MODE=true và DB không kết nối được)
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_SHOP_ID = '00000000-0000-0000-0000-000000000002';
const DEMO_EMAIL = 'owner@mayboutique.vn';
const DEMO_PASSWORD = 'ShopFlow@123';
// Hash bcrypt giả (sinh lúc khởi động) để thời gian xử lý đồng đều khi email không tồn tại
const DUMMY_BCRYPT_HASH = bcrypt.hashSync('khong-phai-mat-khau-that', 10);

export class AuthService {
  public static async register(dto: RegisterDto): Promise<AuthResponse> {
    try {
      // 1. Kiểm tra tính duy nhất của email
      const existingUser = await prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ConflictError(
          'Địa chỉ email đã được đăng ký bởi tài khoản khác',
          'EMAIL_ALREADY_EXISTS'
        );
      }

      // 2. Băm mật khẩu an toàn bằng bcrypt với 10 vòng salt
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(dto.password, salt);

      // 3. Thực thi Transaction nguyên tử: Tạo Shop + ShopCounter (1000) + User (OWNER)
      const result = await prisma.$transaction(async (tx) => {
        // 3.1. Tạo Shop mới
        const newShop = await tx.shop.create({
          data: {
            name: dto.shop_name,
            phone: dto.shop_phone,
          },
        });

        // 3.2. Tạo bảng đếm thứ tự đơn hàng nguyên tử (bắt đầu 1000)
        await tx.shopCounter.create({
          data: {
            shop_id: newShop.id,
            last_order_number: 1000,
          },
        });

        // 3.3. Tạo User với vai trò OWNER
        const newUser = await tx.user.create({
          data: {
            shop_id: newShop.id,
            email: dto.email,
            password_hash: passwordHash,
            full_name: dto.full_name,
            role: UserRole.OWNER,
          },
        });

        return { shop: newShop, user: newUser };
      });

      // 4. Sinh cặp Token JWT
      const tokens = JwtService.generateTokens({
        userId: result.user.id,
        shopId: result.shop.id,
        role: result.user.role,
        email: result.user.email,
      });

      return {
        user: {
          id: result.user.id,
          shop_id: result.user.shop_id,
          email: result.user.email,
          full_name: result.user.full_name,
          role: result.user.role,
          is_active: result.user.is_active,
          created_at: result.user.created_at,
        },
        tokens,
      };
    } catch (err: any) {
      if (err instanceof ConflictError) throw err;
      if (shouldUseDemoFallback(err)) {
        // Dự phòng Offline / Demo mode khi CSDL chưa bật
        const demoUserId = '00000000-0000-0000-0000-000000000001';
        const demoShopId = '00000000-0000-0000-0000-000000000002';
        const tokens = JwtService.generateTokens({
          userId: demoUserId,
          shopId: demoShopId,
          role: UserRole.OWNER,
          email: dto.email,
        });
        return {
          user: {
            id: demoUserId,
            shop_id: demoShopId,
            email: dto.email,
            full_name: dto.full_name,
            role: UserRole.OWNER,
            is_active: true,
            created_at: new Date(),
          },
          tokens,
        };
      }
      throw err;
    }
  }

  public static async login(dto: LoginDto): Promise<AuthResponse> {
    try {
      // 1. Tìm người dùng theo email
      const user = await prisma.user.findUnique({
        where: { email: dto.email },
      });

      // 2. Chống timing attack: nếu không có user vẫn so sánh với một hash giả
      const hashToCompare = user?.password_hash ?? DUMMY_BCRYPT_HASH;
      const isPasswordValid = await bcrypt.compare(dto.password, hashToCompare);

      if (!user || !user.is_active || !isPasswordValid) {
        throw new UnauthorizedError('Email hoặc mật khẩu không chính xác');
      }

      // 3. Cấp cặp Token mới
      const tokens = JwtService.generateTokens({
        userId: user.id,
        shopId: user.shop_id,
        role: user.role,
        email: user.email,
      });

      return {
        user: {
          id: user.id,
          shop_id: user.shop_id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          is_active: user.is_active,
          created_at: user.created_at,
        },
        tokens,
      };
    } catch (err: any) {
      // Chỉ lỗi xác thực mới được trả về như 401. Mọi lỗi khác (DB tắt, lỗi truy vấn...)
      // KHÔNG BAO GIỜ được phép biến thành "đăng nhập thành công".
      if (err instanceof UnauthorizedError) throw err;

      // Chế độ DEMO (chỉ khi DEMO_MODE=true và DB không kết nối được):
      // cho phép đúng 1 tài khoản demo cố định để trình diễn offline.
      if (
        shouldUseDemoFallback(err) &&
        dto.email === DEMO_EMAIL &&
        dto.password === DEMO_PASSWORD
      ) {
        return AuthService.buildDemoAuth();
      }
      throw err;
    }
  }

  private static buildDemoAuth(): AuthResponse {
    const tokens = JwtService.generateTokens({
      userId: DEMO_USER_ID,
      shopId: DEMO_SHOP_ID,
      role: UserRole.OWNER,
      email: DEMO_EMAIL,
    });
    return {
      user: {
        id: DEMO_USER_ID,
        shop_id: DEMO_SHOP_ID,
        email: DEMO_EMAIL,
        full_name: 'May Boutique Owner (Demo)',
        role: UserRole.OWNER,
        is_active: true,
        created_at: new Date(),
      },
      tokens,
    };
  }

  public static async refresh(refreshToken: string): Promise<TokenPair> {
    const decoded = JwtService.verifyRefreshToken(refreshToken);

    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.is_active) {
        throw new UnauthorizedError('Tài khoản người dùng không tồn tại hoặc đã bị khóa');
      }

      // Lấy role/shop từ DB (không tin dữ liệu cũ trong token)
      return JwtService.generateTokens({
        userId: user.id,
        shopId: user.shop_id,
        role: user.role,
        email: user.email,
      });
    } catch (err: any) {
      if (err instanceof UnauthorizedError) throw err;
      if (shouldUseDemoFallback(err) && decoded.userId === DEMO_USER_ID) {
        return AuthService.buildDemoAuth().tokens;
      }
      throw err;
    }
  }

  public static async getMe(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          shop_id: true,
          email: true,
          full_name: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          shop: {
            select: {
              id: true,
              name: true,
              phone: true,
              is_active: true,
              created_at: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundError('Không tìm thấy thông tin người dùng');
      }

      return user;
    } catch (err: any) {
      if (err instanceof NotFoundError) throw err;
      if (shouldUseDemoFallback(err) && userId === DEMO_USER_ID) {
        return {
          id: DEMO_USER_ID,
          shop_id: DEMO_SHOP_ID,
          email: DEMO_EMAIL,
          full_name: 'May Boutique Owner (Demo)',
          role: UserRole.OWNER,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          shop: {
            id: DEMO_SHOP_ID,
            name: 'May Boutique',
            phone: '0988888888',
            is_active: true,
            created_at: new Date(),
          },
        };
      }
      throw err;
    }
  }
}

export default AuthService;
