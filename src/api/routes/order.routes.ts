import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema
} from '../validators/order.validator';

const router = Router();
const controller = new OrderController();

// Tất cả endpoints đơn hàng yêu cầu xác thực JWT
router.use(authenticateToken);

router.post('/', validate({ body: createOrderSchema }), controller.createDraftOrder);
router.get('/', controller.listOrders);
router.get('/:id', controller.getOrderById);
router.post('/:id/confirm', controller.confirmOrder);
router.post('/:id/cancel', validate({ body: cancelOrderSchema }), controller.cancelOrder);
router.patch('/:id/status', validate({ body: updateOrderStatusSchema }), controller.updateStatus);

export default router;

