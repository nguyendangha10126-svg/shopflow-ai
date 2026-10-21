import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  listProductsQuerySchema,
  updateStockSchema,
} from "../validators/product.validator";

const router = Router();
const controller = new ProductController();

// Tất cả endpoints sản phẩm yêu cầu đăng nhập
router.use(authenticateToken);

router.get(
  "/",
  validate({ query: listProductsQuerySchema }),
  controller.listProducts,
);
router.get("/:id", controller.getProductById);
router.patch(
  "/:id/variants/:variantId/stock",
  validate({ body: updateStockSchema }),
  controller.updateStock,
);

export default router;
