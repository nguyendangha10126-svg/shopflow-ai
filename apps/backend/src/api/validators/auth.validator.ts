import { z } from 'zod';

export const registerSchema = z.object({
  shop_name: z
    .string()
    .min(2, 'Tên cửa hàng phải có ít nhất 2 ký tự')
    .max(150, 'Tên cửa hàng không được quá 150 ký tự'),
  shop_phone: z.string().regex(/^[0-9+]{9,15}$/, 'Số điện thoại cửa hàng không hợp lệ (9-15 số)'),
  email: z.string().email('Địa chỉ email không đúng định dạng'),
  password: z
    .string()
    .min(8, 'Mật khẩu phải có tối thiểu 8 ký tự')
    .max(100, 'Mật khẩu không được vượt quá 100 ký tự'),
  full_name: z
    .string()
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ tên không được quá 100 ký tự'),
});

export const loginSchema = z.object({
  email: z.string().email('Địa chỉ email không đúng định dạng'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

export const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token không được để trống'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;
