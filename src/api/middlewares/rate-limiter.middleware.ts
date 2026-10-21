/// <reference path="../../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import { TooManyRequestsError } from '../../core/errors/app-error';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export const createRateLimiter = (options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) => {
  const hits = new Map<string, RateLimitRecord>();

  // Dọn dẹp bản ghi cũ định kỳ mỗi 5 phút để tránh rò rỉ bộ nhớ
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientKey = options.keyGenerator
      ? options.keyGenerator(req)
      : (req.user?.shopId || req.ip || 'anonymous');

    const now = Date.now();
    let record = hits.get(clientKey);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + options.windowMs
      };
      hits.set(clientKey, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, options.maxRequests - record.count);
    const resetTimeSeconds = Math.ceil(record.resetTime / 1000);
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);

    // Thiết lập các header rate limit theo chuẩn IETF
    res.setHeader('X-RateLimit-Limit', options.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTimeSeconds);

    if (record.count > options.maxRequests) {
      res.setHeader('Retry-After', retryAfterSeconds);
      throw new TooManyRequestsError(
        'RATE_LIMIT_EXCEEDED',
        options.message || `Quá giới hạn ${options.maxRequests} yêu cầu trong 1 phút. Vui lòng thử lại sau ${retryAfterSeconds} giây.`
      );
    }

    next();
  };
};

// Rate limiter mặc định cho toàn bộ API (60 req/phút)
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
  message: 'Quá giới hạn tần suất gọi API thông thường (60 req/phút)'
});

// Rate limiter nghiêm ngặt cho AI endpoints (30 req/phút theo shopId)
export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Bạn đã gọi quá 30 lượt AI trong vòng 1 phút. Vui lòng chờ để tránh quá tải hạn mức AI',
  keyGenerator: (req: Request) => req.user?.shopId || req.ip || 'unknown'
});

