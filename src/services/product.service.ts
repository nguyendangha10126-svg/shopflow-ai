import { prisma } from "../infrastructure/database/prisma";
import { NotFoundError } from "../core/errors/app-error";
import { ListProductsQuery } from "../api/validators/product.validator";

export class ProductService {
  async listProducts(shopId: string, query: ListProductsQuery) {
    const { search, category, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      shop_id: shopId,
      deleted_at: null,
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        {
          variants: {
            some: {
              sku: { contains: search, mode: "insensitive" },
            },
          },
        },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          variants: {
            where: { deleted_at: null },
            orderBy: { created_at: "asc" },
          },
        },
        skip,
        take: limit,
        orderBy: { updated_at: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductById(shopId: string, productId: string) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        shop_id: shopId,
        deleted_at: null,
      },
      include: {
        variants: {
          where: { deleted_at: null },
        },
      },
    });

    if (!product) {
      throw new NotFoundError(
        "PRODUCT_NOT_FOUND",
        "Không tìm thấy sản phẩm trong shop của bạn",
      );
    }

    return product;
  }

  async updateVariantStock(
    shopId: string,
    userId: string,
    variantId: string,
    newStock: number,
  ) {
    const variant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        shop_id: shopId,
        deleted_at: null,
      },
    });

    if (!variant) {
      throw new NotFoundError(
        "VARIANT_NOT_FOUND",
        "Không tìm thấy biến thể sản phẩm",
      );
    }

    const oldStock = variant.stock;

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.productVariant.update({
        where: { id: variantId },
        data: { stock: newStock },
      });

      // Ghi nhận AuditLog thay đổi tồn kho trực tiếp
      await tx.auditLog.create({
        data: {
          shop_id: shopId,
          user_id: userId,
          action: "MANUAL_STOCK_UPDATE",
          entity_type: "PRODUCT_VARIANT",
          entity_id: variantId,
          old_values: { stock: oldStock },
          new_values: { stock: newStock },
        },
      });

      return updated;
    });
  }
}
