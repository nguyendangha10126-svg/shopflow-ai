import { prisma } from "../../infrastructure/database/prisma";
import { AIProviderFactory } from "../../infrastructure/ai/ai-provider.factory";
import { PiiMasker } from "./pii-masker";
import { AIResponseAdapter, EnrichedDraftOrder } from "./ai-response.adapter";
import {
  TooManyRequestsError,
  UnprocessableEntityError,
} from "../../core/errors/app-error";
import { env } from "../../config/env";

export class DraftOrderService {
  private adapter = new AIResponseAdapter();

  async processDraftOrder(
    shopId: string,
    userId: string,
    rawMessage: string,
  ): Promise<EnrichedDraftOrder> {
    const startTime = Date.now();

    // 1. Kiểm tra hạn mức sử dụng AI trong tháng của Shop (Quota Checking)
    await this.checkMonthlyQuota(shopId);

    // 2. Bảo vệ dữ liệu cá nhân PII theo Nghị định 13/2023/NĐ-CP
    const { maskedText, phoneMap } = PiiMasker.mask(rawMessage);

    // 3. Gọi AI Provider (Strategy: Gemini 1.5 Flash hoặc Mock)
    const provider = AIProviderFactory.getProvider();
    const modelName =
      env.AI_PROVIDER === "gemini" ? env.GEMINI_MODEL : "mock-flash-model";

    let extracted;
    try {
      extracted = await provider.extractDraftOrder(maskedText);
    } catch (err: any) {
      // Ghi log AI lỗi
      await this.logAiTelemetry(
        shopId,
        userId,
        modelName,
        0,
        0,
        Date.now() - startTime,
        "FAILED",
        err.code || "UNKNOWN_ERROR",
      );
      throw err;
    }

    // 4. Khôi phục lại Số điện thoại thực tế từ bảng mã che giấu
    if (extracted.customer.phone) {
      extracted.customer.phone = PiiMasker.restorePhone(
        extracted.customer.phone,
        phoneMap,
      );
    }

    // Nếu AI trả về danh sách mặt hàng rỗng -> Tin nhắn không có đơn hàng
    if (extracted.items.length === 0) {
      await this.logAiTelemetry(
        shopId,
        userId,
        modelName,
        extracted.raw_tokens_used,
        0,
        Date.now() - startTime,
        "NO_ORDER_CONTENT",
      );
      throw new UnprocessableEntityError(
        "NO_ORDER_CONTENT_DETECTED",
        "Không nhận diện được sản phẩm nào trong tin nhắn. Vui lòng chuyển sang form nhập tay.",
      );
    }

    // 5. Đối soát cơ sở dữ liệu và gán nguồn chân lý (Single Source of Truth)
    const enrichedDraft = await this.adapter.adapt(
      shopId,
      extracted,
      modelName,
    );

    // 6. Ghi log đo lường AI (Telemetry Log)
    const latencyMs = Date.now() - startTime;
    await this.logAiTelemetry(
      shopId,
      userId,
      modelName,
      extracted.raw_tokens_used,
      Math.floor(extracted.raw_tokens_used * 0.4),
      latencyMs,
      "SUCCESS",
    );

    return enrichedDraft;
  }

  async answerFaq(
    shopId: string,
    userId: string,
    question: string,
  ): Promise<string> {
    const startTime = Date.now();
    const provider = AIProviderFactory.getProvider();
    const modelName =
      env.AI_PROVIDER === "gemini" ? env.GEMINI_MODEL : "mock-flash-model";

    // Tìm kiếm các đoạn tài liệu chính sách liên quan trong CSDL
    const faqChunks = await prisma.faqChunk.findMany({
      where: {
        shop_id: shopId,
        content: {
          contains: question.split(" ")[0] || "",
          mode: "insensitive",
        },
      },
      take: 3,
    });

    const contextTexts = faqChunks.map((c) => c.content);
    const answer = await provider.answerFaq(question, contextTexts);

    await this.logAiTelemetry(
      shopId,
      userId,
      modelName,
      120,
      80,
      Date.now() - startTime,
      "SUCCESS",
      undefined,
      "FAQ_ANSWER",
    );

    return answer;
  }

  private async checkMonthlyQuota(shopId: string): Promise<void> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Lấy gói cước hiện tại của shop
    const subscription = await prisma.subscription.findFirst({
      where: { shop_id: shopId, status: { in: ["ACTIVE", "TRIAL"] } },
      include: { plan: true },
    });

    const maxDrafts = subscription?.plan.max_ai_drafts_per_month || 30;

    // Đếm số lượt đã dùng trong tháng từ bảng ai_logs
    const usedCount = await prisma.aiLog.count({
      where: {
        shop_id: shopId,
        feature: "DRAFT_ORDER",
        status: "SUCCESS",
        created_at: { gte: startOfMonth },
      },
    });

    if (usedCount >= maxDrafts) {
      throw new TooManyRequestsError(
        "AI_QUOTA_EXCEEDED",
        `Cửa hàng của bạn đã dùng hết ${maxDrafts}/${maxDrafts} lượt bóc tách đơn AI tháng này. Vui lòng nâng cấp gói Pro hoặc chuyển sang nhập tay.`,
      );
    }
  }

  private async logAiTelemetry(
    shopId: string,
    userId: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    latencyMs: number,
    status: string,
    errorCode?: string,
    feature: string = "DRAFT_ORDER",
  ) {
    try {
      await prisma.aiLog.create({
        data: {
          shop_id: shopId,
          user_id: userId,
          feature,
          model,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          latency_ms: latencyMs,
          status,
          error_code: errorCode,
        },
      });
    } catch (err) {
      console.error("Không thể ghi nhận ai_log telemetry:", err);
    }
  }
}
