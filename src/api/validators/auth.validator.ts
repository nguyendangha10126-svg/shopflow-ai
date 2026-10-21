import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email không đúng định dạng"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export const registerSchema = z.object({
  email: z.string().email("Email không đúng định dạng"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  fullName: z.string().min(2, "Họ và tên tối thiểu 2 ký tự"),
  shopName: z.string().min(2, "Tên cửa hàng tối thiểu 2 ký tự"),
  phone: z
    .string()
    .regex(/^[0-9]{9,11}$/, "Số điện thoại phải từ 9 đến 11 chữ số"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
