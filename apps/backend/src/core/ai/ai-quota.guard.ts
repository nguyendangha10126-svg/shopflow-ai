import { prisma } from '../../db';
import { ForbiddenError } from '../errors/app-error';

export class AIQuotaGuard {
  /**
   * Kiểm tra hạn mức sử dụng AI bóc tách đơn hàng trong tháng hiện tại
   */
  public static async verifyQuota(shopId: string): Promise<{
    currentUsage: number;
    maxLimit: number;
    remaining: number;
  }> {
    // 1. Xác định khoảng thời gian đầu tháng hiện tại
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 2. Lấy thông tin gói đăng ký của Shop
    const subscription = await prisma.subscription.findFirst({
      where: {
        shop_id: shopId,
        status: { in: ['ACTIVE', 'TRIAL'] },
      },
      include: {
        plan: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const maxLimit = subscription?.plan?.max_ai_drafts_per_month ?? 30; // Mặc định 30 lượt/tháng

    // 3. Đếm số lần gọi AI bóc tách đơn hàng thành công trong tháng
    const currentUsage = await prisma.aiLog.count({
      where: {
        shop_id: shopId,
        feature: 'DRAFT_ORDER',
        status: 'SUCCESS',
        created_at: {
          gte: startOfMonth,
        },
      },
    });

    if (currentUsage >= maxLimit) {
      throw new ForbiddenError(
        `Cửa hàng đã sử dụng hết hạn mức AI (${currentUsage}/${maxLimit} lượt/tháng). Vui lòng nâng cấp gói dịch vụ để tiếp tục sử dụng tính năng này.`
      );
    }

    return {
      currentUsage,
      maxLimit,
      remaining: maxLimit - currentUsage,
    };
  }
}

