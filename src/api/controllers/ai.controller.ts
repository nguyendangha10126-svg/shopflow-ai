import { Request, Response, NextFunction } from 'express';
import { DraftOrderService } from '../../services/ai/draft-order.service';

const draftOrderService = new DraftOrderService();

export class AIController {
  async extractDraftOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await draftOrderService.processDraftOrder(
        req.user!.shopId,
        req.user!.userId,
        req.body.raw_message
      );
      res.status(200).json({
        draft_order: result
      });
    } catch (err) {
      next(err);
    }
  }

  async answerFaq(req: Request, res: Response, next: NextFunction) {
    try {
      const answer = await draftOrderService.answerFaq(
        req.user!.shopId,
        req.user!.userId,
        req.body.question
      );
      res.status(200).json({
        answer,
        source: 'SHOP_FAQ_KNOWLEDGE'
      });
    } catch (err) {
      next(err);
    }
  }
}

