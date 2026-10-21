import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { getStorageProvider, validateImageMagicBytes } from '../../services/storage/storage.provider';
import { BadRequestError } from '../../core/errors/app-error';

const router = Router();
router.use(authenticate);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

router.post('/image', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, name } = req.body;
    if (!data || typeof data !== 'string') {
      throw new BadRequestError('Dữ liệu ảnh không được để trống (base64 string)');
    }

    // Tách base64 data URL nếu có tiền tố "data:image/...;base64,"
    let base64Clean = data;
    if (data.includes(';base64,')) {
      base64Clean = data.split(';base64,')[1];
    }

    const buffer = Buffer.from(base64Clean, 'base64');

    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new BadRequestError('Kích thước ảnh vượt quá giới hạn 5MB cho phép');
    }

    // Kiểm tra magic bytes
    const detectedMime = validateImageMagicBytes(buffer);

    const storage = getStorageProvider();
    const result = await storage.upload(buffer, name || 'image', detectedMime);

    res.status(200).json({
      message: 'Tải ảnh lên thành công',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

