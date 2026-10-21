import { Router, Request, Response, NextFunction } from 'express';
import { ProductService } from '../../services/product.service';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createProductSchema,
  updateProductSchema,
  updateVariantSchema,
  productQuerySchema,
} from '../validators/product.validator';

const router = Router();

// Mọi route sản phẩm đều yêu cầu đăng nhập (authenticate) để trích xuất shop_id từ token
router.use(authenticate);

// 1. Danh sách sản phẩm (Phân trang, tìm kiếm, lọc tồn kho)
router.get(
  '/',
  validate({ query: productQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await ProductService.listProducts(req.user!.shopId, req.query as any);
      res.status(200).json({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 2. Tạo sản phẩm mới kèm các biến thể
router.post(
  '/',
  validate({ body: createProductSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await ProductService.createProduct(req.user!.shopId, req.body);
      res.status(201).json({
        message: 'Tạo sản phẩm và các biến thể thành công',
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }
);

// 3. Cập nhật riêng lẻ biến thể (giá / tồn kho)
router.patch(
  '/variants/:variantId',
  validate({ body: updateVariantSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const variant = await ProductService.updateVariant(
        req.user!.shopId,
        req.params.variantId,
        req.body
      );
      res.status(200).json({
        message: 'Cập nhật biến thể thành công',
        data: { variant },
      });
    } catch (error) {
      next(error);
    }
  }
);

// 4. Chi tiết một sản phẩm
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await ProductService.getProductById(req.user!.shopId, req.params.id);
    res.status(200).json({
      data: { product },
    });
  } catch (error) {
    next(error);
  }
});

// 5. Cập nhật thông tin sản phẩm
router.patch(
  '/:id',
  validate({ body: updateProductSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await ProductService.updateProduct(req.user!.shopId, req.params.id, req.body);
      res.status(200).json({
        message: 'Cập nhật sản phẩm thành công',
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }
);

// 6. Xóa mềm sản phẩm (Soft delete)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await ProductService.deleteProduct(req.user!.shopId, req.params.id);
    res.status(200).json({
      message: 'Xóa sản phẩm thành công (xóa mềm)',
      data: { product: deleted },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
