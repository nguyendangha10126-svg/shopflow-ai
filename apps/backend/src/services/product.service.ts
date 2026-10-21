import { ProductRepository } from '../repositories/product.repository';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdateVariantDto,
  ProductQueryDto,
} from '../api/validators/product.validator';

export class ProductService {
  public static async listProducts(shopId: string, query: ProductQueryDto) {
    return ProductRepository.findMany(shopId, query);
  }

  public static async getProductById(shopId: string, productId: string) {
    return ProductRepository.findById(shopId, productId);
  }

  public static async createProduct(shopId: string, dto: CreateProductDto) {
    return ProductRepository.create(shopId, dto);
  }

  public static async updateProduct(shopId: string, productId: string, dto: UpdateProductDto) {
    return ProductRepository.update(shopId, productId, dto);
  }

  public static async deleteProduct(shopId: string, productId: string) {
    return ProductRepository.softDelete(shopId, productId);
  }

  public static async updateVariant(shopId: string, variantId: string, dto: UpdateVariantDto) {
    return ProductRepository.updateVariant(shopId, variantId, dto);
  }
}

export default ProductService;
