import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { UserRole } from '@prisma/client';

const router = Router();
const controller = new ReportController();

router.use(authenticateToken);

// Chỉ OWNER mới được xem hóa đơn & mức dùng tài nguyên AI
router.get('/', requireRole([UserRole.OWNER]), controller.getUsageReport);

export default router;

