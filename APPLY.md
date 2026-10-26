# CÁCH ÁP DỤNG BẢN SỬA (khoảng 5 phút)

Thư mục này là BẢN ĐẦY ĐỦ (gồm cả đợt sửa trước), chứa 22 file đã sửa/thêm, cùng đường dẫn với dự án của bạn (D:\AIBD-DangHa).

## Bước 1 - Chép đè
Chép nội dung thư mục `shopflow-fix` vào `D:\AIBD-DangHa` (chọn "Replace the files").
File MỚI: apps/backend/src/core/db-fallback.ts

(Nếu đã chép bản v1 trước đó, cứ chép đè v2 lên, không xung đột.)

## Bước 2 - Cập nhật file .env (QUAN TRỌNG)
Mở `.env` (file thật, không phải .env.example) và:
1. Thêm dòng:  DEMO_MODE=false
   Nếu chạy sau Nginx/Docker thì thêm:  TRUST_PROXY=1  (chạy `npm run dev` thì để 0)
2. Đặt JWT_SECRET riêng của bạn. Sinh bằng PowerShell:
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   rồi dán kết quả:  JWT_SECRET="<chuoi-vua-sinh>"

## Bước 3 - Chạy DB + migrate + seed
docker compose up -d postgres        (hoặc bật PostgreSQL của bạn)
npm run prisma:deploy
npm run prisma:seed                  (nếu script tên khác, xem package.json)

Đăng nhập thử: owner@mayboutique.vn / ShopFlow@123 (tài khoản này giờ được kiểm tra qua DB thật).

## Bước 4 - Chạy lại
npm run dev
Mở http://localhost:5173, ĐĂNG XUẤT rồi ĐĂNG NHẬP LẠI (để lưu refresh token mới).

## Bước 5 - Kiểm tra bằng mắt
- Tắt PostgreSQL rồi tải Dashboard: phải thấy thông báo lỗi + "Thử tải lại", KHÔNG còn số 3.200.000 / 8 đơn giả.
- Bật lại PostgreSQL, bấm Thử tải lại: số liệu thật hiện ra.
- Trang Khách hàng: "Chi tiêu" khác 0 cho khách có đơn đã chốt.
- Để tab mở > 15 phút rồi mở trang Chính sách: vẫn tải được (token tự làm mới).

## Bước 6 - Chạy test (tôi CHƯA chạy được trong môi trường của mình)
npm run test:c4 ; npm run test:c14 ; npm run test:c15 ; npm run test:all
Nếu test nào đỏ, dán nguyên lỗi cho tôi.

## Bước 7 - Commit
git checkout -b fix/no-fake-data
git add . && git commit -m "Fix: bo du lieu gia, sua dang nhap, tinh chi tieu, refresh token"


## Có gì mới ở bản v2 (ngoài các sửa lỗi bản v1)
- Trừ kho: bấm "Chốt đơn" 2 lần cùng lúc không còn trừ kho 2 lần; bấm "Hủy" 2 lần không còn cộng kho 2 lần.
- Đơn đã giao/đã trả không còn hủy được (trước đây hủy sẽ cộng kho sai).
- Body JSON mặc định giới hạn 200KB (chỉ route upload ảnh được 8MB), chống làm đầy RAM.
- Upload ảnh: giới hạn 30 ảnh/phút/người, lưu theo thư mục từng shop, tên file ngẫu nhiên bằng crypto.
- Hỏi đáp FAQ có giới hạn 15 lần/phút (mỗi lần gọi AI đều tốn tiền).
- Giới hạn chung 1000 yêu cầu/15 phút (trước 200, dễ chặn người dùng thật) và tin cậy proxy để tính đúng IP.
- docker-compose: bắt buộc đặt JWT_SECRET, không còn khóa mặc định công khai.
- Gỡ lớp Cloudinary giả (chỉ tạo link ảnh không tồn tại). Hiện ảnh lưu trên ổ đĩa máy chủ.

## Kiểm thử thêm cho v2
- Bấm Chốt đơn 2 lần thật nhanh: kho chỉ trừ một lần.
- Thử hủy đơn ĐÃ GIAO: phải báo lỗi chuyển trạng thái không hợp lệ.
- Gửi body JSON > 200KB tới /api/v1/products: phải báo 413.

## Dọn dẹp thêm (làm tay)
Xóa bộ mã cũ ở thư mục gốc, chỉ giữ `apps/`: thư mục `src/`, `public/`, `prisma/` ở gốc nếu chắc chắn không còn dùng
(kiểm tra `package.json` gốc trước). Làm trên nhánh riêng để quay lại được.
