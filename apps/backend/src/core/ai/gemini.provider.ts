import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';
import { logger } from '../logger';
import { AIProvider, AIParsingParams, AIParsingRawOutput } from './ai.interface';
import {
  ORDER_EXTRACTION_SYSTEM_INSTRUCTION,
  FEW_SHOT_EXAMPLES,
} from './prompts/order-extraction.prompt';

/**
 * GEMINI PROVIDER (BƯỚC C10)
 * Tài liệu tham khảo chính thức:
 * - Google AI Quickstart: https://ai.google.dev/gemini-api/docs/quickstart?lang=node
 * - Mô hình hỗ trợ: gemini-1.5-flash (Free Tier: 15 RPM, 1,000,000 TPM)
 * - Structured Output: https://ai.google.dev/gemini-api/docs/structured-output?lang=node
 */
export class GeminiProvider implements AIProvider {
  public readonly name = 'gemini-provider';
  private genAI: GoogleGenerativeAI | null = null;
  private modelName: string;

  constructor() {
    this.modelName = env.GEMINI_MODEL || 'gemini-1.5-flash';
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim()) {
      this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY.trim());
    } else {
      logger.warn(
        'Chưa cấu hình GEMINI_API_KEY trong .env. GeminiProvider sẽ yêu cầu API key khi khởi chạy thực tế.'
      );
    }
  }

  /**
   * Trích xuất thông tin đơn hàng từ tin nhắn ẩn danh qua Google Gemini
   */
  public async parseDraftOrder(params: AIParsingParams): Promise<AIParsingRawOutput> {
    if (!this.genAI) {
      if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim()) {
        this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY.trim());
      } else {
        const err: any = new Error(
          'Thiếu GEMINI_API_KEY trong tệp cấu hình .env. Vui lòng lấy khóa miễn phí từ Google AI Studio (https://aistudio.google.com).'
        );
        err.code = 'AI_KEY_MISSING';
        throw err;
      }
    }

    const startTime = Date.now();
    const timeoutMs = params.timeoutMs || env.AI_TIMEOUT_MS || 8000;

    // 1. Khởi tạo Generative Model với System Instruction và responseMimeType JSON
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: ORDER_EXTRACTION_SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: env.AI_TEMPERATURE || 0.1,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    });

    // 2. Chuẩn bị ngữ cảnh hội thoại với Few-shot Examples
    const promptParts: string[] = [];

    promptParts.push('Dưới đây là một số ví dụ mẫu chuẩn về cách phân tích tin nhắn:');
    FEW_SHOT_EXAMPLES.forEach((ex, idx) => {
      promptParts.push(`\n[VÍ DỤ MẪU ${idx + 1}]`);
      promptParts.push(`Tin nhắn khách hàng: "${ex.userMessage}"`);
      promptParts.push(`Kết quả JSON mong đợi:\n${JSON.stringify(ex.expectedOutput)}`);
    });

    promptParts.push('\n[TIN NHẮN CẦN PHÂN TÍCH HIỆN TẠI]');
    promptParts.push(`Tin nhắn khách hàng: "${params.anonymizedMessage}"`);
    promptParts.push('Hãy trả về đúng 1 đối tượng JSON duy nhất theo schema quy định:');

    const fullPrompt = promptParts.join('\n');

    // 3. Thực hiện gọi API với cơ chế Timeout ~8s (Promise.race)
    try {
      const apiCallPromise = model.generateContent(fullPrompt);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          const err: any = new Error(
            `Yêu cầu tới Gemini API vượt quá giới hạn thời gian chờ (${timeoutMs}ms)`
          );
          err.code = 'AI_TIMEOUT';
          reject(err);
        }, timeoutMs);
      });

      const result = await Promise.race([apiCallPromise, timeoutPromise]);
      const response = await result.response;
      const responseText = response.text();
      const latencyMs = Date.now() - startTime;

      // 4. Trích xuất chỉ số Token Telemetry chính thức từ response.usageMetadata
      const usage = response.usageMetadata;
      const tokens = {
        promptTokens: usage?.promptTokenCount || 0,
        completionTokens: usage?.candidatesTokenCount || 0,
        totalTokens: usage?.totalTokenCount || 0,
      };

      // Làm sạch ký tự thừa hoặc markdown tick nếu có
      const cleanedJsonText = this.sanitizeJsonString(responseText);

      return {
        rawResponseText: cleanedJsonText,
        model: this.modelName,
        latencyMs,
        tokens,
      };
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      logger.error(
        {
          model: this.modelName,
          latencyMs,
          error: error.message,
          code: error.code || error.status,
        },
        'Lỗi khi giao tiếp với Gemini API'
      );

      // Phân loại mã lỗi chính thức từ Google AI
      if (error.code === 'AI_TIMEOUT') {
        throw error;
      }

      if (error.status === 429 || error.message?.includes('RESOURCE_EXHAUSTED')) {
        const rateLimitErr: any = new Error(
          'Hạn ngạch Google Gemini API miễn phí đã đạt giới hạn (15 RPM). Vui lòng thử lại sau 1 phút.'
        );
        rateLimitErr.code = 'AI_RATE_LIMIT_EXCEEDED';
        throw rateLimitErr;
      }

      if (error.status === 400 || error.message?.includes('API_KEY_INVALID')) {
        const keyErr: any = new Error(
          'GEMINI_API_KEY không hợp lệ hoặc đã bị thu hồi. Hãy kiểm tra lại tại Google AI Studio.'
        );
        keyErr.code = 'AI_INVALID_API_KEY';
        throw keyErr;
      }

      throw error;
    }
  }

  /**
   * Làm sạch chuỗi phản hồi loại bỏ ```json và ``` nếu mô hình bao bọc markdown
   */
  private sanitizeJsonString(text: string): string {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    return cleaned.trim();
  }
}

