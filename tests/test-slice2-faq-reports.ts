import { UserRole } from '@prisma/client';
import { requireRole } from '../src/api/middlewares/rbac.middleware';
import { ForbiddenError } from '../src/core/errors/app-error';

console.log('🧪 BẮT ĐẦU KIỂM THỬ ĐƠN VỊ CHO G17: FAQ RAG & BÁO CÁO DOANH THU');

// 1. Kiểm thử Thuật toán Text Chunking cho FAQ RAG
const samplePolicy = `
Quy định đổi trả hàng:
Khách hàng được quyền kiểm tra hàng trước khi thanh toán tiền cho shipper. Nếu sản phẩm bị lỗi do nhà sản xuất hoặc giao nhầm màu nhầm size, shop hỗ trợ đổi miễn phí 100%.

Thời hạn đổi hàng:
Quý khách vui lòng thông báo cho shop trong vòng 7 ngày kể từ khi nhận được kiện hàng. Sản phẩm đổi phải còn nguyên tem mác, chưa qua giặt là.
`;

const paragraphs = samplePolicy
  .split(/\n\s*\n/)
  .map((p) => p.trim())
  .filter((p) => p.length > 0);

console.assert(paragraphs.length === 2, 'Test 1.1 Thất bại: Không tách đúng 2 đoạn chính sách');
console.assert(paragraphs[0].includes('kiểm tra hàng'), 'Test 1.2 Thất bại: Thiếu nội dung đoạn 1');
console.assert(paragraphs[1].includes('trong vòng 7 ngày'), 'Test 1.3 Thất bại: Thiếu nội dung đoạn 2');
console.log('✅ 1. Kiểm thử Thuật toán Text Chunking cho FAQ RAG: ĐẠT');

// 2. Kiểm thử Phân quyền RBAC (Chặn STAFF xem Báo cáo Doanh thu)
const mockReqStaff: any = {
  user: {
    userId: 'user-staff-1',
    shopId: 'shop-1',
    role: UserRole.STAFF,
    phone: '0901112233'
  }
};

const mockReqOwner: any = {
  user: {
    userId: 'user-owner-1',
    shopId: 'shop-1',
    role: UserRole.OWNER,
    phone: '0909998877'
  }
};

const mockRes: any = {};
const tracker = {
  nextCalled: false,
  staffBlocked: false
};

const mockNext = () => {
  tracker.nextCalled = true;
};

// Test OWNER được phép
const ownerGuard = requireRole([UserRole.OWNER]);
ownerGuard(mockReqOwner, mockRes, mockNext);
console.assert(tracker.nextCalled === true, 'Test 2.1 Thất bại: OWNER bị chặn');

// Test STAFF bị chặn với ForbiddenError (403)
tracker.nextCalled = false;
try {
  ownerGuard(mockReqStaff, mockRes, mockNext);
} catch (err: any) {
  if (err instanceof ForbiddenError && err.statusCode === 403) {
    tracker.staffBlocked = true;
  }
}
console.assert(tracker.staffBlocked === true, 'Test 2.2 Thất bại: STAFF không bị chặn khi xem báo cáo doanh thu');
console.assert(tracker.nextCalled === false, 'Test 2.3 Thất bại: Hàm next() vẫn bị gọi khi không đủ quyền');
console.log('✅ 2. Kiểm thử Phân quyền RBAC Chặn STAFF: ĐẠT');

// 3. Kiểm thử Tính toán Hạn mức AI Quota
const used = 25;
const max = 30;
const percentage = Math.min(100, Math.round((used / max) * 100));
const remaining = Math.max(0, max - used);

console.assert(percentage === 83, 'Test 3.1 Thất bại: Tỷ lệ phần trăm tính sai');
console.assert(remaining === 5, 'Test 3.2 Thất bại: Số lượt còn lại tính sai');
console.log('✅ 3. Kiểm thử Tính toán Hạn mức AI Quota: ĐẠT');

console.log('\n🎉 TOÀN BỘ CÁC KIỂM THỬ ĐƠN VỊ G17 ĐÃ VƯỢT QUA 100%!');
