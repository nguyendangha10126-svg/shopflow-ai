import { OrderStatus } from '@prisma/client';
import { prisma } from '../db';
import { OrderRepository, PreparedOrderItem } from '../repositories/order.repository';
import {
  CreateOrderDto,
  OrderQueryDto,
  UpdateOrderStatusDto,
} from '../api/validators/order.validator';
import { OrderStateMachine } from '../core/domain/order-state-machine';
import { NotFoundError, BadRequestError } from '../core/errors/app-error';

export class OrderService {
  public static async listOrders(shopId: string, query: OrderQueryDto) {
    return OrderRepository.findMany(shopId, query);
  }

  public static async getOrderById(shopId: string, orderId: string) {
    return OrderRepository.findById(shopId, orderId);
  }

  public static async createOrder(shopId: string, userId: string, dto: CreateOrderDto) {
    // 1. Lấy thông tin các biến thể thực tế từ CSDL để đảm bảo giá chính xác và bất biến
    const variantIds = dto.items.map((i) => i.product_variant_id);
    const dbVariants = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
        shop_id: shopId,
        deleted_at: null,
      },
      include: {
        product: true,
      },
    });

    if (dbVariants.length !== variantIds.length) {
      throw new NotFoundError(
        'Một hoặc nhiều sản phẩm trong đơn hàng không tồn tại hoặc đã bị xóa'
      );
    }

    const variantMap = new Map(dbVariants.map((v) => [v.id, v]));

    // 2. Tính toán tiền tệ hoàn toàn bằng code (Single Source of Truth, không tin client)
    let subtotal_vnd = 0;
    const preparedItems: PreparedOrderItem[] = dto.items.map((item) => {
      const variant = variantMap.get(item.product_variant_id)!;
      const itemSubtotal = variant.price_vnd * item.quantity;
      subtotal_vnd += itemSubtotal;

      return {
        product_variant_id: variant.id,
        snap_product_name: variant.product.name,
        snap_variant_name: variant.variant_name,
        snap_sku: variant.sku,
        snap_price_vnd: variant.price_vnd,
        quantity: item.quantity,
        subtotal_vnd: itemSubtotal,
      };
    });

    const shipping_fee_vnd = dto.shipping_fee_vnd || 0;
    const discount_vnd = dto.discount_vnd || 0;
    const total_vnd = Math.max(0, subtotal_vnd + shipping_fee_vnd - discount_vnd);

    // 3. Tự động liên kết hoặc tạo khách hàng nếu có SĐT
    let customerId = dto.customer_id || null;
    if (!customerId) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { shop_id: shopId, phone: dto.customer_phone, deleted_at: null },
      });

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const newCust = await prisma.customer.create({
          data: {
            shop_id: shopId,
            name: dto.customer_name,
            phone: dto.customer_phone,
            address: dto.shipping_address,
          },
        });
        customerId = newCust.id;
      }
    }

    // 4. Ủy thác xuống Repository thực thi Transaction nguyên tử
    return OrderRepository.create({
      shop_id: shopId,
      customer_id: customerId,
      customer_name: dto.customer_name,
      customer_phone: dto.customer_phone,
      shipping_address: dto.shipping_address,
      items: preparedItems,
      subtotal_vnd,
      shipping_fee_vnd,
      discount_vnd,
      total_vnd,
      notes: dto.notes,
      status: dto.status,
      source: dto.source,
      created_by: userId,
    });
  }

  public static async confirmOrder(shopId: string, orderId: string, userId: string) {
    return OrderRepository.confirmOrder(shopId, orderId, userId);
  }

  public static async cancelOrder(shopId: string, orderId: string, userId: string, reason: string) {
    return OrderRepository.cancelOrder(shopId, orderId, userId, reason);
  }

  public static async updateStatus(
    shopId: string,
    orderId: string,
    userId: string,
    dto: UpdateOrderStatusDto
  ) {
    const order = await OrderRepository.findById(shopId, orderId);

    // Kiểm tra tính hợp lệ bằng State Pattern Machine
    OrderStateMachine.validateTransition(order.status, dto.status);

    if (dto.status === OrderStatus.CONFIRMED) {
      return OrderRepository.confirmOrder(shopId, orderId, userId);
    }

    if (dto.status === OrderStatus.CANCELLED) {
      return OrderRepository.cancelOrder(shopId, orderId, userId, dto.reason || 'Hủy đơn hàng');
    }

    return OrderRepository.updateStatus(shopId, orderId, userId, dto.status, dto.reason);
  }
}

export default OrderService;
