export interface AnonymizationResult {
  anonymizedText: string;
  phoneMap: Record<string, string>;
  extractedPhones: string[];
}

export class PIIAnonymizer {
  // Regex nhận diện mọi biến thể số điện thoại Việt Nam (09xx, 08xx, 07xx, 05xx, 03xx, +84xx có hoặc không có dấu cách/dấu chấm)
  private static readonly PHONE_REGEX = /(?:\+84\s?|84\s?|0)[1-9](?:[\s.-]?\d){8,9}\b/g;

  /**
   * Ẩn danh hóa số điện thoại trong tin nhắn trước khi gửi tới AI
   * Thay thế số điện thoại thực bằng token [PHONE_1], [PHONE_2]...
   */
  public static anonymize(text: string): AnonymizationResult {
    const phoneMap: Record<string, string> = {};
    const extractedPhones: string[] = [];
    let counter = 1;

    // Chuẩn hóa văn bản đầu vào
    const anonymizedText = text.replace(this.PHONE_REGEX, (match) => {
      // Làm sạch các dấu cách/chấm trong số điện thoại để chuẩn hóa dạng số
      let cleaned = match.replace(/[\s.-]/g, '');
      if (cleaned.startsWith('+84')) {
        cleaned = '0' + cleaned.slice(3);
      } else if (cleaned.startsWith('84') && cleaned.length === 11) {
        cleaned = '0' + cleaned.slice(2);
      }

      const token = `[PHONE_${counter++}]`;
      phoneMap[token] = cleaned;
      extractedPhones.push(cleaned);
      return token;
    });

    return {
      anonymizedText,
      phoneMap,
      extractedPhones,
    };
  }

  /**
   * Khôi phục lại số điện thoại thực từ token do AI trả về
   */
  public static restorePhone(
    aiPhoneOutput: string | null | undefined,
    phoneMap: Record<string, string>,
    fallbackPhones: string[]
  ): string | null {
    if (!aiPhoneOutput && fallbackPhones.length > 0) {
      return fallbackPhones[0];
    }

    if (!aiPhoneOutput) return null;

    const trimmed = aiPhoneOutput.trim();

    // Nếu AI trả về đúng token [PHONE_1]
    if (phoneMap[trimmed]) {
      return phoneMap[trimmed];
    }

    // Nếu token nằm trong một chuỗi, ví dụ: "SĐT: [PHONE_1]"
    for (const [token, realPhone] of Object.entries(phoneMap)) {
      if (trimmed.includes(token)) {
        return realPhone;
      }
    }

    // Nếu AI trả về số thực đã trích xuất được
    const cleaned = trimmed.replace(/[\s.-]/g, '');
    if (/^[0-9+]{9,15}$/.test(cleaned)) {
      return cleaned;
    }

    return fallbackPhones.length > 0 ? fallbackPhones[0] : null;
  }
}

