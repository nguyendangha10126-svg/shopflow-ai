export interface MaskResult {
  maskedText: string;
  phoneMap: Record<string, string>;
}

export class PiiMasker {
  // Regex nhận diện số điện thoại di động Việt Nam chuẩn
  private static readonly PHONE_REGEX =
    /(?:\+84|84|0)(?:3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}\b/g;

  /**
   * Che giấu PII (Số điện thoại) trước khi gửi prompt ra LLM ngoại vi
   */
  static mask(rawText: string): MaskResult {
    const phoneMap: Record<string, string> = {};
    let counter = 1;

    const maskedText = rawText.replace(this.PHONE_REGEX, (match) => {
      const placeholder = `[PHONE_${counter++}]`;
      phoneMap[placeholder] = match;
      return placeholder;
    });

    return {
      maskedText,
      phoneMap,
    };
  }

  /**
   * Khôi phục lại SĐT thực tế từ JSON do LLM trích xuất về
   */
  static restorePhone(
    maskedPhone: string | undefined,
    phoneMap: Record<string, string>,
  ): string | undefined {
    if (!maskedPhone) return undefined;

    let restored = maskedPhone;
    for (const [placeholder, realPhone] of Object.entries(phoneMap)) {
      if (restored.includes(placeholder)) {
        restored = restored.replace(placeholder, realPhone);
      }
    }
    return restored;
  }
}
