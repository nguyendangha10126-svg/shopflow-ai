/**
 * Định dạng thời gian tương đối thân thiện chuẩn người dùng Việt Nam
 * Ví dụ: "Vừa xong", "15 phút trước", "2 giờ trước", "Hôm qua lúc 14:30", "15:20 20/10"
 */
export function formatRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Nếu chênh lệch âm (do lệch đồng hồ máy khách): coi như vừa xong
  if (diffSec < 60) return 'Vừa xong';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  if (diffSec < 172800) {
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    return `Hôm qua lúc ${hours}:${mins}`;
  }

  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${hours}:${mins} ${day}/${month}`;
}

/**
 * Định dạng tiền tệ VND rút gọn hoặc chi tiết
 */
export function formatCurrencyVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}
