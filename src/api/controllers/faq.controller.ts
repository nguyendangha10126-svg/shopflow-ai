import { Request, Response, NextFunction } from 'express';
import { FaqService } from '../../services/faq.service';

const faqService = new FaqService();

export class FaqController {
  async createDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, raw_text, content_type } = req.body;
      const result = await faqService.createDocument(
        req.user!.shopId,
        title,
        raw_text,
        content_type
      );
      res.status(201).json({
        message: 'Tạo tài liệu chính sách và trích xuất chunk thành công',
        document: result
      });
    } catch (err) {
      next(err);
    }
  }

  async listDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const documents = await faqService.listDocuments(req.user!.shopId);
      res.status(200).json({ documents });
    } catch (err) {
      next(err);
    }
  }

  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await faqService.deleteDocument(req.user!.shopId, req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

