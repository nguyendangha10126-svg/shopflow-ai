import { Prisma, OrderStatus, OrderSource } from '@prisma/client';
import { prisma } from '../db';
import { OrderQueryDto } from '../api/validators/order.validator';
import { NotFoundError, ConflictError } from '../core/errors/app-error';
import { OrderStateMachine } from '../core/domain/order-state-machine';
import { shouldUseDemoFallback } from '../core/db-fallback';

export interface PreparedOrderItem {
  product_variant_id: string;
  snap_product_name: string;
  snap_variant_name: string;
  snap_sku: string;
  snap_price_vnd: number;
  quantity: number;
  subtotal_vnd: number;
}

export interface PreparedOrderData {
  shop_id: string;
  customer_id?: string | null;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  items: PreparedOrderItem[];
  subtotal_vnd: number;
  shipping_fee_vnd: number;
  discount_vnd: number;
  total_vnd: number;
  notes?: string | null;
  status: OrderStatus;
  source: any;
  created_by?: string | null;
}

export class OrderRepository {
  public static async findMany(shopId: string, query: OrderQueryDto) {
    const { page, limit, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      shop_id: shopId,
      deleted_at: null,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { customer_name: { contains: search, mode: 'insensitive' } },
              { customer_phone: { contains: search } },
              ...(isNaN(Number(search)) ? [] : [{ order_number: Number(search) }]),
            ],
          }
        : {}),
    };

    try {
      const [items, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            items: true,
            customer: {
              select: { id: true, name: true, phone: true },
            },
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
        }),
        prisma.order.count({ where }),
      ]);

      return {
        items,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      };
    } catch (err: any) {
      if (shouldUseDemoFallback(err)) {
        const allMockOrders = [
          {
            id: 'ord-1001',
            shop_id: shopId,
            order_number: 1001,
            customer_name: 'Lê Thu Hương',
            customer_phone: '0987654321',
            shipping_address: 'Số 15 ngõ 120 Hoàng Hoa Thám, Ba Đình, Hà Nội',
            status: OrderStatus.CONFIRMED,
            source: OrderSource.CLIPBOARD,
            subtotal_vnd: 250000,
            shipping_fee_vnd: 30000,
            discount_vnd: 0,
            total_vnd: 280000,
            notes: 'Giao giờ hành chính, gọi trước khi giao',
            created_at: new Date(Date.now() - 1000 * 60 * 15), // 15 phút trước
            items: [
              {
                id: 'item-01',
                snap_product_name: 'Váy hoa nhí dáng xòe Vintage',
                snap_variant_name: 'Váy hoa nhí (Size S)',
                snap_sku: 'VAY-HOA-S',
                snap_price_vnd: 250000,
                quantity: 1,
                subtotal_vnd: 250000,
              },
            ],
            customer: { id: 'cust-001', name: 'Lê Thu Hương', phone: '0987654321' },
          },
          {
            id: 'ord-1002',
            shop_id: shopId,
            order_number: 1002,
            customer_name: 'Trần Mai Chi',
            customer_phone: '0912345678',
            shipping_address: '45 Lê Duẩn, Quận 1, TP.HCM',
            status: OrderStatus.SHIPPING,
            source: OrderSource.CLIPBOARD,
            subtotal_vnd: 280000,
            shipping_fee_vnd: 30000,
            discount_vnd: 0,
            total_vnd: 310000,
            notes: 'Đang vận chuyển GHTK mã 8492019',
            created_at: new Date(Date.now() - 1000 * 60 * 120), // 2 giờ trước
            items: [
              {
                id: 'item-02',
                snap_product_name: 'Áo sơ mi lụa cổ V thanh lịch',
                snap_variant_name: 'Sơ mi lụa (Trắng - Freesize)',
                snap_sku: 'SM-LUA-TRANG',
                snap_price_vnd: 280000,
                quantity: 1,
                subtotal_vnd: 280000,
              },
            ],
            customer: { id: 'cust-002', name: 'Trần Mai Chi', phone: '0912345678' },
          },
          {
            id: 'ord-1003',
            shop_id: shopId,
            order_number: 1003,
            customer_name: 'Lê Thu Hương',
            customer_phone: '0987654321',
            shipping_address: 'Số 15 ngõ 120 Hoàng Hoa Thám, Ba Đình, Hà Nội',
            status: OrderStatus.DELIVERED,
            source: OrderSource.MANUAL,
            subtotal_vnd: 220000,
            shipping_fee_vnd: 0,
            discount_vnd: 0,
            total_vnd: 220000,
            notes: 'Khách ghé shop lấy trực tiếp',
            created_at: new Date(Date.now() - 1000 * 3600 * 24), // Hôm qua
            items: [
              {
                id: 'item-03',
                snap_product_name: 'Chân váy chữ A dáng dài',
                snap_variant_name: 'Chân váy chữ A (Đen - Size M)',
                snap_sku: 'CV-CHU-A-DEN',
                snap_price_vnd: 220000,
                quantity: 1,
                subtotal_vnd: 220000,
              },
            ],
            customer: { id: 'cust-001', name: 'Lê Thu Hương', phone: '0987654321' },
          },
          {
            id: 'ord-1004',
            shop_id: shopId,
            order_number: 1004,
            customer_name: 'Nguyễn Thùy Linh',
            customer_phone: '0934567890',
            shipping_address: '12 Tôn Đức Thắng, Đống Đa, Hà Nội',
            status: OrderStatus.CONFIRMED,
            source: OrderSource.CLIPBOARD,
            subtotal_vnd: 650000,
            shipping_fee_vnd: 0,
            discount_vnd: 0,
            total_vnd: 650000,
            notes: 'Miễn phí giao hàng đơn > 500k',
            created_at: new Date(Date.now() - 1000 * 3600 * 28), // Hôm qua
            items: [
              {
                id: 'item-04',
                snap_product_name: 'Set bộ vest công sở cao cấp',
                snap_variant_name: 'Set vest (Be - Freesize)',
                snap_sku: 'SET-VEST-BE',
                snap_price_vnd: 650000,
                quantity: 1,
                subtotal_vnd: 650000,
              },
            ],
            customer: { id: 'cust-003', name: 'Nguyễn Thùy Linh', phone: '0934567890' },
          },
          {
            id: 'ord-1005',
            shop_id: shopId,
            order_number: 1005,
            customer_name: 'Lê Thu Hương',
            customer_phone: '0987654321',
            shipping_address: 'Số 15 ngõ 120 Hoàng Hoa Thám, Ba Đình, Hà Nội',
            status: OrderStatus.DELIVERED,
            source: OrderSource.CLIPBOARD,
            subtotal_vnd: 260000,
            shipping_fee_vnd: 30000,
            discount_vnd: 0,
            total_vnd: 290000,
            notes: 'Đã hoàn thành và thu tiền COD',
            created_at: new Date(Date.now() - 1000 * 3600 * 72), // 3 ngày trước
            items: [
              {
                id: 'item-05',
                snap_product_name: 'Váy hoa nhí dáng xòe Vintage',
                snap_variant_name: 'Váy hoa nhí (Size M)',
                snap_sku: 'VAY-HOA-M',
                snap_price_vnd: 260000,
                quantity: 1,
                subtotal_vnd: 260000,
              },
            ],
            customer: { id: 'cust-001', name: 'Lê Thu Hương', phone: '0987654321' },
          },
          {
            id: 'ord-1006',
            shop_id: shopId,
            order_number: 1006,
            customer_name: 'Phạm Hồng Nhung',
            customer_phone: '0978901234',
            shipping_address: '88 Nguyễn Trãi, Thanh Xuân, Hà Nội',
            status: OrderStatus.SHIPPING,
            source: OrderSource.CLIPBOARD,
            subtotal_vnd: 560000,
            shipping_fee_vnd: 0,
            discount_vnd: 0,
            total_vnd: 560000,
            notes: 'Khách quen lấy 2 chiếc màu trắng',
            created_at: new Date(Date.now() - 1000 * 3600 * 90), // 3 ngày trước
            items: [
              {
                id: 'item-06',
                snap_product_name: 'Áo sơ mi lụa cổ V thanh lịch',
                snap_variant_name: 'Sơ mi lụa (Trắng - Freesize)',
                snap_sku: 'SM-LUA-TRANG',
                snap_price_vnd: 280000,
                quantity: 2,
                subtotal_vnd: 560000,
              },
            ],
            customer: { id: 'cust-004', name: 'Phạm Hồng Nhung', phone: '0978901234' },
          },
          {
            id: 'ord-1007',
            shop_id: shopId,
            order_number: 1007,
            customer_name: 'Hoàng Khánh Ly',
            customer_phone: '0905123456',
            shipping_address: 'Vincom Center, 72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM',
            status: OrderStatus.CONFIRMED,
            source: OrderSource.MANUAL,
            subtotal_vnd: 890000,
            shipping_fee_vnd: 0,
            discount_vnd: 0,
            total_vnd: 890000,
            notes: 'Đặt may theo kích thước riêng',
            created_at: new Date(Date.now() - 1000 * 3600 * 110), // 4 ngày trước
            items: [
              {
                id: 'item-07',
                snap_product_name: 'Set bộ vest công sở cao cấp',
                snap_variant_name: 'Set vest (Đen - Freesize)',
                snap_sku: 'SET-VEST-DEN',
                snap_price_vnd: 890000,
                quantity: 1,
                subtotal_vnd: 890000,
              },
            ],
            customer: { id: 'cust-005', name: 'Hoàng Khánh Ly', phone: '0905123456' },
          },
          {
            id: 'ord-1008',
            shop_id: shopId,
            order_number: 1008,
            customer_name: 'Đặng Thị Thu Hà',
            customer_phone: '0943210987',
            shipping_address: 'Chợ Cồn, Hải Châu, Đà Nẵng',
            status: OrderStatus.DRAFT,
            source: OrderSource.CLIPBOARD,
            subtotal_vnd: 190000,
            shipping_fee_vnd: 30000,
            discount_vnd: 0,
            total_vnd: 220000,
            notes: 'Dán từ tin nhắn Messenger, chờ khách chốt màu',
            created_at: new Date(Date.now() - 1000 * 60 * 5), // 5 phút trước
            items: [
              {
                id: 'item-08',
                snap_product_name: 'Chân váy chữ A dáng dài',
                snap_variant_name: 'Chân váy chữ A (Nâu - Size S)',
                snap_sku: 'CV-CHU-A-NAU',
                snap_price_vnd: 190000,
                quantity: 1,
                subtotal_vnd: 190000,
              },
            ],
            customer: { id: 'cust-006', name: 'Đặng Thị Thu Hà', phone: '0943210987' },
          },
        ];

        let filtered = allMockOrders;
        if (status) {
          filtered = filtered.filter((o) => o.status === status);
        }
        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter(
            (o) =>
              o.customer_name.toLowerCase().includes(s) ||
              o.customer_phone.includes(s) ||
              String(o.order_number).includes(s)
          );
        }

        return {
          items: filtered.slice(skip, skip + limit),
          pagination: {
            page,
            limit,
            total: filtered.length,
            total_pages: Math.ceil(filtered.length / limit),
          },
        };
      }
      throw err;
    }
  }

  public static async findById(shopId: string, orderId: string) {
    try {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          shop_id: shopId,
          deleted_at: null,
        },
        include: {
          items: true,
          customer: true,
          creator: {
            select: { id: true, full_name: true, role: true },
          },
          status_history: {
            orderBy: { created_at: 'asc' },
            include: {
              user: { select: { id: true, full_name: true } },
            },
          },
          draft_ai_meta: true,
        },
      });

      if (!order) {
        throw new NotFoundError('Không tìm thấy đơn hàng yêu cầu');
      }

      return order;
    } catch (err: any) {
      if (shouldUseDemoFallback(err)) {
        const result = await this.findMany(shopId, { page: 1, limit: 100 });
        const found = result.items.find(
          (o: any) => o.id === orderId || String(o.order_number) === orderId
        );
        if (!found) {
          throw new NotFoundError('Không tìm thấy đơn hàng yêu cầu');
        }
        return {
          ...found,
          creator: { id: 'usr-001', full_name: 'Nguyễn Văn Chủ Shop', role: 'OWNER' },
          status_history: [
            {
              id: 'hist-01',
              previous_status: OrderStatus.DRAFT,
              new_status: found.status,
              reason: 'Chốt đơn từ tin nhắn bóc tách AI',
              created_at: found.created_at,
              user: { id: 'usr-001', full_name: 'Nguyễn Văn Chủ Shop' },
            },
          ],
          draft_ai_meta: {
            raw_message: 'Dạ em lấy váy hoa nhí size S về số 15 ngõ 120 Hoàng Hoa Thám nha shop',
            confidence_score: 0.95,
          },
        };
      }
      throw err;
    }
  }

  /**
   * Tạo đơn hàng mới trong một Database Transaction:
   * 1. Tăng nguyên tử shop_counters để lấy order_number (ví dụ #1001, #1002)
   * 2. Nếu status === CONFIRMED: Trừ kho nguyên tử có điều kiện (stock >= quantity)
   * 3. Lưu Order, OrderItems (snapshot) và OrderStatusHistory
   */
  public static async create(orderData: PreparedOrderData) {
    return prisma.$transaction(async (tx) => {
      // 1. Cập nhật bảng đếm nguyên tử tăng order_number (QĐ-04: Tuyệt đối không dùng MAX()+1)
      const counter = await tx.shopCounter.update({
        where: { shop_id: orderData.shop_id },
        data: { last_order_number: { increment: 1 } },
        select: { last_order_number: true },
      });
      const orderNumber = counter.last_order_number;

      // 2. Nếu tạo đơn ở trạng thái CONFIRMED -> Trừ kho có điều kiện (Atomic Conditional Update)
      if (orderData.status === OrderStatus.CONFIRMED) {
        for (const item of orderData.items) {
          const updated = await tx.$executeRaw`
            UPDATE product_variants
            SET stock = stock - ${item.quantity}, updated_at = NOW()
            WHERE id = ${item.product_variant_id}::uuid
              AND shop_id = ${orderData.shop_id}::uuid
              AND stock >= ${item.quantity}
              AND deleted_at IS NULL;
          `;

          if (updated === 0) {
            throw new ConflictError(
              `Sản phẩm [${item.snap_product_name} - ${item.snap_variant_name}] không đủ số lượng tồn kho`,
              'OUT_OF_STOCK',
              { variant_id: item.product_variant_id, requested: item.quantity }
            );
          }
        }
      }

      // 3. Tạo bản ghi đơn hàng Order
      const order = await tx.order.create({
        data: {
          shop_id: orderData.shop_id,
          order_number: orderNumber,
          customer_id: orderData.customer_id,
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          shipping_address: orderData.shipping_address,
          status: orderData.status,
          source: orderData.source,
          subtotal_vnd: orderData.subtotal_vnd,
          shipping_fee_vnd: orderData.shipping_fee_vnd,
          discount_vnd: orderData.discount_vnd,
          total_vnd: orderData.total_vnd,
          notes: orderData.notes,
          created_by: orderData.created_by,
          items: {
            create: orderData.items.map((item) => ({
              product_variant_id: item.product_variant_id,
              snap_product_name: item.snap_product_name,
              snap_variant_name: item.snap_variant_name,
              snap_sku: item.snap_sku,
              snap_price_vnd: item.snap_price_vnd,
              quantity: item.quantity,
              subtotal_vnd: item.subtotal_vnd,
            })),
          },
          status_history: {
            create: {
              from_status: OrderStatus.DRAFT,
              to_status: orderData.status,
              changed_by: orderData.created_by,
              reason: 'Khởi tạo đơn hàng thủ công',
            },
          },
        },
        include: {
          items: true,
          status_history: true,
        },
      });

      return order;
    });
  }

  /**
   * Tạo đơn hàng nháp kèm bản ghi phân tích DraftAiMeta từ tin nhắn Clipboard
   */
  public static async createDraftWithAiMeta(
    data: PreparedOrderData & {
      ai_meta: {
        raw_anonymized_message: string;
        confidence_score: number;
        warning_flags: any;
        ai_response_json: any;
        needs_clarification: boolean;
        questions_for_staff: any;
      };
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const counter = await tx.shopCounter.update({
        where: { shop_id: data.shop_id },
        data: { last_order_number: { increment: 1 } },
        select: { last_order_number: true },
      });
      const orderNumber = counter.last_order_number;

      const order = await tx.order.create({
        data: {
          shop_id: data.shop_id,
          order_number: orderNumber,
          customer_id: data.customer_id,
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          shipping_address: data.shipping_address,
          status: OrderStatus.DRAFT,
          source: data.source,
          subtotal_vnd: data.subtotal_vnd,
          shipping_fee_vnd: data.shipping_fee_vnd,
          discount_vnd: data.discount_vnd,
          total_vnd: data.total_vnd,
          notes: data.notes,
          created_by: data.created_by,
          items: {
            create: data.items.map((item) => ({
              product_variant_id: item.product_variant_id,
              snap_product_name: item.snap_product_name,
              snap_variant_name: item.snap_variant_name,
              snap_sku: item.snap_sku,
              snap_price_vnd: item.snap_price_vnd,
              quantity: item.quantity,
              subtotal_vnd: item.subtotal_vnd,
            })),
          },
          status_history: {
            create: {
              from_status: OrderStatus.DRAFT,
              to_status: OrderStatus.DRAFT,
              changed_by: data.created_by,
              reason: 'Bóc tách tự động từ tin nhắn dán (AI Clipboard Draft)',
            },
          },
          draft_ai_meta: {
            create: data.ai_meta,
          },
        },
        include: {
          items: true,
          draft_ai_meta: true,
        },
      });

      return order;
    });
  }

  /**
   * Xác nhận đơn hàng (DRAFT -> CONFIRMED): Trừ kho nguyên tử trong Transaction
   */
  public static async confirmOrder(shopId: string, orderId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, shop_id: shopId, deleted_at: null },
        include: { items: true },
      });

      if (!order) {
        throw new NotFoundError('Không tìm thấy đơn hàng cần xác nhận');
      }

      if (order.status !== OrderStatus.DRAFT && order.status !== OrderStatus.PENDING_REVIEW) {
        throw new ConflictError(
          `Đơn hàng đang ở trạng thái '${order.status}', không thể xác nhận`,
          'INVALID_STATUS_TRANSITION'
        );
      }

      // "Giành quyền" xác nhận đơn một cách nguyên tử: nếu có 2 yêu cầu bấm Chốt cùng lúc,
      // chỉ 1 yêu cầu cập nhật được (count = 1), yêu cầu còn lại bị từ chối -> không trừ kho 2 lần.
      const claimed = await tx.order.updateMany({
        where: {
          id: orderId,
          shop_id: shopId,
          status: { in: [OrderStatus.DRAFT, OrderStatus.PENDING_REVIEW] },
        },
        data: { status: OrderStatus.CONFIRMED },
      });
      if (claimed.count === 0) {
        throw new ConflictError(
          'Đơn hàng vừa được xử lý ở nơi khác. Vui lòng tải lại danh sách đơn',
          'ORDER_ALREADY_PROCESSED'
        );
      }

      // Trừ kho có điều kiện từng món hàng
      for (const item of order.items) {
        const updated = await tx.$executeRaw`
          UPDATE product_variants
          SET stock = stock - ${item.quantity}, updated_at = NOW()
          WHERE id = ${item.product_variant_id}::uuid
            AND shop_id = ${shopId}::uuid
            AND stock >= ${item.quantity}
            AND deleted_at IS NULL;
        `;

        if (updated === 0) {
          throw new ConflictError(
            `Sản phẩm [${item.snap_product_name} - ${item.snap_variant_name}] đã hết hàng`,
            'OUT_OF_STOCK',
            { variant_id: item.product_variant_id, requested: item.quantity }
          );
        }
      }

      // Cập nhật trạng thái đơn
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CONFIRMED,
          status_history: {
            create: {
              from_status: order.status,
              to_status: OrderStatus.CONFIRMED,
              changed_by: userId,
              reason: 'Chủ shop duyệt và xác nhận đơn hàng (Trừ kho thành công)',
            },
          },
        },
        include: {
          items: true,
          status_history: true,
        },
      });

      return updatedOrder;
    });
  }

  /**
   * Hủy đơn hàng (CANCELLED): Hoàn lại số lượng tồn kho nếu đơn đã từng bị trừ kho
   */
  public static async cancelOrder(shopId: string, orderId: string, userId: string, reason: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, shop_id: shopId, deleted_at: null },
        include: { items: true },
      });

      if (!order) {
        throw new NotFoundError('Không tìm thấy đơn hàng cần hủy');
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new ConflictError('Đơn hàng đã bị hủy trước đó', 'ORDER_ALREADY_CANCELLED');
      }

      // Đơn đã giao/đã trả không được hủy (nếu hủy sẽ cộng kho sai). Phải theo đúng quy trình trạng thái.
      OrderStateMachine.validateTransition(order.status, OrderStatus.CANCELLED);

      // Giành quyền hủy một cách nguyên tử, chỉ khi trạng thái vẫn đúng như vừa đọc
      // -> không hoàn kho 2 lần khi bấm Hủy hai lần, không hoàn sai khi trạng thái vừa đổi.
      const claimed = await tx.order.updateMany({
        where: { id: orderId, shop_id: shopId, status: order.status },
        data: { status: OrderStatus.CANCELLED },
      });
      if (claimed.count === 0) {
        throw new ConflictError(
          'Trạng thái đơn hàng vừa thay đổi. Vui lòng tải lại rồi thử lại',
          'ORDER_STATUS_CHANGED'
        );
      }

      // Nếu đơn đang ở trạng thái đã trừ kho (CONFIRMED, SHIPPING) -> Hoàn trả tồn kho
      const wasStockDeducted = OrderStateMachine.isStockDeducted(order.status);
      if (wasStockDeducted) {
        for (const item of order.items) {
          await tx.$executeRaw`
            UPDATE product_variants
            SET stock = stock + ${item.quantity}, updated_at = NOW()
            WHERE id = ${item.product_variant_id}::uuid
              AND shop_id = ${shopId}::uuid;
          `;
        }
      }

      // Cập nhật trạng thái sang CANCELLED
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          status_history: {
            create: {
              from_status: order.status,
              to_status: OrderStatus.CANCELLED,
              changed_by: userId,
              reason: wasStockDeducted
                ? `Hủy đơn và hoàn tồn kho: ${reason}`
                : `Hủy đơn: ${reason}`,
            },
          },
        },
        include: {
          items: true,
          status_history: true,
        },
      });

      return updatedOrder;
    });
  }

  /**
   * Cập nhật trạng thái thông thường (SHIPPING -> DELIVERED, RETURNED)
   */
  public static async updateStatus(
    shopId: string,
    orderId: string,
    userId: string,
    toStatus: OrderStatus,
    reason?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, shop_id: shopId, deleted_at: null },
      });

      if (!order) {
        throw new NotFoundError('Không tìm thấy đơn hàng');
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: toStatus,
          status_history: {
            create: {
              from_status: order.status,
              to_status: toStatus,
              changed_by: userId,
              reason: reason || `Chuyển trạng thái sang ${toStatus}`,
            },
          },
        },
        include: {
          items: true,
          status_history: true,
        },
      });

      return updated;
    });
  }
}

export default OrderRepository;
