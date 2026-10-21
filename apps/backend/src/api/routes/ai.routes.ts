import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createDraftOrderRequestSchema } from '../../core/ai/ai-output.validator';
import { faqQueryRequestSchema } from '../validators/faq.validator';
import { AIService } from '../../services/ai.service';
import { FaqService } from '../../services/faq.service';

const router = Router();

// Yêu cầu xác thực tài khoản để lấy shopId và userId từ Token
router.use(authenticate);

// Rate limiter riêng biệt cho tác vụ AI: Tối đa 15 lần/phút theo từng Shop và User
const aiDraftRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => `${req.user?.shopId || req.ip}_${req.user?.userId || ''}`,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Bạn gửi tin nhắn quá nhanh. Vui lòng đợi 1 phút trước khi gửi yêu cầu phân tích tiếp theo.',
    },
  },
});

/**
 * POST /api/v1/ai/draft-order
 * Bóc tách tin nhắn khách hàng thành đơn hàng nháp có đối chiếu DB và tính tiền chuẩn xác
 * Hỗ trợ Header: Idempotency-Key
 */
router.post(
  '/draft-order',
  aiDraftRateLimiter,
  validate({ body: createDraftOrderRequestSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

      const result = await AIService.processDraftOrder(
        req.user!.shopId,
        req.user!.userId,
        req.body,
        idempotencyKey
      );

      // Nếu tạo thành công bản ghi đơn nháp trong DB, trả về 201 Created; nếu chỉ xem trước thì 200 OK
      const statusCode = result.draft_order_id ? 201 : 200;

      res.status(statusCode).json({
        message: result.draft_order_id
          ? `Đã tạo đơn hàng nháp #${result.order_number || ''} từ tin nhắn`
          : 'Đã bóc tách tin nhắn thành công (Bản xem trước)',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/ai/faq-query
 * Trả lời câu hỏi tư vấn chính sách shop bằng kỹ thuật RAG có trích dẫn nguồn
 */
router.post(
  '/faq-query',
  validate({ body: faqQueryRequestSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await FaqService.answerFaq(
        req.user!.shopId,
        req.user!.userId,
        req.body.question
      );
      res.status(200).json({
        message: 'Tư vấn câu hỏi thành công',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

