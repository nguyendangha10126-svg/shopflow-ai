import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createFaqDocumentSchema,
  updateFaqDocumentSchema,
} from '../validators/faq.validator';
import { FaqService } from '../../services/faq.service';

const router = Router();

// Toàn bộ thao tác tài liệu FAQ đều yêu cầu đăng nhập
router.use(authenticate);

// 1. Danh sách tài liệu chính sách của cửa hàng
router.get('/documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docs = await FaqService.listDocuments(req.user!.shopId);
    res.status(200).json({ data: docs });
  } catch (error) {
    next(error);
  }
});

// 2. Tạo tài liệu chính sách mới
router.post(
  '/documents',
  validate({ body: createFaqDocumentSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doc = await FaqService.createDocument(req.user!.shopId, req.body);
      res.status(201).json({
        message: 'Tạo tài liệu chính sách thành công',
        data: doc,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 3. Chi tiết một tài liệu chính sách kèm toàn bộ chunks
router.get('/documents/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = await FaqService.getDocumentById(req.user!.shopId, req.params.id);
    res.status(200).json({ data: doc });
  } catch (error) {
    next(error);
  }
});

// 4. Cập nhật tài liệu chính sách (Tự động cắt lại chunks nếu nội dung đổi)
router.put(
  '/documents/:id',
  validate({ body: updateFaqDocumentSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doc = await FaqService.updateDocument(req.user!.shopId, req.params.id, req.body);
      res.status(200).json({
        message: 'Cập nhật tài liệu chính sách thành công',
        data: doc,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 5. Xóa tài liệu chính sách
router.delete('/documents/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await FaqService.deleteDocument(req.user!.shopId, req.params.id);
    res.status(200).json({
      message: 'Xóa tài liệu chính sách thành công',
    });
  } catch (error) {
    next(error);
  }
});

// 6. Nạp nhanh 3 bộ tài liệu chính sách mẫu chuẩn tiếng Việt (1-Click Sample Seed)
router.post('/seed-samples', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.user!.shopId;
    const samples = [
      {
        title: 'Chính Sách Đổi Trả & Đổi Size',
        content_type: 'POLICIES',
        raw_text:
          'Shop hỗ trợ đổi size hoặc đổi mẫu trong vòng 7 ngày kể từ khi khách nhận được hàng. Sản phẩm đổi phải còn nguyên tem mác, chưa qua giặt ủi và không có mùi lạ. Trường hợp lỗi do nhà sản xuất (rách chỉ, phai màu, giao sai mẫu), shop chịu 100% phí ship 2 chiều. Trường hợp khách muốn đổi size theo nhu cầu cá nhân, khách vui lòng thanh toán phí ship 1 chiều 25.000đ.',
      },
      {
        title: 'Chính Sách Vận Chuyển & Thời Gian Giao Hàng',
        content_type: 'SHIPPING',
        raw_text:
          'Đơn hàng nội thành Hà Nội và TP.HCM: Giao nhanh từ 1-2 ngày làm việc, phí ship đồng giá 20.000đ. Đơn hàng các tỉnh thành khác: Thời gian giao từ 2-4 ngày, phí ship đồng giá 30.000đ. Đặc biệt: Shop miễn phí vận chuyển toàn quốc cho mọi đơn hàng từ 500.000đ trở lên. Khách hàng được quyền kiểm tra hàng trước khi thanh toán tiền cho shipper (Được đồng kiểm).',
      },
      {
        title: 'Hướng Dẫn Chọn Kích Cỡ (Bảng Size Chuẩn)',
        content_type: 'SIZE_GUIDE',
        raw_text:
          'Bảng size chuẩn dành cho đầm và áo nữ tại shop:\n- Size S: Dành cho bạn nữ từ 40kg đến 47kg, chiều cao từ 1m50 - 1m58.\n- Size M: Dành cho bạn nữ từ 48kg đến 54kg, chiều cao từ 1m55 - 1m63.\n- Size L: Dành cho bạn nữ từ 55kg đến 62kg, chiều cao từ 1m58 - 1m68.\nNếu số đo của bạn ở giữa 2 size hoặc bạn thích mặc form rộng thoải mái, shop khuyên bạn nên chọn nhích lên 1 size.',
      },
    ];

    const createdDocs = [];
    for (const sample of samples) {
      const doc = await FaqService.createDocument(shopId, sample);
      createdDocs.push(doc);
    }

    res.status(201).json({
      message: 'Đã nạp thành công 3 bộ tài liệu chính sách mẫu',
      data: createdDocs,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

