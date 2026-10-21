import { AIProvider, AIParsingParams, AIParsingRawOutput } from './ai.interface';

export class MockProvider implements AIProvider {
  public readonly name = 'mock-provider';

  public async parseDraftOrder(params: AIParsingParams): Promise<AIParsingRawOutput> {
    const startTime = Date.now();
    const scenario = params.scenario || this.detectScenarioFromMessage(params.anonymizedMessage);

    // Kịch bản 1: Giả lập Timeout vượt ngưỡng (~8s)
    if (scenario === 'timeout') {
      await new Promise((resolve) => setTimeout(resolve, Math.min(params.timeoutMs || 8000, 500)));
      const err: any = new Error('Yêu cầu AI vượt quá thời gian phản hồi (Timeout)');
      err.code = 'AI_TIMEOUT';
      throw err;
    }

    // Kịch bản 2: Giả lập lỗi máy chủ AI / Mất kết nối
    if (scenario === 'error') {
      const err: any = new Error('Dịch vụ AI hiện không khả dụng (Upstream Service Unavailable)');
      err.code = 'AI_SERVICE_UNAVAILABLE';
      throw err;
    }

    // Kịch bản 3: Giả lập AI trả về JSON dị tật / hỏng cú pháp
    if (scenario === 'malformed_json') {
      return {
        rawResponseText: '{ "intent": "ORDER_CREATE", "confidence": 0.9, "items": [{"product_name": "áo', // Cắt ngang JSON
        model: 'mock-gemini-1.5-flash',
        latencyMs: Date.now() - startTime,
        tokens: { promptTokens: 150, completionTokens: 25, totalTokens: 175 },
      };
    }

    // Kịch bản 4: Giả lập phát hiện tấn công Prompt Injection / Jailbreak
    if (scenario === 'injection') {
      const response = {
        intent: 'OTHER',
        confidence: 0.1,
        customer: {
          name: null,
          phone: null,
          address: null,
        },
        items: [],
        needs_clarification: true,
        questions_for_staff: [
          'CẢNH BÁO: Tin nhắn chứa mẫu câu lệnh bất thường (Prompt Injection). Tuyệt đối không thực thi tự động.',
        ],
        warning_flags: ['PROMPT_INJECTION_DETECTED', 'SUSPICIOUS_PROMPT'],
      };

      return {
        rawResponseText: JSON.stringify(response),
        model: 'mock-gemini-1.5-flash',
        latencyMs: 80 + Math.floor(Math.random() * 50),
        tokens: { promptTokens: 220, completionTokens: 80, totalTokens: 300 },
      };
    }

    // Kịch bản 5: Khách hỏi giá hoặc chính sách (Không đặt hàng)
    if (scenario === 'inquiry') {
      const response = {
        intent: 'PRICE_ASK',
        confidence: 0.9,
        customer: {
          name: null,
          phone: null,
          address: null,
        },
        items: [],
        needs_clarification: true,
        questions_for_staff: [
          'Tin nhắn là câu hỏi tư vấn chính sách và giá, chưa phải yêu cầu đặt hàng.',
        ],
        warning_flags: ['INQUIRY_ONLY'],
      };

      return {
        rawResponseText: JSON.stringify(response),
        model: 'mock-gemini-1.5-flash',
        latencyMs: 90 + Math.floor(Math.random() * 40),
        tokens: { promptTokens: 170, completionTokens: 90, totalTokens: 260 },
      };
    }

    // Kịch bản 6: Khách hỏi thông tin thiếu kích cỡ / màu sắc (Cần hỏi lại)
    if (scenario === 'ambiguous') {
      const response = {
        intent: 'ORDER_CREATE',
        confidence: 0.75,
        customer: {
          name: this.extractName(params.anonymizedMessage),
          phone: params.anonymizedMessage.includes('[PHONE_') ? '[PHONE_1]' : null,
          address: this.extractAddress(params.anonymizedMessage),
        },
        items: [
          {
            raw_text: 'sản phẩm đặt mua',
            product_name_query: 'sản phẩm thời trang',
            variant_attributes: {},
            quantity: 1,
          },
        ],
        needs_clarification: true,
        questions_for_staff: [
          'Khách chưa chọn kích cỡ (Size S/M/L) cho sản phẩm.',
          'Khách chưa nêu rõ địa chỉ số nhà cụ thể.',
        ],
        warning_flags: ['MISSING_VARIANT_SIZE'],
      };

      return {
        rawResponseText: JSON.stringify(response),
        model: 'mock-gemini-1.5-flash',
        latencyMs: 110 + Math.floor(Math.random() * 60),
        tokens: { promptTokens: 195, completionTokens: 125, totalTokens: 320 },
      };
    }

    // Kịch bản 7: Thành công thông minh (Trích xuất theo văn bản thực)
    const isMultiple =
      params.anonymizedMessage.includes(' và ') ||
      params.anonymizedMessage.includes(' với ') ||
      params.anonymizedMessage.includes(' kèm ');

    const items = isMultiple
      ? [
          {
            raw_text: 'món thứ 1',
            product_name_query: 'chân váy chữ a',
            variant_attributes: { size: 'L', color: 'Đen' },
            quantity: 2,
          },
          {
            raw_text: 'món thứ 2',
            product_name_query: 'áo phông unisex',
            variant_attributes: { size: 'Freesize', color: 'Trắng' },
            quantity: 1,
          },
        ]
      : [
          {
            raw_text: 'món thời trang',
            product_name_query: 'đầm hoa nhí',
            variant_attributes: { size: 'M', color: 'Vàng' },
            quantity: 1,
          },
        ];

    const defaultSuccessResponse = {
      intent: 'ORDER_CREATE',
      confidence: 0.95,
      customer: {
        name: this.extractName(params.anonymizedMessage),
        phone: params.anonymizedMessage.includes('[PHONE_') ? '[PHONE_1]' : null,
        address: this.extractAddress(params.anonymizedMessage),
      },
      items,
      needs_clarification: false,
      questions_for_staff: [],
      warning_flags: [],
    };

    return {
      rawResponseText: JSON.stringify(defaultSuccessResponse),
      model: 'mock-gemini-1.5-flash',
      latencyMs: 120 + Math.floor(Math.random() * 80),
      tokens: { promptTokens: 180, completionTokens: 130, totalTokens: 310 },
    };
  }

  /**
   * Tự động phán đoán kịch bản dựa vào nội dung tin nhắn nếu không chỉ định scenario
   */
  private detectScenarioFromMessage(text: string): string {
    const lower = text.toLowerCase();
    if (
      lower.includes('ignore') ||
      lower.includes('bỏ qua') ||
      lower.includes('miễn phí') ||
      lower.includes('set price to 0') ||
      lower.includes('admin') ||
      lower.includes('quên đi') ||
      lower.includes('override') ||
      lower.includes('khẩn cấp') ||
      lower.includes('chuyển khoản') ||
      lower.includes('-500')
    ) {
      return 'injection';
    }

    if (
      lower.includes('giá bao nhiêu') ||
      lower.includes('bao nhiêu 1') ||
      lower.includes('chính sách') ||
      lower.includes('đổi trả') ||
      lower.includes('còn hàng không') ||
      lower.includes('shop ở đâu')
    ) {
      return 'inquiry';
    }

    const hasSize =
      lower.includes('size') ||
      lower.includes('sz') ||
      lower.includes('freesize') ||
      lower.includes(' xl') ||
      lower.includes(' xxl') ||
      lower.includes(' m ') ||
      lower.includes(' s ') ||
      lower.includes(' l ');

    const isFashion =
      lower.includes('áo') ||
      lower.includes('quần') ||
      lower.includes('đầm') ||
      lower.includes('váy') ||
      lower.includes('set') ||
      lower.includes('blazer') ||
      lower.includes('hoodie') ||
      lower.includes('pijama');

    if (isFashion && !hasSize) {
      return 'ambiguous';
    }

    if (
      lower.includes('hà nội,') ||
      lower.includes('hải phòng,') ||
      lower.includes('không rõ')
    ) {
      return 'ambiguous';
    }

    return 'success';
  }

  private extractName(text: string): string | null {
    const match = text.match(/(?:tên|tên là|gặp|người nhận:?)\s+([A-ZÀ-Ỹa-zà-ỹ\s]+?)(?:[.,;]|\s+sđt|\s+0|\n|$)/i);
    return match ? match[1].trim() : null;
  }

  private extractAddress(text: string): string | null {
    const match = text.match(/(?:về|tới|đến|địa chỉ:?)\s+([^,.;\n]+(?:,[^,.;\n]+)*)/i);
    return match ? match[1].trim() : null;
  }
}
