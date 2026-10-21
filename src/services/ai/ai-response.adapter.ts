import { prisma } from "../../infrastructure/database/prisma";
import { ExtractedOrderResult } from "../../core/interfaces/ai-provider.interface";

export interface EnrichedDraftItem {
  raw_text_extracted: string;
  match_status: "EXACT_MATCH" | "FUZZY_MATCH" | "NO_MATCH";
  confidence_score: number;
  variant_id: string | null;
  product_name: string;
  sku: string | null;
  color: string | null;
  size: string | null;
  quantity: number;
  system_unit_price: number;
  current_stock: number;
  is_stock_available: boolean;
  warning: string | null;
}

export interface EnrichedDraftOrder {
  customer: {
    full_name: string;
    phone: string;
    shipping_address: string;
    is_existing_customer: boolean;
    customer_id: string | null;
  };
  items: EnrichedDraftItem[];
  financials: {
    subtotal_vnd: number;
    estimated_shipping_fee_vnd: number;
    estimated_total_vnd: number;
    source_of_truth: "SYSTEM_DATABASE";
  };
  ai_metadata: {
    model: string;
    tokens_consumed: number;
    confidence_score: number;
    pii_masked_in_prompt: boolean;
  };
}

export class AIResponseAdapter {
  async adapt(
    shopId: string,
    extracted: ExtractedOrderResult,
    modelName: string,
  ): Promise<EnrichedDraftOrder> {
    const enrichedItems: EnrichedDraftItem[] = [];
    let subtotalVnd = 0;

    for (const item of extracted.items) {
      // 1. Thử đối soát theo SKU nếu có
      let matchedVariant = null;
      let matchStatus: "EXACT_MATCH" | "FUZZY_MATCH" | "NO_MATCH" = "NO_MATCH";

      if (item.suggested_sku) {
        matchedVariant = await prisma.productVariant.findFirst({
          where: {
            shop_id: shopId,
            sku: { equals: item.suggested_sku, mode: "insensitive" },
            deleted_at: null,
          },
          include: { product: true },
        });
        if (matchedVariant) matchStatus = "EXACT_MATCH";
      }

      // 2. Nếu chưa thấy, tìm kiếm theo Tên sản phẩm + Màu/Size
      if (!matchedVariant && item.suggested_product_name) {
        // Tìm biến thể khớp tên sản phẩm
        const candidates = await prisma.productVariant.findMany({
          where: {
            shop_id: shopId,
            deleted_at: null,
            product: {
              name: {
                contains: item.suggested_product_name,
                mode: "insensitive",
              },
            },
          },
          include: { product: true },
          take: 5,
        });

        if (candidates.length > 0) {
          // Lọc tiếp theo size hoặc màu nếu có
          const exactAttr = candidates.find(
            (c) =>
              (!item.size ||
                c.size?.toLowerCase() === item.size.toLowerCase()) &&
              (!item.color ||
                c.color?.toLowerCase() === item.color.toLowerCase()),
          );

          if (exactAttr) {
            matchedVariant = exactAttr;
            matchStatus = "EXACT_MATCH";
          } else {
            matchedVariant = candidates[0];
            matchStatus = "FUZZY_MATCH";
          }
        }
      }

      // 3. Đóng gói thuộc tính với CSDL là nguồn chân lý duy nhất (Single Source of Truth)
      if (matchedVariant) {
        const itemPrice = matchedVariant.price_vnd;
        const currentStock = matchedVariant.stock;
        const isAvailable = currentStock >= item.quantity;
        let warningText = null;

        if (currentStock === 0) {
          warningText = "Hết hàng trong kho (Tồn: 0)";
        } else if (currentStock < item.quantity) {
          warningText = `Kho không đủ số lượng (Hiện còn: ${currentStock})`;
        } else if (matchStatus === "FUZZY_MATCH") {
          warningText =
            "Vui lòng kiểm tra lại phân loại màu/size do AI tự động gợi ý";
        }

        subtotalVnd += itemPrice * item.quantity;

        enrichedItems.push({
          raw_text_extracted: item.raw_text,
          match_status: matchStatus,
          confidence_score: matchStatus === "EXACT_MATCH" ? 0.95 : 0.75,
          variant_id: matchedVariant.id,
          product_name: matchedVariant.product.name,
          sku: matchedVariant.sku,
          color: matchedVariant.color || item.color || null,
          size: matchedVariant.size || item.size || null,
          quantity: item.quantity,
          system_unit_price: itemPrice,
          current_stock: currentStock,
          is_stock_available: isAvailable,
          warning: warningText,
        });
      } else {
        // Không tìm thấy trong kho
        enrichedItems.push({
          raw_text_extracted: item.raw_text,
          match_status: "NO_MATCH",
          confidence_score: 0.3,
          variant_id: null,
          product_name: item.suggested_product_name || item.raw_text,
          sku: null,
          color: item.color || null,
          size: item.size || null,
          quantity: item.quantity,
          system_unit_price: 0,
          current_stock: 0,
          is_stock_available: false,
          warning:
            "Chưa đối soát được với sản phẩm trong kho (Nhân viên cần chọn thủ công)",
        });
      }
    }

    // 4. Đối soát khách hàng cũ trong DB
    let existingCustomer = null;
    const customerPhone = extracted.customer.phone;
    if (customerPhone) {
      existingCustomer = await prisma.customer.findFirst({
        where: { shop_id: shopId, phone: customerPhone, deleted_at: null },
      });
    }

    const shippingFee = 30000; // Phí ship ước tính mặc định

    return {
      customer: {
        full_name:
          extracted.customer.name || existingCustomer?.name || "Khách Mới",
        phone: customerPhone || existingCustomer?.phone || "",
        shipping_address:
          extracted.customer.address || existingCustomer?.address || "",
        is_existing_customer: !!existingCustomer,
        customer_id: existingCustomer?.id || null,
      },
      items: enrichedItems,
      financials: {
        subtotal_vnd: subtotalVnd,
        estimated_shipping_fee_vnd: shippingFee,
        estimated_total_vnd: subtotalVnd + shippingFee,
        source_of_truth: "SYSTEM_DATABASE",
      },
      ai_metadata: {
        model: modelName,
        tokens_consumed: extracted.raw_tokens_used,
        confidence_score: extracted.confidence_score,
        pii_masked_in_prompt: true,
      },
    };
  }
}
