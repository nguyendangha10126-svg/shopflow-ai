import { Prisma, OrderStatus } from '@prisma/client';
import { prisma } from '../db';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerQueryDto,
} from '../api/validators/customer.validator';
import { NotFoundError, ConflictError } from '../core/errors/app-error';
import { shouldUseDemoFallback } from '../core/db-fallback';

export class CustomerRepository {
  private static serializeCustomer(c: any) {
    return {
      ...c,
      total_spent_vnd: Number(c.total_spent_vnd ?? 0),
    };
  }


  /**
   * Gắn số đơn đã mua và tổng chi tiêu TÍNH TRỰC TIẾP TỪ BẢNG ĐƠN HÀNG.
   * (Hai cột total_orders / total_spent_vnd trong bảng customers không được cập nhật ở đâu cả,
   *  nên không dùng. Tính từ đơn thật luôn khớp với trang Đơn hàng.)
   * Quy ước: chỉ tính đơn ĐÃ CHỐT trở đi (xác nhận / đang giao / hoàn thành).
   */
  private static async attachOrderStats(shopId: string, customers: any[]) {
    if (customers.length === 0) return customers;
    const ids = customers.map((c) => c.id);
    const grouped = await prisma.order.groupBy({
      by: ['customer_id'],
      where: {
        shop_id: shopId,
        customer_id: { in: ids },
        deleted_at: null,
        status: { in: [OrderStatus.CONFIRMED, OrderStatus.SHIPPING, OrderStatus.DELIVERED] },
      },
      _count: { _all: true },
      _sum: { total_vnd: true },
    });
    const byCustomer = new Map(
      grouped.map((g) => [
        g.customer_id as string,
        { orders: g._count._all, spent: g._sum.total_vnd ?? 0 },
      ])
    );
    return customers.map((c) => {
      const st = byCustomer.get(c.id);
      return { ...c, total_orders: st?.orders ?? 0, total_spent_vnd: st?.spent ?? 0 };
    });
  }

  public static async findMany(shopId: string, query: CustomerQueryDto) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      shop_id: shopId,
      deleted_at: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };

    try {
      const [items, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
        }),
        prisma.customer.count({ where }),
      ]);

      const withStats = await this.attachOrderStats(shopId, items);
      return {
        items: withStats.map(this.serializeCustomer),
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      };
    } catch (err: any) {
      if (shouldUseDemoFallback(err)) {
        const allMockCustomers = [
          {
            id: 'cust-001',
            shop_id: shopId,
            name: 'Lê Thu Hương',
            phone: '0987654321',
            address: 'Số 15 ngõ 120 Hoàng Hoa Thám, Ba Đình, Hà Nội',
            total_orders: 3,
            total_spent_vnd: 790000,
            notes: 'Khách hay mua váy hoa nhí, thích giao giờ hành chính',
            created_at: new Date(Date.now() - 3600000 * 24 * 30),
          },
          {
            id: 'cust-002',
            shop_id: shopId,
            name: 'Trần Mai Chi',
            phone: '0912345678',
            address: '45 Lê Duẩn, Quận 1, TP.HCM',
            total_orders: 1,
            total_spent_vnd: 310000,
            notes: 'Khách đặt qua Instagram, chuyển khoản trước',
            created_at: new Date(Date.now() - 3600000 * 24 * 15),
          },
          {
            id: 'cust-003',
            shop_id: shopId,
            name: 'Nguyễn Thùy Linh',
            phone: '0934567890',
            address: '12 Tôn Đức Thắng, Đống Đa, Hà Nội',
            total_orders: 1,
            total_spent_vnd: 650000,
            notes: 'Khách mua set vest công sở',
            created_at: new Date(Date.now() - 3600000 * 24 * 10),
          },
          {
            id: 'cust-004',
            shop_id: shopId,
            name: 'Phạm Hồng Nhung',
            phone: '0978901234',
            address: '88 Nguyễn Trãi, Thanh Xuân, Hà Nội',
            total_orders: 1,
            total_spent_vnd: 560000,
            notes: 'Mua 2 áo sơ mi lụa trắng',
            created_at: new Date(Date.now() - 3600000 * 24 * 5),
          },
          {
            id: 'cust-005',
            shop_id: shopId,
            name: 'Hoàng Khánh Ly',
            phone: '0905123456',
            address: 'Vincom Center, 72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM',
            total_orders: 1,
            total_spent_vnd: 890000,
            notes: 'Khách VIP đặt may',
            created_at: new Date(Date.now() - 3600000 * 24 * 4),
          },
          {
            id: 'cust-006',
            shop_id: shopId,
            name: 'Đặng Thị Thu Hà',
            phone: '0943210987',
            address: 'Chợ Cồn, Hải Châu, Đà Nẵng',
            total_orders: 0,
            total_spent_vnd: 0,
            notes: 'Khách mới hỏi qua tin nhắn dán AI, chưa chốt đơn',
            created_at: new Date(Date.now() - 3600000 * 2),
          },
        ];

        let filtered = allMockCustomers;
        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter((c) => c.name.toLowerCase().includes(s) || c.phone.includes(s));
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

  public static async findById(shopId: string, customerId: string) {
    try {
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          shop_id: shopId,
          deleted_at: null,
        },
      });

      if (!customer) {
        throw new NotFoundError('Không tìm thấy khách hàng hoặc khách hàng đã bị xóa');
      }

      const [withStats] = await this.attachOrderStats(shopId, [customer]);
      return this.serializeCustomer(withStats);
    } catch (err: any) {
      if (shouldUseDemoFallback(err)) {
        const result = await this.findMany(shopId, { page: 1, limit: 100 });
        const found = result.items.find((c: any) => c.id === customerId);
        if (!found) throw new NotFoundError('Không tìm thấy khách hàng hoặc khách hàng đã bị xóa');
        return found;
      }
      throw err;
    }
  }

  public static async create(shopId: string, dto: CreateCustomerDto) {
    // Kiểm tra trùng số điện thoại trong cùng shop (chỉ tính các khách chưa bị xóa mềm)
    const existing = await prisma.customer.findFirst({
      where: {
        shop_id: shopId,
        phone: dto.phone,
        deleted_at: null,
      },
    });

    if (existing) {
      throw new ConflictError(
        `Khách hàng với số điện thoại ${dto.phone} đã tồn tại trong cửa hàng`,
        'DUPLICATE_PHONE'
      );
    }

    const created = await prisma.customer.create({
      data: {
        shop_id: shopId,
        name: dto.name,
        phone: dto.phone,
        address: dto.address,
        notes: dto.notes,
      },
    });

    return this.serializeCustomer(created);
  }

  public static async update(shopId: string, customerId: string, dto: UpdateCustomerDto) {
    await this.findById(shopId, customerId);

    if (dto.phone) {
      const duplicatePhone = await prisma.customer.findFirst({
        where: {
          shop_id: shopId,
          phone: dto.phone,
          deleted_at: null,
          id: { not: customerId },
        },
      });

      if (duplicatePhone) {
        throw new ConflictError(
          `Số điện thoại ${dto.phone} đã được sử dụng bởi khách hàng khác`,
          'DUPLICATE_PHONE'
        );
      }
    }

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });

    return this.serializeCustomer(updated);
  }

  public static async softDelete(shopId: string, customerId: string) {
    await this.findById(shopId, customerId);

    const deleted = await prisma.customer.update({
      where: { id: customerId },
      data: {
        deleted_at: new Date(),
      },
    });

    return this.serializeCustomer(deleted);
  }
}

export default CustomerRepository;
