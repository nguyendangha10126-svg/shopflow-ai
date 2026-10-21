import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../../services/order.service';
import { OrderCheckoutFacade } from '../../services/order-checkout.facade';

const orderService = new OrderService();
const checkoutFacade = new OrderCheckoutFacade();

export class OrderController {
  async createDraftOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.createDraftOrder(
        req.user!.shopId,
        req.user!.userId,
        req.body
      );
      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  }

  async confirmOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
      const order = await checkoutFacade.confirmOrder(
        req.user!.shopId,
        req.user!.userId,
        req.params.id,
        idempotencyKey
      );
      res.status(200).json({
        message: 'Chốt đơn hàng thành công, tồn kho đã được trừ nguyên tử',
        order
      });
    } catch (err) {
      next(err);
    }
  }

  async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      const order = await checkoutFacade.cancelOrder(
        req.user!.shopId,
        req.user!.userId,
        req.params.id,
        reason
      );
      res.status(200).json({
        message: 'Hủy đơn hàng thành công, tồn kho đã được hoàn lại',
        order
      });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.updateOrderStatus(
        req.user!.shopId,
        req.user!.userId,
        req.params.id,
        req.body
      );
      res.status(200).json({
        message: 'Cập nhật trạng thái đơn hàng thành công',
        order
      });
    } catch (err) {
      next(err);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.getOrderById(
        req.user!.shopId,
        req.user!.role,
        req.params.id
      );
      res.status(200).json(order);
    } catch (err) {
      next(err);
    }
  }

  async listOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await orderService.listOrders(req.user!.shopId, req.query as any);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

