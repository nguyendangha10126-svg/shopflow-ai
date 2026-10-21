import { prisma } from '../../db';
import { AIOrderItemOutput } from './ai-output.validator';

export type MatchStatus = 'MATCHED' | 'AMBIGUOUS' | 'OUT_OF_STOCK' | 'NOT_FOUND';

export interface MatchedOrderItem {
  raw_text: string;
  product_name_query: string;
  quantity: number;
  match_status: MatchStatus;
  product_id?: string;
  product_name?: string;
  variant_id?: string;
  variant_name?: string;
  sku?: string;
  price_vnd?: number; // LẤY TỪ DB, TUYỆT ĐỐI KHÔNG LẤY TỪ AI
  stock?: number; // LẤY TỪ DB
  potential_matches?: Array<{
    variant_id: string;
    variant_name: string;
    sku: string;
    price_vnd: number;
    stock: number;
  }>;
  notes?: string;
}

export class DBMatcher {
  /**
   * Đối chiếu danh sách sản phẩm do AI bóc tách với CSDL của cửa hàng
   * ĐẢM BẢO NGUYÊN TẮC: Giá tiền và Tồn kho 100% lấy từ PostgreSQL
   */
  public static async matchItems(
    shopId: string,
    aiItems: AIOrderItemOutput[]
  ): Promise<MatchedOrderItem[]> {
    if (!aiItems || aiItems.length === 0) {
      return [];
    }

    const results: MatchedOrderItem[] = [];

    // Tải toàn bộ danh mục sản phẩm và biến thể còn hoạt động của shop để đối chiếu
    // (Với micro-shop thời trang < 500 SKU, truy vấn 1 lần giảm tải roundtrip DB)
    const activeVariants = await prisma.productVariant.findMany({
      where: {
        shop_id: shopId,
        is_active: true,
        deleted_at: null,
        product: {
          is_active: true,
          deleted_at: null,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    for (const item of aiItems) {
      const queryName = this.normalizeText(item.product_name_query);
      const querySize = item.variant_attributes?.size
        ? this.normalizeText(item.variant_attributes.size)
        : null;
      const queryColor = item.variant_attributes?.color
        ? this.normalizeText(item.variant_attributes.color)
        : null;

      // 1. Lọc các biến thể có tên sản phẩm hoặc tên biến thể hoặc SKU chứa từ khóa tìm kiếm
      const candidateVariants = activeVariants.filter((v) => {
        const prodName = this.normalizeText(v.product.name);
        const varName = this.normalizeText(v.variant_name);
        const sku = this.normalizeText(v.sku);

        return (
          prodName.includes(queryName) ||
          queryName.includes(prodName) ||
          varName.includes(queryName) ||
          sku === queryName
        );
      });

      // Kịch bản A: Không tìm thấy sản phẩm nào trong CSDL của Shop
      if (candidateVariants.length === 0) {
        results.push({
          raw_text: item.raw_text,
          product_name_query: item.product_name_query,
          quantity: item.quantity,
          match_status: 'NOT_FOUND',
          notes: `Không tìm thấy sản phẩm nào khớp với "${item.product_name_query}" trong kho`,
        });
        continue;
      }

      // 2. Lọc tiếp theo kích cỡ và màu sắc nếu khách có nêu
      let refinedCandidates = candidateVariants;

      if (querySize) {
        const sizeMatches = refinedCandidates.filter((v) => {
          const varSize = v.size ? this.normalizeText(v.size) : '';
          const varName = this.normalizeText(v.variant_name);
          return varSize === querySize || varName.includes(querySize);
        });
        if (sizeMatches.length > 0) {
          refinedCandidates = sizeMatches;
        }
      }

      if (queryColor) {
        const colorMatches = refinedCandidates.filter((v) => {
          const varColor = v.color ? this.normalizeText(v.color) : '';
          const varName = this.normalizeText(v.variant_name);
          return varColor === queryColor || varName.includes(queryColor);
        });
        if (colorMatches.length > 0) {
          refinedCandidates = colorMatches;
        }
      }

      // Kịch bản B: Khớp chính xác 1 biến thể duy nhất
      if (refinedCandidates.length === 1) {
        const matched = refinedCandidates[0];
        const isOutOfStock = matched.stock < item.quantity;

        results.push({
          raw_text: item.raw_text,
          product_name_query: item.product_name_query,
          quantity: item.quantity,
          match_status: isOutOfStock ? 'OUT_OF_STOCK' : 'MATCHED',
          product_id: matched.product.id,
          product_name: matched.product.name,
          variant_id: matched.id,
          variant_name: matched.variant_name,
          sku: matched.sku,
          price_vnd: matched.price_vnd, // LẤY TỪ DB
          stock: matched.stock, // LẤY TỪ DB
          notes: isOutOfStock
            ? `Kho chỉ còn ${matched.stock} sản phẩm (khách đặt ${item.quantity})`
            : undefined,
        });
        continue;
      }

      // Kịch bản C: Khớp nhiều hơn 1 biến thể (Chưa rõ Size hoặc Màu sắc)
      results.push({
        raw_text: item.raw_text,
        product_name_query: item.product_name_query,
        quantity: item.quantity,
        match_status: 'AMBIGUOUS',
        notes: `Tìm thấy ${refinedCandidates.length} biến thể phù hợp. Cần nhân viên xác nhận lại với khách.`,
        potential_matches: refinedCandidates.map((c) => ({
          variant_id: c.id,
          variant_name: `${c.product.name} - ${c.variant_name}`,
          sku: c.sku,
          price_vnd: c.price_vnd,
          stock: c.stock,
        })),
      });
    }

    return results;
  }

  /**
   * Chuẩn hóa tiếng Việt bỏ dấu và chuyển chữ thường để so khớp mờ
   */
  public static normalizeText(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

