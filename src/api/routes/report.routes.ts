import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { UserRole } from '@prisma/client';

const router = Router();
const controller = new ReportController();

router.use(authenticateToken);

// Chỉ OWNER mới được xem báo cáo doanh thu
router.get('/revenue', requireRole([UserRole.OWNER]), controller.getRevenueReport);

// Cả OWNER và STAFF đều được xem Top sản phẩm và Cảnh báo hết hàng
router.get('/top-products', controller.getTopProducts);
router.get('/low-stock', controller.getLowStockVariants);

export default router;

