import { prisma } from "../infrastructure/database/prisma";
import { OrderStateFactory } from "../core/domain/order/order-state";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../core/errors/app-error";
import { OrderStatus } from "@prisma/client";

export class OrderCheckoutFacade {
  // Bộ nhớ đệm chống click đúp (Idempotency Cache) 2 phút
  private static idempotencyCache = new Map<
    string,
    { result: any; expiresAt: number }
  >();

  async confirmOrder(
    shopId: string,
    userId: string,
    orderId: string,
    idempotencyKey?: string,
  ) {
    // 1. Kiểm tra Idempotency Key chống click đúp
    if (idempotencyKey) {
      const cacheKey = `${shopId}:${idempotencyKey}`;
      const cached = OrderCheckoutFacade.idempotencyCache.get(cacheKey);
      if (cached && Date.now() < cached.expiresAt) {
        return cached.result;
      }
    }

    // 2. Thực thi toàn bộ quy trình chốt đơn trong 1 Database Transaction nguyên tử duy nhất
    const confirmedOrder = await prisma.$transaction(async (tx) => {
      // a. Lấy thông tin đơn hàng và các mặt hàng
      const order = await tx.order.findFirst({
        where: { id: orderId, shop_id: shopId, deleted_at: null },
        include: { items: true },
      });

      if (!order) {
        throw new NotFoundError(
          "ORDER_NOT_FOUND",
          "Không tìm thấy đơn hàng cần chốt",
        );
      }

      // b. Kiểm tra tính hợp lệ của máy trạng thái (State Pattern)
      const currentState = OrderStateFactory.create(order.status);
      if (!currentState.canTransitionTo(OrderStatus.CONFIRMED)) {
        throw new BadRequestError(
          "INVALID_STATE_TRANSITION",
          `Không thể chốt đơn hàng đang ở trạng thái: ${order.status}`,
        );
      }

      // c. Trừ tồn kho nguyên tử (Atomic Conditional Update)
      for (const item of order.items) {
        const updateCount = await tx.$executeRaw`
          UPDATE product_variants
          SET stock = stock - ${item.quantity}
          WHERE id = ${item.product_variant_id}::uuid
            AND shop_id = ${shopId}::uuid
            AND stock >= ${item.quantity};
        `;

        if (updateCount === 0) {
          throw new ConflictError(
            "OUT_OF_STOCK",
            `Sản phẩm "${item.snap_product_name}" (${item.snap_sku}) không đủ tồn kho để chốt đơn!`,
          );
        }

        // Ghi nhận AuditLog biến động kho
        await tx.auditLog.create({
          data: {
            shop_id: shopId,
            user_id: userId,
            action: "STOCK_DEDUCTED_BY_ORDER",
            entity_type: "PRODUCT_VARIANT",
            entity_id: item.product_variant_id,
            old_values: { order_id: orderId, change: -item.quantity },
            new_values: { reason: "ORDER_CONFIRMED" },
          },
        });
      }

      // d. Tăng và nhận số thứ tự đơn hiển thị (#1001, #1002) nguyên tử qua bảng shop_counters (QĐ-04)
      const counterResult: Array<{ last_order_number: number }> =
        await tx.$queryRaw`
        UPDATE shop_counters
        SET last_order_number = last_order_number + 1
        WHERE shop_id = ${shopId}::uuid
        RETURNING last_order_number;
      `;

      if (!counterResult || counterResult.length === 0) {
        throw new BadRequestError(
          "COUNTER_NOT_FOUND",
          "Lỗi bộ đếm số đơn của cửa hàng",
        );
      }

      const allocatedOrderNumber = counterResult[0].last_order_number;

      // e. Cập nhật trạng thái đơn hàng sang CONFIRMED và gán số thứ tự đơn hàng
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CONFIRMED,
          order_number: allocatedOrderNumber,
        },
        include: { items: true, customer: true },
      });

      // f. Ghi nhận lịch sử trạng thái
      await tx.orderStatusHistory.create({
        data: {
          order_id: orderId,
          from_status: order.status,
          to_status: OrderStatus.CONFIRMED,
          changed_by: userId,
          reason: "Nhân viên xác nhận chốt đơn",
        },
      });

      // g. Cập nhật thống kê khách hàng
      if (order.customer_id) {
        await tx.customer.update({
          where: { id: order.customer_id },
          data: {
            total_orders: { increment: 1 },
            total_spent_vnd: { increment: BigInt(order.total_vnd) },
          },
        });
      }

      return updatedOrder;
    });

    // 3. Lưu kết quả vào Idempotency Cache trong 2 phút
    if (idempotencyKey) {
      const cacheKey = `${shopId}:${idempotencyKey}`;
      OrderCheckoutFacade.idempotencyCache.set(cacheKey, {
        result: confirmedOrder,
        expiresAt: Date.now() + 2 * 60 * 1000,
      });
    }

    return confirmedOrder;
  }

  async cancelOrder(
    shopId: string,
    userId: string,
    orderId: string,
    reason: string,
  ) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, shop_id: shopId, deleted_at: null },
        include: { items: true },
      });

      if (!order) {
        throw new NotFoundError(
          "ORDER_NOT_FOUND",
          "Không tìm thấy đơn hàng cần hủy",
        );
      }

      const currentState = OrderStateFactory.create(order.status);
      if (!currentState.canTransitionTo(OrderStatus.CANCELLED)) {
        throw new BadRequestError(
          "INVALID_STATE_TRANSITION",
          `Không thể hủy đơn hàng đang ở trạng thái: ${order.status}`,
        );
      }

      // Nếu đơn đã CONFIRMED hoặc SHIPPING (đã bị trừ kho), ta hoàn lại tồn kho nguyên tử
      if (
        order.status === OrderStatus.CONFIRMED ||
        order.status === OrderStatus.SHIPPING
      ) {
        for (const item of order.items) {
          await tx.$executeRaw`
            UPDATE product_variants
            SET stock = stock + ${item.quantity}
            WHERE id = ${item.product_variant_id}::uuid
              AND shop_id = ${shopId}::uuid;
          `;

          await tx.auditLog.create({
            data: {
              shop_id: shopId,
              user_id: userId,
              action: "STOCK_RESTORED_BY_CANCEL",
              entity_type: "PRODUCT_VARIANT",
              entity_id: item.product_variant_id,
              old_values: { order_id: orderId, change: item.quantity },
              new_values: { reason },
            },
          });
        }
      }

      const cancelledOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
        include: { items: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          order_id: orderId,
          from_status: order.status,
          to_status: OrderStatus.CANCELLED,
          changed_by: userId,
          reason,
        },
      });

      return cancelledOrder;
    });
  }
}
