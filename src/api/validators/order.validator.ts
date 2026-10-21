import { z } from "zod";
import { OrderStatus } from "@prisma/client";

export const createOrderSchema = z.object({
  customer_name: z.string().min(1, "Tên khách hàng không được để trống"),
  customer_phone: z
    .string()
    .regex(/^[0-9+ ]{9,15}$/, "Số điện thoại không hợp lệ"),
  shipping_address: z.string().min(5, "Địa chỉ giao hàng quá ngắn"),
  notes: z.string().optional(),
  shipping_fee_vnd: z
    .number()
    .int()
    .nonnegative("Phí ship không được âm")
    .default(0),
  discount_vnd: z
    .number()
    .int()
    .nonnegative("Giảm giá không được âm")
    .default(0),
  items: z
    .array(
      z.object({
        variant_id: z.string().uuid("ID biến thể sản phẩm phải là UUID hợp lệ"),
        quantity: z.number().int().positive("Số lượng đặt mua phải lớn hơn 0"),
      }),
    )
    .min(1, "Đơn hàng phải có ít nhất 1 sản phẩm"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    OrderStatus.SHIPPING,
    OrderStatus.DELIVERED,
    OrderStatus.RETURNED,
  ]),
  reason: z.string().optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(1, "Lý do hủy đơn không được để trống"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
