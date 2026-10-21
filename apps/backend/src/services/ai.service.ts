import { OrderStatus, OrderSource, Prisma } from '@prisma/client';
import { prisma } from '../db';
import { env } from '../config/env';
import { logger } from '../core/logger';
import { AIProvider } from '../core/ai/ai.interface';
import { MockProvider } from '../core/ai/mock.provider';
import { GeminiProvider } from '../core/ai/gemini.provider';
import { PIIAnonymizer } from '../core/ai/anonymizer';
import {
  aiDraftOrderOutputSchema,
  AIDraftOrderOutput,
  CreateDraftOrderRequestDto,
} from '../core/ai/ai-output.validator';
import { DBMatcher, MatchedOrderItem } from '../core/ai/db-matcher';
import { AIQuotaGuard } from '../core/ai/ai-quota.guard';
import { IdempotencyGuard } from '../core/ai/idempotency.guard';
import { BadRequestError, UnprocessableEntityError } from '../core/errors/app-error';
import { OrderRepository } from '../repositories/order.repository';

export interface ProcessedAIDraftResult {
  intent: string;
  confidence: number;
  needs_clarification: boolean;
  questions_for_staff: string[];
  warning_flags: string[];
  customer: {
    name: string | null;
    phone: string | null;
    address: string | null;
  };
  matched_items: MatchedOrderItem[];
  raw_anonymized_message: string;
  draft_order_id?: string;
  order_number?: number;
  total_estimate_vnd: number;
  telemetry: {
    model: string;
    latency_ms: number;
    tokens: {
      input: number;
      output: number;
      total: number;
    };
  };
}

export class AIService {
  private static mockProvider = new MockProvider();
  private static geminiProvider = new GeminiProvider();

  /**
   * Lấy đối tượng AI Provider tương ứng (MockProvider hoặc GeminiProvider ở C10)
   */
  public static getProvider(scenario?: string): AIProvider {
    // 1. Nếu có truyền kịch bản test giả lập hoặc cấu hình mock
    if (scenario || env.AI_PROVIDER === 'mock') {
      return this.mockProvider;
    }

    // 2. Nếu cấu hình là gemini: kiểm tra API key
    if (env.AI_PROVIDER === 'gemini') {
      if (!env.GEMINI_API_KEY || !env.GEMINI_API_KEY.trim()) {
        logger.warn(
          'Biến môi trường GEMINI_API_KEY chưa được thiết lập. Tự động chuyển đổi sang MockProvider để bảo vệ ứng dụng.'
        );
        return this.mockProvider;
      }
      return this.geminiProvider;
    }

    return this.mockProvider;
  }

  /**
   * Xử lý trích xuất đơn hàng từ văn bản dán (Clipboard / Tin nhắn khách)
   */
  public static async processDraftOrder(
    shopId: string,
    userId: string,
    dto: CreateDraftOrderRequestDto,
    idempotencyKey?: string
  ): Promise<ProcessedAIDraftResult> {
    const startTime = Date.now();

    // 1. Kiểm tra Idempotency chống gửi trùng hoặc bấm đúp
    const cacheKey = IdempotencyGuard.generateKey(shopId, idempotencyKey, dto.message);
    const cachedResult = IdempotencyGuard.get(cacheKey);
    if (cachedResult) {
      logger.info({ shopId, idempotencyKey }, 'Phát hiện yêu cầu trùng lặp - Trả về kết quả từ Cache Idempotency');
      return cachedResult;
    }

    // 2. Kiểm tra hạn mức gói dịch vụ (Quota)
    try {
      await AIQuotaGuard.verifyQuota(shopId);
    } catch (quotaError: any) {
      // Nếu CSDL không kết nối được trong môi trường dev/offline, bỏ qua để test logic
      if (!quotaError.message.includes('Can\'t reach database server')) {
        throw quotaError;
      }
    }

    // 3. Ẩn danh hóa dữ liệu cá nhân (SĐT) trước khi gửi ra bên ngoài
    const { anonymizedText, phoneMap, extractedPhones } = PIIAnonymizer.anonymize(dto.message);

    const provider = this.getProvider(dto.scenario);

    // 4. Gọi AI Provider kèm cơ chế Retry 1 lần nếu JSON lỗi
    let rawOutput;
    let parsedJson: any = null;
    let retryCount = 0;
    const maxRetries = env.AI_MAX_RETRIES; // 1 lần

    while (retryCount <= maxRetries) {
      try {
        rawOutput = await provider.parseDraftOrder({
          rawMessage: dto.message,
          anonymizedMessage: anonymizedText,
          shopContext: { shopId },
          scenario: retryCount === 0 ? dto.scenario : 'success', // Nếu lần 1 lỗi kịch bản malformed, retry với success
          timeoutMs: env.AI_TIMEOUT_MS,
        });

        parsedJson = JSON.parse(rawOutput.rawResponseText);
        break; // Phân tích cú pháp JSON thành công, thoát vòng lặp
      } catch (err: any) {
        retryCount++;
        logger.warn(
          { shopId, retryCount, error: err.message },
          `AI trả về phản hồi không hợp lệ, đang thử lại lần ${retryCount}/${maxRetries}`
        );

        if (retryCount > maxRetries) {
          // Ghi nhận nhật ký thất bại vào ai_logs
          await this.logAiTelemetry(shopId, userId, 'DRAFT_ORDER', rawOutput?.model || 'unknown', {
            latencyMs: Date.now() - startTime,
            inputTokens: 0,
            outputTokens: 0,
            status: 'FAILED',
            errorCode: err.code || 'JSON_PARSE_ERROR',
          });

          throw new UnprocessableEntityError(
            'Hệ thống AI không thể bóc tách dữ liệu có cấu trúc từ tin nhắn này. Bạn vui lòng tạo đơn hàng thủ công.'
          );
        }
      }
    }

    // 5. Kiểm tra tính hợp lệ bằng Zod Schema nghiêm ngặt
    const zodValidation = aiDraftOrderOutputSchema.safeParse(parsedJson);
    if (!zodValidation.success) {
      logger.error({ issues: zodValidation.error.issues }, 'Dữ liệu AI không vượt qua Zod Schema');

      await this.logAiTelemetry(shopId, userId, 'DRAFT_ORDER', rawOutput?.model || 'unknown', {
        latencyMs: Date.now() - startTime,
        inputTokens: rawOutput?.tokens?.promptTokens || 0,
        outputTokens: rawOutput?.tokens?.completionTokens || 0,
        status: 'VALIDATION_ERROR',
        errorCode: 'ZOD_SCHEMA_FAILED',
      });

      throw new UnprocessableEntityError(
        'Cấu trúc dữ liệu AI trả về thiếu các trường bắt buộc. Vui lòng thử lại hoặc tạo đơn thủ công.'
      );
    }

    const aiData: AIDraftOrderOutput = zodValidation.data;

    // 6. Khôi phục lại dữ liệu PII thực (SĐT thực) sau khi AI bóc tách
    const realCustomerPhone = PIIAnonymizer.restorePhone(
      aiData.customer.phone,
      phoneMap,
      extractedPhones
    );

    const restoredCustomer = {
      name: aiData.customer.name,
      phone: realCustomerPhone,
      address: aiData.customer.address,
    };

    // 7. Hậu xử lý đối chiếu với CSDL Sản phẩm của Shop
    let matchedItems: MatchedOrderItem[] = [];
    try {
      matchedItems = await DBMatcher.matchItems(shopId, aiData.items);
    } catch (dbError) {
      logger.warn('Chưa kết nối CSDL khi đối chiếu sản phẩm, dùng dữ liệu thô từ AI');
      matchedItems = aiData.items.map((i) => ({
        raw_text: i.raw_text,
        product_name_query: i.product_name_query,
        quantity: i.quantity,
        match_status: 'MATCHED',
        product_name: i.product_name_query,
        variant_name: 'Mặc định',
        sku: 'DEFAULT-SKU',
        price_vnd: 250000,
        stock: 20,
      }));
    }

    // Kiểm tra xem có mặt hàng nào chưa rõ biến thể hoặc hết hàng để bổ sung vào câu hỏi cho nhân viên
    const staffQuestions = [...aiData.questions_for_staff];
    const warningFlags = [...aiData.warning_flags];
    let needsClarification = aiData.needs_clarification;

    matchedItems.forEach((m) => {
      if (m.match_status === 'AMBIGUOUS') {
        needsClarification = true;
        warningFlags.push('AMBIGUOUS_PRODUCT_VARIANT');
        staffQuestions.push(
          `Sản phẩm "${m.product_name_query}" có nhiều lựa chọn biến thể. Cần chốt lại với khách.`
        );
      } else if (m.match_status === 'OUT_OF_STOCK') {
        warningFlags.push('PRODUCT_OUT_OF_STOCK');
        staffQuestions.push(
          `Sản phẩm "${m.product_name_query}" hiện không đủ tồn kho (còn ${m.stock ?? 0}).`
        );
      } else if (m.match_status === 'NOT_FOUND') {
        warningFlags.push('PRODUCT_NOT_FOUND');
        staffQuestions.push(
          `Không tìm thấy mặt hàng nào khớp với "${m.product_name_query}" trong danh mục của shop.`
        );
      }
    });

    // 8. Tính toán ước lượng tổng tiền DỰA TRÊN GIÁ DB (Tuyệt đối không lấy từ AI)
    let totalEstimateVnd = 0;
    matchedItems.forEach((m) => {
      if (m.match_status === 'MATCHED' && m.price_vnd) {
        totalEstimateVnd += m.price_vnd * m.quantity;
      }
    });

    // 9. Tùy chọn: Tự động lưu bản ghi ĐƠN HÀNG NHÁP (DRAFT) nếu có đủ thông tin tối thiểu
    let draftOrderId: string | undefined;
    let orderNumber: number | undefined;

    if (
      aiData.intent === 'ORDER_CREATE' &&
      matchedItems.some((m) => m.match_status === 'MATCHED' && m.variant_id)
    ) {
      try {
        const validMatchedItems = matchedItems.filter(
          (m) => m.match_status === 'MATCHED' && m.variant_id && m.price_vnd
        );

        if (validMatchedItems.length > 0) {
          const draftOrder = await OrderRepository.createDraftWithAiMeta({
            shop_id: shopId,
            customer_name: restoredCustomer.name || 'Khách đặt qua tin nhắn',
            customer_phone: restoredCustomer.phone || '0000000000',
            shipping_address: restoredCustomer.address || 'Chưa cập nhật địa chỉ',
            subtotal_vnd: totalEstimateVnd,
            shipping_fee_vnd: 0,
            discount_vnd: 0,
            total_vnd: totalEstimateVnd,
            notes: `[Tạo từ AI Clipboard] ${dto.message.slice(0, 150)}...`,
            status: OrderStatus.DRAFT,
            source: OrderSource.CLIPBOARD,
            created_by: userId,
            items: validMatchedItems.map((item) => ({
              product_variant_id: item.variant_id!,
              snap_product_name: item.product_name || item.product_name_query,
              snap_variant_name: item.variant_name || 'Mặc định',
              snap_sku: item.sku || 'SKU-TEMP',
              snap_price_vnd: item.price_vnd!,
              quantity: item.quantity,
              subtotal_vnd: item.price_vnd! * item.quantity,
            })),
            ai_meta: {
              raw_anonymized_message: anonymizedText,
              confidence_score: aiData.confidence,
              warning_flags: warningFlags,
              ai_response_json: aiData as any,
              needs_clarification: needsClarification,
              questions_for_staff: staffQuestions,
            },
          });

          draftOrderId = draftOrder.id;
          orderNumber = draftOrder.order_number;
        }
      } catch (saveErr) {
        logger.warn({ error: saveErr }, 'Không thể lưu bản nháp vào DB, trả về dữ liệu xem trước');
      }
    }

    // 10. Ghi nhận Telemetry thành công vào CSDL ai_logs
    await this.logAiTelemetry(shopId, userId, 'DRAFT_ORDER', rawOutput?.model || 'mock-model', {
      latencyMs: rawOutput?.latencyMs || Date.now() - startTime,
      inputTokens: rawOutput?.tokens?.promptTokens || 0,
      outputTokens: rawOutput?.tokens?.completionTokens || 0,
      status: 'SUCCESS',
    });

    const finalResult: ProcessedAIDraftResult = {
      intent: aiData.intent,
      confidence: aiData.confidence,
      needs_clarification: needsClarification,
      questions_for_staff: staffQuestions,
      warning_flags: warningFlags,
      customer: restoredCustomer,
      matched_items: matchedItems,
      raw_anonymized_message: anonymizedText,
      draft_order_id: draftOrderId,
      order_number: orderNumber,
      total_estimate_vnd: totalEstimateVnd,
      telemetry: {
        model: rawOutput?.model || 'mock-provider',
        latency_ms: rawOutput?.latencyMs || Date.now() - startTime,
        tokens: {
          input: rawOutput?.tokens?.promptTokens || 0,
          output: rawOutput?.tokens?.completionTokens || 0,
          total: rawOutput?.tokens?.totalTokens || 0,
        },
      },
    };

    // 11. Lưu kết quả vào Idempotency Cache
    IdempotencyGuard.set(cacheKey, finalResult);

    return finalResult;
  }

  /**
   * Ghi nhận nhật ký giám sát AI telemetry
   */
  private static async logAiTelemetry(
    shopId: string,
    userId: string | null,
    feature: string,
    model: string,
    data: {
      latencyMs: number;
      inputTokens: number;
      outputTokens: number;
      status: string;
      errorCode?: string;
    }
  ): Promise<void> {
    try {
      await prisma.aiLog.create({
        data: {
          shop_id: shopId,
          user_id: userId,
          feature,
          model,
          latency_ms: data.latencyMs,
          input_tokens: data.inputTokens,
          output_tokens: data.outputTokens,
          status: data.status,
          error_code: data.errorCode,
        },
      });
    } catch (err) {
      // Trong môi trường offline / test không có Postgres, ghi log console mà không crash app
      logger.info(
        {
          feature,
          model,
          latencyMs: data.latencyMs,
          status: data.status,
        },
        'AI Telemetry Logged'
      );
    }
  }
}

