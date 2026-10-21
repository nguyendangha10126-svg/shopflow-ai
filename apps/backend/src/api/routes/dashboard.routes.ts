import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { DashboardService } from '../../services/dashboard.service';

const router = Router();

// Toàn bộ báo cáo Dashboard yêu cầu xác thực JWT để lấy shopId
router.use(authenticate);

/**
 * GET /api/v1/dashboard/summary
 * Tổng hợp toàn bộ KPI doanh thu, đơn hàng, biểu đồ 7 ngày và mức sử dụng AI
 */
router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await DashboardService.getSummary(req.user!.shopId);
    res.status(200).json({
      message: 'Lấy dữ liệu tổng quan thành công',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

