import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { aiRateLimiter } from '../middlewares/rate-limiter.middleware';
import { validate } from '../middlewares/validate.middleware';
import { draftOrderSchema, faqAnswerSchema } from '../validators/ai.validator';

const router = Router();
const controller = new AIController();

// Yêu cầu xác thực tài khoản và áp dụng Rate Limiter riêng cho AI (30 req/phút)
router.use(authenticateToken);
router.use(aiRateLimiter);

router.post('/draft-order', validate({ body: draftOrderSchema }), controller.extractDraftOrder);
router.post('/faq-answer', validate({ body: faqAnswerSchema }), controller.answerFaq);

export default router;

