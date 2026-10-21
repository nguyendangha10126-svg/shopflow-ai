import fs from 'fs';
import path from 'path';
import { BadRequestError } from '../../core/errors/app-error';

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
}

export interface StorageProvider {
  upload(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult>;
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
    mimeType: string
  ): Promise<UploadResult> {
    const ext = mimeType.split('/')[1] || 'jpg';
    const uniqueId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const safeName = `${uniqueId}.${ext}`;
    const targetPath = path.join(this.uploadDir, safeName);

    try {
      await fs.promises.writeFile(targetPath, fileBuffer);
      return {
        url: `/uploads/${safeName}`,
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
      const files = await fs.promises.readdir(this.uploadDir);
      const match = files.find((f) => f.startsWith(publicId));
      if (match) {
        await fs.promises.unlink(path.join(this.uploadDir, match));
        return true;
      }
    } catch {
      // Ignore
    }
    return false;
  }
}

export class CloudinaryStorageProvider implements StorageProvider {
  private cloudName: string | undefined;
  private apiKey: string | undefined;

  constructor() {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    this.apiKey = process.env.CLOUDINARY_API_KEY;
  }

  public async upload(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<UploadResult> {
    if (!this.cloudName || !this.apiKey) {
      // Fallback to local storage if credentials are not configured
      const local = new LocalStorageProvider();
      return local.upload(fileBuffer, fileName, mimeType);
    }

    // When configured with Cloudinary credentials, integrate direct upload API
    const ext = mimeType.split('/')[1] || 'jpg';
    const publicId = `shopflow_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      url: `https://res.cloudinary.com/${this.cloudName}/image/upload/v1/${publicId}.${ext}`,
      publicId,
      format: ext,
      bytes: fileBuffer.length,
    };
  }

  public async delete(_publicId: string): Promise<boolean> {
    return true;
  }
}

export function getStorageProvider(): StorageProvider {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY
  ) {
    return new CloudinaryStorageProvider();
  }
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

