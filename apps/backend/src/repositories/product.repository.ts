import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdateVariantDto,
  ProductQueryDto,
} from '../api/validators/product.validator';
import { NotFoundError, ConflictError } from '../core/errors/app-error';

// In-memory fallback dataset cho chế độ offline/dev
export const mockProductsList: Array<any> = [
  {
    id: 'prod-001',
    shop_id: 'shop-may-001',
    name: 'Váy hoa nhí dáng xòe Vintage',
    category: 'Váy nữ',
    description: 'Váy hoa nhí vải voan tơ cao cấp 2 lớp mềm mại phong cách Hàn Quốc',
    image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&q=80',
    image_urls: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&q=80',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&q=80',
    ],
    is_active: true,
    deleted_at: null,
    created_at: new Date('2026-10-01T08:00:00Z'),
    updated_at: new Date(),
    variants: [
      {
        id: 'var-001',
        shop_id: 'shop-may-001',
        product_id: 'prod-001',
        sku: 'VAY-HOA-S',
        variant_name: 'Váy hoa nhí (Size S)',
        size: 'S',
        color: 'Vàng kem',
        price_vnd: 250000,
        stock: 12,
        low_stock_threshold: 5,
        is_active: true,
        deleted_at: null,
      },
      {
        id: 'var-002',
        shop_id: 'shop-may-001',
        product_id: 'prod-001',
        sku: 'VAY-HOA-M',
        variant_name: 'Váy hoa nhí (Size M)',
        size: 'M',
        color: 'Vàng kem',
        price_vnd: 260000,
        stock: 3,
        low_stock_threshold: 5,
        is_active: true,
        deleted_at: null,
      },
      {
        id: 'var-003',
        shop_id: 'shop-may-001',
        product_id: 'prod-001',
        sku: 'VAY-HOA-L',
        variant_name: 'Váy hoa nhí (Size L)',
        size: 'L',
        color: 'Vàng kem',
        price_vnd: 270000,
        stock: 15,
        low_stock_threshold: 5,
        is_active: true,
        deleted_at: null,
      },
    ],
  },
  {
    id: 'prod-002',
    shop_id: 'shop-may-001',
    name: 'Áo sơ mi lụa cổ V thanh lịch',
    category: 'Áo công sở',
    description: 'Áo sơ mi nữ công sở chất lụa tơ tằm mềm mịn, không nhăn',
    image_url: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=500&q=80',
    image_urls: [
      'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=500&q=80',
      'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=500&q=80',
    ],
    is_active: true,
    deleted_at: null,
    created_at: new Date('2026-10-03T09:00:00Z'),
    updated_at: new Date(),
    variants: [
      {
        id: 'var-004',
        shop_id: 'shop-may-001',
        product_id: 'prod-002',
        sku: 'SOMI-LUA-TRANG-S',
        variant_name: 'Áo sơ mi lụa (Trắng - S)',
        size: 'S',
        color: 'Trắng',
        price_vnd: 190000,
        stock: 20,
        low_stock_threshold: 5,
        is_active: true,
        deleted_at: null,
      },
      {
        id: 'var-005',
        shop_id: 'shop-may-001',
        product_id: 'prod-002',
        sku: 'SOMI-LUA-TRANG-M',
        variant_name: 'Áo sơ mi lụa (Trắng - M)',
        size: 'M',
        color: 'Trắng',
        price_vnd: 195000,
        stock: 4,
        low_stock_threshold: 5,
        is_active: true,
        deleted_at: null,
      },
      {
        id: 'var-006',
        shop_id: 'shop-may-001',
        product_id: 'prod-002',
        sku: 'SOMI-LUA-HONG-S',
        variant_name: 'Áo sơ mi lụa (Hồng pastel - S)',
        size: 'S',
        color: 'Hồng pastel',
        price_vnd: 190000,
        stock: 8,
        low_stock_threshold: 5,
        is_active: true,
        deleted_at: null,
      },
    ],
  },
  {
    id: 'prod-003',
    shop_id: 'shop-may-001',
    name: 'Quần tây ống rộng cạp cao tôn dáng',
    category: 'Quần nữ',
    description: 'Quần ống rộng hack dáng vải tuyết mưa dày dặn lên form chuẩn',
    image_url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&q=80',
    image_urls: ['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&q=80'],
    is_active: true,
    deleted_at: null,
    created_at: new Date('2026-10-05T10:00:00Z'),
    updated_at: new Date(),
    variants: [
      {
        id: 'var-007',
        shop_id: 'shop-may-001',
        product_id: 'prod-003',
        sku: 'QUAN-TAY-NAU-S',
        variant_name: 'Quần tây ống rộng (Nâu - S)',
        size: 'S',
        color: 'Nâu tây',
        price_vnd: 220000,
        stock: 14,
        low_stock_threshold: 5,
        is_active: true,
        deleted_at: null,
      },
    ],
  },
  {
    id: 'prod-004',
    shop_id: 'shop-may-001',
    name: 'Set bộ vest công sở cao cấp',
    category: 'Set bộ',
    description: 'Set áo vest kèm quần suông thanh lịch chuẩn form May Boutique',
    image_url: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?w=500&q=80',
    image_urls: ['https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?w=500&q=80'],
    is_active: true,
    deleted_at: null,
    created_at: new Date('2026-10-08T11:00:00Z'),
    updated_at: new Date(),
    variants: [
      {
        id: 'var-008',
        shop_id: 'shop-may-001',
        product_id: 'prod-004',
        sku: 'SET-VEST-BE',
        variant_name: 'Set vest (Be - Freesize)',
        size: 'Freesize',
        color: 'Be',
        price_vnd: 650000,
        stock: 7,
        low_stock_threshold: 5,
        is_active: true,
        deleted_at: null,
      },
    ],
  },
];

export class ProductRepository {
  public static async findMany(shopId: string, query: ProductQueryDto) {
    const { page, limit, search, category, low_stock } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      shop_id: shopId,
      deleted_at: null,
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              {
                variants: {
                  some: {
                    deleted_at: null,
                    OR: [
                      { sku: { contains: search, mode: 'insensitive' } },
                      { variant_name: { contains: search, mode: 'insensitive' } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
      ...(low_stock
        ? {
            variants: {
              some: {
                deleted_at: null,
                stock: { lte: 5 },
              },
            },
          }
        : {}),
    };

    try {
      const [items, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            variants: {
              where: { deleted_at: null },
              orderBy: { created_at: 'asc' },
            },
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);

      return {
        items,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      };
    } catch (err: any) {
      if (
        err.message?.includes("Can't reach database server") ||
        err.name === 'PrismaClientInitializationError'
      ) {
        let filtered = mockProductsList.filter((p) => !p.deleted_at);

        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter(
            (p) =>
              p.name.toLowerCase().includes(s) ||
              p.category?.toLowerCase().includes(s) ||
              p.variants.some((v: any) => v.sku.toLowerCase().includes(s))
          );
        }

        if (low_stock) {
          filtered = filtered.filter((p) =>
            p.variants.some((v: any) => !v.deleted_at && v.stock <= 5)
          );
        }

        return {
          items: filtered.slice(skip, skip + limit),
          pagination: {
            page,
            limit,
            total: filtered.length,
            total_pages: Math.ceil(filtered.length / limit),
          },
        };
      }
      throw err;
    }
  }

  public static async findById(shopId: string, productId: string) {
    try {
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          shop_id: shopId,
          deleted_at: null,
        },
        include: {
          variants: {
            where: { deleted_at: null },
            orderBy: { created_at: 'asc' },
          },
        },
      });

      if (!product) {
        throw new NotFoundError('Không tìm thấy sản phẩm hoặc sản phẩm đã bị xóa');
      }

      return product;
    } catch (err: any) {
      if (
        err.message?.includes("Can't reach database server") ||
        err.name === 'PrismaClientInitializationError'
      ) {
        const p = mockProductsList.find((item) => item.id === productId && !item.deleted_at);
        if (!p) {
          throw new NotFoundError('Không tìm thấy sản phẩm hoặc sản phẩm đã bị xóa');
        }
        return p;
      }
      throw err;
    }
  }

  public static async create(shopId: string, dto: CreateProductDto) {
    try {
      const skus = dto.variants.map((v) => v.sku);
      const existingVariants = await prisma.productVariant.findMany({
        where: {
          shop_id: shopId,
          sku: { in: skus },
          deleted_at: null,
        },
        select: { sku: true },
      });

      if (existingVariants.length > 0) {
        const duplicatedSkus = existingVariants.map((v) => v.sku).join(', ');
        throw new ConflictError(
          `Mã SKU đã tồn tại trong cửa hàng: ${duplicatedSkus}`,
          'DUPLICATE_SKU'
        );
      }

      return await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            shop_id: shopId,
            name: dto.name,
            category: dto.category,
            description: dto.description,
          },
        });

        const variants = await Promise.all(
          dto.variants.map((v) =>
            tx.productVariant.create({
              data: {
                shop_id: shopId,
                product_id: product.id,
                sku: v.sku,
                variant_name: v.variant_name,
                size: v.size,
                color: v.color,
                price_vnd: v.price_vnd,
                stock: v.stock,
                low_stock_threshold: v.low_stock_threshold ?? 5,
              },
            })
          )
        );

        return {
          ...product,
          variants,
        };
      });
    } catch (err: any) {
      if (
        err.message?.includes("Can't reach database server") ||
        err.name === 'PrismaClientInitializationError'
      ) {
        // In-memory fallback
        const newId = `prod-${Date.now()}`;
        const newProduct = {
          id: newId,
          shop_id: shopId,
          name: dto.name,
          category: dto.category || 'Thời trang nữ',
          description: dto.description || '',
          image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80',
          image_urls: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80'],
          is_active: true,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
          variants: dto.variants.map((v, idx) => ({
            id: `var-${Date.now()}-${idx}`,
            shop_id: shopId,
            product_id: newId,
            sku: v.sku,
            variant_name: v.variant_name,
            size: v.size || 'M',
            color: v.color || 'Đen',
            price_vnd: v.price_vnd,
            stock: v.stock,
            low_stock_threshold: v.low_stock_threshold ?? 5,
            is_active: true,
            deleted_at: null,
          })),
        };
        mockProductsList.unshift(newProduct);
        return newProduct;
      }
      throw err;
    }
  }

  public static async update(shopId: string, productId: string, dto: UpdateProductDto) {
    try {
      await this.findById(shopId, productId);

      return await prisma.product.update({
        where: { id: productId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.category !== undefined ? { category: dto.category } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.is_active !== undefined ? { is_active: dto.is_active } : {}),
        },
        include: {
          variants: {
            where: { deleted_at: null },
          },
        },
      });
    } catch (err: any) {
      if (
        err.message?.includes("Can't reach database server") ||
        err.name === 'PrismaClientInitializationError'
      ) {
        const p = mockProductsList.find((item) => item.id === productId);
        if (!p) throw new NotFoundError('Không tìm thấy sản phẩm');
        if (dto.name !== undefined) p.name = dto.name;
        if (dto.category !== undefined) p.category = dto.category;
        if (dto.description !== undefined) p.description = dto.description;
        return p;
      }
      throw err;
    }
  }

  public static async softDelete(shopId: string, productId: string) {
    try {
      await this.findById(shopId, productId);
      const now = new Date();

      return await prisma.$transaction(async (tx) => {
        await tx.productVariant.updateMany({
          where: {
            product_id: productId,
            shop_id: shopId,
            deleted_at: null,
          },
          data: {
            deleted_at: now,
            is_active: false,
          },
        });

        return tx.product.update({
          where: { id: productId },
          data: {
            deleted_at: now,
            is_active: false,
          },
        });
      });
    } catch (err: any) {
      if (
        err.message?.includes("Can't reach database server") ||
        err.name === 'PrismaClientInitializationError'
      ) {
        const p = mockProductsList.find((item) => item.id === productId);
        if (!p) throw new NotFoundError('Không tìm thấy sản phẩm');
        p.deleted_at = new Date();
        p.is_active = false;
        p.variants.forEach((v: any) => {
          v.deleted_at = new Date();
          v.is_active = false;
        });
        return p;
      }
      throw err;
    }
  }

  public static async restore(shopId: string, productId: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        await tx.productVariant.updateMany({
          where: {
            product_id: productId,
            shop_id: shopId,
          },
          data: {
            deleted_at: null,
            is_active: true,
          },
        });

        return tx.product.update({
          where: { id: productId },
          data: {
            deleted_at: null,
            is_active: true,
          },
        });
      });
    } catch (err: any) {
      if (
        err.message?.includes("Can't reach database server") ||
        err.name === 'PrismaClientInitializationError'
      ) {
        const p = mockProductsList.find((item) => item.id === productId);
        if (p) {
          p.deleted_at = null;
          p.is_active = true;
          p.variants.forEach((v: any) => {
            v.deleted_at = null;
            v.is_active = true;
          });
          return p;
        }
        throw new NotFoundError('Không tìm thấy sản phẩm để khôi phục');
      }
      throw err;
    }
  }

  public static async updateVariant(shopId: string, variantId: string, dto: UpdateVariantDto) {
    try {
      const variant = await prisma.productVariant.findFirst({
        where: {
          id: variantId,
          shop_id: shopId,
          deleted_at: null,
        },
      });

      if (!variant) {
        throw new NotFoundError('Không tìm thấy biến thể sản phẩm hoặc biến thể đã bị xóa');
      }

      return await prisma.productVariant.update({
        where: { id: variantId },
        data: {
          ...(dto.price_vnd !== undefined ? { price_vnd: dto.price_vnd } : {}),
          ...(dto.stock !== undefined ? { stock: dto.stock } : {}),
          ...(dto.low_stock_threshold !== undefined
            ? { low_stock_threshold: dto.low_stock_threshold }
            : {}),
          ...(dto.is_active !== undefined ? { is_active: dto.is_active } : {}),
        },
      });
    } catch (err: any) {
      if (
        err.message?.includes("Can't reach database server") ||
        err.name === 'PrismaClientInitializationError'
      ) {
        for (const p of mockProductsList) {
          const v = p.variants.find((item: any) => item.id === variantId && !item.deleted_at);
          if (v) {
            if (dto.price_vnd !== undefined) v.price_vnd = dto.price_vnd;
            if (dto.stock !== undefined) v.stock = dto.stock;
            if (dto.low_stock_threshold !== undefined) v.low_stock_threshold = dto.low_stock_threshold;
            return v;
          }
        }
        throw new NotFoundError('Không tìm thấy biến thể sản phẩm');
      }
      throw err;
    }
  }
}

export default ProductRepository;
