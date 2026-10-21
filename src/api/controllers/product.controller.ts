import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../../services/product.service';

const productService = new ProductService();

export class ProductController {
  async listProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.listProducts(req.user!.shopId, req.query as any);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.getProductById(req.user!.shopId, req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.updateVariantStock(
        req.user!.shopId,
        req.user!.userId,
        req.params.variantId,
        req.body.stock
      );
      res.status(200).json({
        message: 'Cập nhật tồn kho thành công',
        variant: result
      });
    } catch (err) {
      next(err);
    }
  }
}

