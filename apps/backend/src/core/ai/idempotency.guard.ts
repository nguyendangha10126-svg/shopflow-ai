import crypto from 'crypto';

interface CachedResponse {
  statusCode: number;
  data: any;
  timestamp: number;
}

export class IdempotencyGuard {
  // Bộ nhớ đệm tạm thời cho Idempotency-Key có hạn sống TTL 5 phút
  private static readonly cache = new Map<string, CachedResponse>();
  private static readonly TTL_MS = 5 * 60 * 1000;

  /**
   * Tạo khóa định danh từ Idempotency-Key của header hoặc băm chuỗi nội dung tin nhắn
   */
  public static generateKey(shopId: string, idempotencyKey?: string, rawText?: string): string {
    if (idempotencyKey && idempotencyKey.trim()) {
      return `idemp:${shopId}:${idempotencyKey.trim()}`;
    }

    // Nếu client không gửi header Idempotency-Key, băm nội dung tin nhắn để chống click đúp liên tục
    const hash = crypto
      .createHash('sha256')
      .update(rawText || '')
      .digest('hex');
    return `hash:${shopId}:${hash}`;
  }

  /**
   * Tra cứu kết quả đã lưu trong bộ nhớ đệm
   */
  public static get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Lưu kết quả phản hồi vào bộ nhớ đệm
   */
  public static set(key: string, data: any, statusCode = 200): void {
    this.cleanExpired();
    this.cache.set(key, {
      data,
      statusCode,
      timestamp: Date.now(),
    });
  }

  /**
   * Dọn dẹp các bản ghi quá hạn
   */
  private static cleanExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.TTL_MS) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Hỗ trợ xóa bộ nhớ đệm (dùng trong test)
   */
  public static clear(): void {
    this.cache.clear();
  }
}

