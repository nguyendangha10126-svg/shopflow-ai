import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  IAIProvider,
  ExtractedOrderResult,
} from "../../core/interfaces/ai-provider.interface";
import {
  UnprocessableEntityError,
  InternalServerError,
} from "../../core/errors/app-error";

export class GeminiAIProvider implements IAIProvider {
  private genAI: GoogleGenerativeAI;
  private modelName: string;
  private timeoutMs: number;
  private temperature: number;

  constructor(
    apiKey: string,
    modelName: string = "gemini-1.5-flash",
    timeoutMs: number = 8000,
    temperature: number = 0.1,
  ) {
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY không được để trống khi chạy GeminiAIProvider",
      );
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
    this.timeoutMs = timeoutMs;
    this.temperature = temperature;
  }

  async extractDraftOrder(rawMessage: string): Promise<ExtractedOrderResult> {
    const systemPrompt = `Bạn là Trợ lý AI chuyên bóc tách đơn hàng thời trang online tiếng Việt (ShopFlow AI).
Nhiệm vụ: Trích xuất thông tin khách hàng và danh sách sản phẩm từ tin nhắn chat (có thể chứa teencode, viết tắt như sz, trg, đen, lấy thêm, đổi ý).

Quy tắc bắt buộc:
1. Trả về DUY NHẤT một đối tượng JSON hợp lệ (không kèm giải thích, không bọc markdown \`\`\`json).
2. Nếu tin nhắn có sự thay đổi ý kiến (ví dụ: "lấy áo trắng... à thôi đổi sang màu đen cho e"), BẮT BUỘC chỉ lấy quyết định cuối cùng ("màu đen").
3. Nếu tin nhắn không chứa bất kỳ ý định mua hàng nào (chỉ chào hỏi, spam), trả về mảng "items": [] và "confidence_score": 0.0.
4. Cấu trúc JSON đầu ra bắt buộc:
{
  "customer": {
    "name": "Tên khách hàng hoặc để trống",
    "phone": "Số điện thoại hoặc placeholder [PHONE_1]",
    "address": "Địa chỉ nhận hàng chi tiết"
  },
  "items": [
    {
      "raw_text": "Cụm từ gốc trong tin nhắn",
      "suggested_product_name": "Tên sản phẩm suy luận",
      "color": "Màu sắc (ví dụ: Trắng, Đen) hoặc để trống",
      "size": "Kích cỡ (S, M, L, XL...) hoặc để trống",
      "quantity": 1
    }
  ],
  "confidence_score": 0.95
}`;

    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: this.temperature,
      },
    });

    try {
      // Bọc lệnh gọi trong cơ chế Timeout khống chế theo quyết định kiến trúc
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("GEMINI_TIMEOUT")), this.timeoutMs),
      );

      const apiPromise = model.generateContent([
        { text: systemPrompt },
        { text: `Tin nhắn khách hàng:\n"""${rawMessage}"""` },
      ]);

      const response = await Promise.race([apiPromise, timeoutPromise]);
      const responseText = response.response.text();
      const tokensUsed =
        response.response.usageMetadata?.totalTokenCount || 200;

      const parsed = JSON.parse(responseText || "{}");

      if (!parsed.items || !Array.isArray(parsed.items)) {
        throw new UnprocessableEntityError(
          "AI_EXTRACTION_MALFORMED",
          "Dữ liệu bóc tách từ AI không đúng định dạng mong đợi",
        );
      }

      return {
        customer: parsed.customer || {},
        items: parsed.items || [],
        raw_tokens_used: tokensUsed,
        confidence_score: parsed.confidence_score ?? 0.8,
      };
    } catch (err: any) {
      if (err.message === "GEMINI_TIMEOUT") {
        throw new InternalServerError(
          "AI_SERVICE_TIMEOUT",
          "Máy chủ AI phản hồi quá 8 giây. Vui lòng chuyển sang tạo đơn thủ công.",
        );
      }
      if (err instanceof UnprocessableEntityError) {
        throw err;
      }
      throw new InternalServerError(
        "AI_GATEWAY_ERROR",
        `Lỗi kết nối Gemini API: ${err.message || err}`,
      );
    }
  }

  async answerFaq(question: string, contextChunks: string[]): Promise<string> {
    const contextText =
      contextChunks.length > 0
        ? contextChunks.join("\n---\n")
        : "Không có tài liệu";
    const prompt = `Dựa vào chính sách shop dưới đây để trả lời câu hỏi của khách hàng một cách lịch sự, súc tích (tối đa 3 câu). Không tự bịa thông tin ngoài chính sách.
Chính sách:
${contextText}

Khách hỏi: ${question}
Trả lời:`;

    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: { temperature: 0.2 },
    });

    const response = await model.generateContent(prompt);
    return (
      response.response.text() ||
      "Dạ hiện shop chưa có thông tin chính sách về vấn đề này ạ."
    );
  }
}
