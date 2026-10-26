import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { BadRequestError } from '../../core/errors/app-error';

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
}

export interface StorageProvider {
  upload(fileBuffer: Buffer, fileName: string, mimeType: string, shopId?: string): Promise<UploadResult>;
  delete(publicId: string): Promise<boolean>;
}

export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      try {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      } catch {
        // Fallback or ignore if directory cannot be created
      }
    }
  }

  public async upload(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    shopId?: string
  ): Promise<UploadResult> {
    const ext = mimeType.split('/')[1] || 'jpg';
    const uniqueId = `img_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const safeName = `${uniqueId}.${ext}`;
    // Lưu theo thư mục của từng shop. Chỉ nhận UUID để chống ghi ra ngoài thư mục (path traversal)
    const shopFolder =
      shopId && /^[0-9a-fA-F-]{36}$/.test(shopId) ? shopId : 'shared';
    const targetDir = path.join(this.uploadDir, shopFolder);
    const targetPath = path.join(targetDir, safeName);

    try {
      await fs.promises.mkdir(targetDir, { recursive: true });
      await fs.promises.writeFile(targetPath, fileBuffer);
      return {
        url: `/uploads/${shopFolder}/${safeName}`,
        publicId: uniqueId,
        format: ext,
        bytes: fileBuffer.length,
      };
    } catch {
      // In-memory base64 data URI fallback if disk write fails
      const dataUri = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
      return {
        url: dataUri,
        publicId: uniqueId,
        format: ext,
        bytes: fileBuffer.length,
      };
    }
  }

  public async delete(publicId: string): Promise<boolean> {
    try {
      if (!/^img_[A-Za-z0-9_]+$/.test(publicId)) return false;
      const folders = await fs.promises.readdir(this.uploadDir, { withFileTypes: true });
      for (const folder of folders) {
        if (!folder.isDirectory()) continue;
        const dir = path.join(this.uploadDir, folder.name);
        const files = await fs.promises.readdir(dir);
        const match = files.find((f) => f.startsWith(publicId));
        if (match) {
          await fs.promises.unlink(path.join(dir, match));
          return true;
        }
      }
    } catch {
      // Ignore
    }
    return false;
  }
}

export function getStorageProvider(): StorageProvider {
  // Hiện chỉ có lưu trên đĩa của máy chủ. Muốn dùng Cloudinary/S3/R2 cần viết provider thật
  // (bản cũ chỉ tạo đường link giả, ảnh sẽ không hiển thị được nên đã được gỡ).
  return new LocalStorageProvider();
}

/**
 * Kiểm tra tính an toàn của tệp tải lên qua Magic Bytes
 */
export function validateImageMagicBytes(buffer: Buffer): string {
  if (buffer.length < 4) {
    throw new BadRequestError('Tệp dữ liệu không hợp lệ hoặc rỗng');
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }

  // WebP: RIFF ... WEBP (0x52 0x49 0x46 0x46 ... 0x57 0x45 0x42 0x50)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  throw new BadRequestError(
    'Định dạng ảnh không được hỗ trợ. Vui lòng chọn tệp JPEG, PNG hoặc WebP hợp lệ'
  );
}

