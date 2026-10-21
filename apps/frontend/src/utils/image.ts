/**
 * Tiện ích nén và xử lý ảnh trên trình duyệt trước khi tải lên máy chủ
 * Giới hạn tối đa 5MB/ảnh, chuyển đổi kích thước tối đa 1200x1200px
 */

export interface ProcessedImageResult {
  dataUrl: string;
  blob: Blob;
  sizeBytes: number;
  width: number;
  height: number;
}

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_IMAGE_COUNT_PER_PRODUCT = 5;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function processImageFile(
  file: File,
  maxDimension = 1200,
  quality = 0.85
): Promise<ProcessedImageResult> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Chỉ chấp nhận các tệp định dạng JPG, PNG hoặc WebP');
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Kích thước ảnh vượt quá 5MB. Vui lòng chọn tệp nhỏ hơn');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Tệp ảnh bị hỏng hoặc không đúng định dạng'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Tính tỷ lệ co giãn nếu kích thước lớn hơn maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Trình duyệt không hỗ trợ xử lý Canvas'));
          return;
        }

        // Vẽ ảnh lên canvas với chất lượng tốt
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Lỗi khi nén ảnh thành Blob'));
              return;
            }
            resolve({
              dataUrl,
              blob,
              sizeBytes: blob.size,
              width,
              height,
            });
          },
          mimeType,
          quality
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
