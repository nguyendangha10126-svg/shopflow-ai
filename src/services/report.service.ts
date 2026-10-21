import { prisma } from '../infrastructure/database/prisma';
import { OrderStatus } from '@prisma/client';

export class ReportService {
  /**
   * Báo cáo Doanh thu theo Ngày (Chỉ áp dụng cho đơn DELIVERED)
   * Nghiêm ngặt: Chỉ vai trò OWNER mới được quyền gọi
   */
  async getDailyRevenue(shopId: string, days: number = 30) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    fromDate.setHours(0, 0, 0, 0);

    // Truy vấn các đơn hàng DELIVERED trong khoảng thời gian
    const orders = await prisma.order.findMany({
      where: {
        shop_id: shopId,
        status: OrderStatus.DELIVERED,
        created_at: { gte: fromDate }
      },
      select: {
        created_at: true,
        total_vnd: true,
        shipping_fee_vnd: true
      },
      orderBy: { created_at: 'asc' }
    });

    // Gom nhóm theo ngày (YYYY-MM-DD)
    const grouped = new Map<
      string,
      { total_orders: number; revenue_vnd: number; total_shipping_fee_vnd: number }
    >();

    for (const order of orders) {
      const dateKey = order.created_at.toISOString().split('T')[0];
      const existing = grouped.get(dateKey) || {
        total_orders: 0,
        revenue_vnd: 0,
        total_shipping_fee_vnd: 0
      };

      existing.total_orders += 1;
      existing.revenue_vnd += order.total_vnd;
      existing.total_shipping_fee_vnd += order.shipping_fee_vnd;

      grouped.set(dateKey, existing);
    }

    return Array.from(grouped.entries()).map(([report_date, data]) => ({
      report_date,
      ...data
    }));
  }

  /**
   * Top sản phẩm bán chạy nhất trong shop
   */
  async getTopSellingProducts(shopId: string, limit: number = 5) {
    // Lấy các order_items từ các đơn không bị CANCELLED
    const items = await prisma.orderItem.findMany({
      where: {
        order: {
          shop_id: shopId,
          status: { not: OrderStatus.CANCELLED }
        }
      },
      select: {
        snap_product_name: true,
        snap_sku: true,
        quantity: true,
        subtotal_vnd: true
      }
    });

    // Gom nhóm tính tổng số lượng bán và doanh số
    const statsMap = new Map<
      string,
      { snap_product_name: string; snap_sku: string; total_sold: number; total_revenue_vnd: number }
    >();

    for (const item of items) {
      const key = item.snap_sku || item.snap_product_name;
      const existing = statsMap.get(key) || {
        snap_product_name: item.snap_product_name,
        snap_sku: item.snap_sku,
        total_sold: 0,
        total_revenue_vnd: 0
      };

      existing.total_sold += item.quantity;
      existing.total_revenue_vnd += item.subtotal_vnd;
      statsMap.set(key, existing);
    }

    const sorted = Array.from(statsMap.values()).sort((a, b) => b.total_sold - a.total_sold);
    return sorted.slice(0, limit);
  }

  /**
   * Danh sách toàn bộ biến thể có tồn kho <= ngưỡng cảnh báo
   */
  async getLowStockVariants(shopId: string) {
    const variants = await prisma.productVariant.findMany({
      where: {
        shop_id: shopId,
        deleted_at: null
      },
      include: {
        product: { select: { name: true } }
      },
      orderBy: { stock: 'asc' }
    });

    // Lọc các biến thể có tồn kho <= low_stock_threshold
    const lowStockList = variants.filter((v) => v.stock <= v.low_stock_threshold);

    return lowStockList.map((v) => ({
      variant_id: v.id,
      product_name: v.product.name,
      variant_name: v.variant_name,
      sku: v.sku,
      size: v.size,
      color: v.color,
      stock: v.stock,
      low_stock_threshold: v.low_stock_threshold,
      is_out_of_stock: v.stock === 0
    }));
  }

  /**
   * Báo cáo Tài nguyên & Hạn mức Gói cước AI trong tháng
   */
  async getUsageReport(shopId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const subscription = await prisma.subscription.findFirst({
      where: { shop_id: shopId, status: { in: ['ACTIVE', 'TRIAL'] } },
      include: { plan: true }
    });

    const plan = subscription?.plan || {
      name: 'Gói Dùng thử Miễn phí',
      max_ai_drafts_per_month: 30,
      max_ai_faq_per_month: 50
    };

    // Thống kê nhật ký sử dụng AI
    const aiLogs = await prisma.aiLog.findMany({
      where: {
        shop_id: shopId,
        created_at: { gte: startOfMonth }
      },
      select: {
        feature: true,
        input_tokens: true,
        output_tokens: true,
        status: true
      }
    });

    const draftOrdersCount = aiLogs.filter((l) => l.feature === 'DRAFT_ORDER' && l.status === 'SUCCESS').length;
    const faqAnswersCount = aiLogs.filter((l) => l.feature === 'FAQ_ANSWER' && l.status === 'SUCCESS').length;
    const totalTokens = aiLogs.reduce((sum, l) => sum + l.input_tokens + l.output_tokens, 0);

    return {
      plan_name: plan.name,
      period: `${startOfMonth.toISOString().split('T')[0]} đến nay`,
      draft_orders: {
        used: draftOrdersCount,
        max: plan.max_ai_drafts_per_month,
        remaining: Math.max(0, plan.max_ai_drafts_per_month - draftOrdersCount),
        percentage: Math.min(100, Math.round((draftOrdersCount / plan.max_ai_drafts_per_month) * 100))
      },
      faq_answers: {
        used: faqAnswersCount,
        max: plan.max_ai_faq_per_month,
        remaining: Math.max(0, plan.max_ai_faq_per_month - faqAnswersCount),
        percentage: Math.min(100, Math.round((faqAnswersCount / plan.max_ai_faq_per_month) * 100))
      },
      total_tokens_consumed: totalTokens
    };
  }
}

