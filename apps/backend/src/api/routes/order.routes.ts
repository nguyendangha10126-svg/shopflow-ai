import { Router, Request, Response, NextFunction } from 'express';
import { OrderService } from '../../services/order.service';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
  orderQuerySchema,
} from '../validators/order.validator';

const router = Router();

// Mọi thao tác đơn hàng đều yêu cầu xác thực để lấy shop_id và user_id từ Token
router.use(authenticate);

// 1. Danh sách đơn hàng (Phân trang, lọc trạng thái, tìm kiếm mã đơn #1001 hoặc tên khách)
router.get(
  '/',
  validate({ query: orderQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await OrderService.listOrders(req.user!.shopId, req.query as any);
      res.status(200).json({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 2. Tạo đơn hàng mới (DRAFT hoặc CONFIRMED)
router.post(
  '/',
  validate({ body: createOrderSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await OrderService.createOrder(req.user!.shopId, req.user!.userId, req.body);
      res.status(201).json({
        message: 'Tạo đơn hàng thành công',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }
);

// 3. Chi tiết đơn hàng kèm danh sách sản phẩm snapshot và lịch sử trạng thái
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await OrderService.getOrderById(req.user!.shopId, req.params.id);
    res.status(200).json({
      data: { order },
    });
  } catch (error) {
    next(error);
  }
});

// 4. Xác nhận đơn hàng (Duyệt đơn nháp & Trừ kho nguyên tử)
router.post('/:id/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await OrderService.confirmOrder(
      req.user!.shopId,
      req.params.id,
      req.user!.userId
    );
    res.status(200).json({
      message: 'Xác nhận đơn hàng và trừ kho nguyên tử thành công',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
});

// 5. Cập nhật trạng thái vòng đời đơn (SHIPPING, DELIVERED, RETURNED)
router.post(
  '/:id/status',
  validate({ body: updateOrderStatusSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await OrderService.updateStatus(
        req.user!.shopId,
        req.params.id,
        req.user!.userId,
        req.body
      );
      res.status(200).json({
        message: `Chuyển trạng thái đơn hàng sang ${req.body.status} thành công`,
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }
);

// 6. Hủy đơn hàng (Hoàn trả tồn kho nếu đơn đã từng trừ kho)
router.post(
  '/:id/cancel',
  validate({ body: cancelOrderSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await OrderService.cancelOrder(
        req.user!.shopId,
        req.params.id,
        req.user!.userId,
        req.body.reason
      );
      res.status(200).json({
        message: 'Hủy đơn hàng thành công (Đã hoàn lại số lượng tồn kho)',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
