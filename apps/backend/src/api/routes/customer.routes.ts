import { Router, Request, Response, NextFunction } from 'express';
import { CustomerService } from '../../services/customer.service';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
} from '../validators/customer.validator';

const router = Router();

// Mọi route khách hàng đều yêu cầu đăng nhập (authenticate) để trích xuất shop_id từ token
router.use(authenticate);

// 1. Danh sách khách hàng (Phân trang, tìm kiếm theo tên hoặc SĐT)
router.get(
  '/',
  validate({ query: customerQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await CustomerService.listCustomers(req.user!.shopId, req.query as any);
      res.status(200).json({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 2. Tạo khách hàng mới
router.post(
  '/',
  validate({ body: createCustomerSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await CustomerService.createCustomer(req.user!.shopId, req.body);
      res.status(201).json({
        message: 'Tạo thông tin khách hàng thành công',
        data: { customer },
      });
    } catch (error) {
      next(error);
    }
  }
);

// 3. Chi tiết khách hàng
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await CustomerService.getCustomerById(req.user!.shopId, req.params.id);
    res.status(200).json({
      data: { customer },
    });
  } catch (error) {
    next(error);
  }
});

// 4. Cập nhật thông tin khách hàng
router.patch(
  '/:id',
  validate({ body: updateCustomerSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await CustomerService.updateCustomer(
        req.user!.shopId,
        req.params.id,
        req.body
      );
      res.status(200).json({
        message: 'Cập nhật thông tin khách hàng thành công',
        data: { customer },
      });
    } catch (error) {
      next(error);
    }
  }
);

// 5. Xóa mềm khách hàng (Soft delete)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await CustomerService.deleteCustomer(req.user!.shopId, req.params.id);
    res.status(200).json({
      message: 'Xóa khách hàng thành công (xóa mềm)',
      data: { customer: deleted },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
