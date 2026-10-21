import { prisma } from "../infrastructure/database/prisma";
import {
  CreateOrderInput,
  UpdateOrderStatusInput,
} from "../api/validators/order.validator";
import { BadRequestError, NotFoundError } from "../core/errors/app-error";
import { OrderStateFactory } from "../core/domain/order/order-state";
import { OrderStatus, OrderSource, UserRole } from "@prisma/client";

export class OrderService {
  async createDraftOrder(
    shopId: string,
    userId: string,
    input: CreateOrderInput,
    source: OrderSource = OrderSource.MANUAL,
  ) {
    const variantIds = input.items.map((i) => i.variant_id);

    // 1. Lấy thông tin biến thể từ CSDL để Snapshot giá & tên (không tin tưởng giá từ client)
    const variants = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
        shop_id: shopId,
        deleted_at: null,
      },
      include: { product: true },
    });

    if (variants.length !== variantIds.length) {
      throw new BadRequestError(
        "INVALID_VARIANTS",
        "Một số sản phẩm không tồn tại hoặc không thuộc quyền quản lý của shop",
      );
    }

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    // 2. Tính toán tiền hàng và chuẩn bị Order Items
    let subtotalVnd = 0;
    const orderItemsData = input.items.map((item) => {
      const v = variantMap.get(item.variant_id)!;
      const itemSubtotal = v.price_vnd * item.quantity;
      subtotalVnd += itemSubtotal;

      return {
        product_variant_id: v.id,
        snap_product_name: v.product.name,
        snap_variant_name: v.variant_name,
        snap_sku: v.sku,
        snap_price_vnd: v.price_vnd,
        quantity: item.quantity,
        subtotal_vnd: itemSubtotal,
      };
    });

    const totalVnd = Math.max(
      0,
      subtotalVnd + input.shipping_fee_vnd - input.discount_vnd,
    );

    return await prisma.$transaction(async (tx) => {
      // 3. Tìm hoặc tạo khách hàng theo Số điện thoại
      let customer = await tx.customer.findFirst({
        where: {
          shop_id: shopId,
          phone: input.customer_phone,
          deleted_at: null,
        },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            shop_id: shopId,
            name: input.customer_name,
            phone: input.customer_phone,
            address: input.shipping_address,
          },
        });
      }

      // 4. Tạo bản ghi Đơn hàng với order_number tạm (sẽ được chốt khi confirm)
      const order = await tx.order.create({
        data: {
          shop_id: shopId,
          order_number: 0, // Đơn nháp mang số 0
          customer_id: customer.id,
          customer_name: input.customer_name,
          customer_phone: input.customer_phone,
          shipping_address: input.shipping_address,
          status: OrderStatus.DRAFT,
          source,
          subtotal_vnd: subtotalVnd,
          shipping_fee_vnd: input.shipping_fee_vnd,
          discount_vnd: input.discount_vnd,
          total_vnd: totalVnd,
          notes: input.notes,
          created_by: userId,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      // 5. Ghi lịch sử tạo đơn
      await tx.orderStatusHistory.create({
        data: {
          order_id: order.id,
          from_status: OrderStatus.DRAFT,
          to_status: OrderStatus.DRAFT,
          changed_by: userId,
          reason: "Tạo đơn nháp",
        },
      });

      return order;
    });
  }

  async getOrderById(shopId: string, userRole: UserRole, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, shop_id: shopId, deleted_at: null },
      include: {
        items: true,
        customer: true,
        status_history: {
          orderBy: { created_at: "asc" },
          include: { user: { select: { full_name: true, role: true } } },
        },
      },
    });

    if (!order) {
      throw new NotFoundError(
        "ORDER_NOT_FOUND",
        "Không tìm thấy đơn hàng trong shop",
      );
    }

    // Bảo mật PII theo NĐ 13/2023: Nếu là STAFF và đơn chưa giao thành công, che bớt SĐT
    if (userRole === UserRole.STAFF && order.status === OrderStatus.DRAFT) {
      order.customer_phone = this.maskPhoneNumber(order.customer_phone);
      if (order.customer) {
        order.customer.phone = this.maskPhoneNumber(order.customer.phone);
      }
    }

    return order;
  }

  async listOrders(
    shopId: string,
    query: {
      status?: OrderStatus;
      page?: number;
      limit?: number;
      search?: string;
    },
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      shop_id: shopId,
      deleted_at: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { customer_name: { contains: query.search, mode: "insensitive" } },
        { customer_phone: { contains: query.search } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          customer: true,
        },
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateOrderStatus(
    shopId: string,
    userId: string,
    orderId: string,
    input: UpdateOrderStatusInput,
  ) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, shop_id: shopId, deleted_at: null },
    });

    if (!order) {
      throw new NotFoundError("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng");
    }

    const currentState = OrderStateFactory.create(order.status);
    if (!currentState.canTransitionTo(input.status)) {
      throw new BadRequestError(
        "INVALID_STATE_TRANSITION",
        `Không thể chuyển từ trạng thái ${order.status} sang ${input.status}`,
      );
    }

    return await prisma.$transaction(async (tx) => {
      // Nếu trạng thái chuyển sang RETURNED (hoàn hàng), cần hoàn trả tồn kho nguyên tử
      if (input.status === OrderStatus.RETURNED) {
        const items = await tx.orderItem.findMany({
          where: { order_id: orderId },
        });
        for (const item of items) {
          await tx.$executeRaw`
            UPDATE product_variants
            SET stock = stock + ${item.quantity}
            WHERE id = ${item.product_variant_id}::uuid
              AND shop_id = ${shopId}::uuid;
          `;
        }
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: input.status },
        include: { items: true, customer: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          order_id: orderId,
          from_status: order.status,
          to_status: input.status,
          changed_by: userId,
          reason: input.reason || "Cập nhật trạng thái đơn hàng",
        },
      });

      return updated;
    });
  }

  private maskPhoneNumber(phone: string): string {
    if (phone.length < 8) return phone;
    return phone.substring(0, 4) + "***" + phone.substring(phone.length - 3);
  }
}
