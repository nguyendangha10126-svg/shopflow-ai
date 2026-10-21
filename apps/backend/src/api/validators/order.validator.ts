import { z } from 'zod';
import { OrderStatus, OrderSource } from '@prisma/client';

export const orderItemInputSchema = z.object({
  product_variant_id: z.string().uuid('ID biến thể sản phẩm không hợp lệ'),
  quantity: z.number().int().min(1, 'Số lượng mua tối thiểu là 1'),
});

export const createOrderSchema = z.object({
  customer_id: z.string().uuid().optional().nullable(),
  customer_name: z.string().min(2, 'Tên khách hàng phải có ít nhất 2 ký tự').max(100),
  customer_phone: z
    .string()
    .regex(/^[0-9+]{9,15}$/, 'Số điện thoại khách hàng không hợp lệ (9-15 số)'),
  shipping_address: z.string().min(2, 'Địa chỉ giao hàng không được để trống'),
  items: z.array(orderItemInputSchema).min(1, 'Đơn hàng phải có ít nhất 1 sản phẩm'),
  shipping_fee_vnd: z.number().int().min(0, 'Phí ship không được âm').default(0),
  discount_vnd: z.number().int().min(0, 'Giảm giá không được âm').default(0),
  notes: z.string().optional().nullable(),
  status: z.enum([OrderStatus.DRAFT, OrderStatus.CONFIRMED]).default(OrderStatus.DRAFT),
  source: z.enum([OrderSource.MANUAL, OrderSource.CLIPBOARD]).default(OrderSource.MANUAL),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  reason: z.string().max(255).optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(2, 'Vui lòng cung cấp lý do hủy đơn').max(255),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(OrderStatus).optional(),
  search: z.string().optional(),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;
export type CancelOrderDto = z.infer<typeof cancelOrderSchema>;
export type OrderQueryDto = z.infer<typeof orderQuerySchema>;

