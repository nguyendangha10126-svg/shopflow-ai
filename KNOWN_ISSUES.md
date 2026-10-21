# DANH SÁCH VẤN ĐỀ THEO DÕI (KNOWN_ISSUES.md)

**Dự án**: ShopFlow AI (Nâng cấp thương mại U0 - U14)  
**Cập nhật lần cuối**: 21/10/2026

Tất cả 9 lỗi ưu tiên cao ban đầu (a - i) đã được khắc phục triệt để. Dưới đây là các lưu ý vận hành cho giai đoạn tiếp theo:

| STT | Vấn đề / Hạng mục | Mức độ | Hướng dẫn vận hành & Khuyến nghị |
| :---: | :--- | :---: | :--- |
| 1 | **Tích hợp Cloudinary Production** | Thấp | Lớp trừu tượng `StorageProvider` đã được xây dựng hoàn tất. Trong môi trường dev cục bộ, ảnh được lưu trữ an toàn tại `public/uploads`. Khi triển khai production, quản trị viên chỉ cần khai báo 3 biến môi trường `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. |
| 2 | **Cập nhật Bảng giá Dịch vụ** | Thấp | Theo quy định Rule A3, bảng giá Free / Basic / Pro hiện để nhãn *"Giá sẽ cập nhật"*. Khi có biểu phí chính thức từ ban quản trị, cập nhật lại tại `LandingPage.tsx`. |
| 3 | **Cơ sở dữ liệu PostgreSQL cục bộ** | Thấp | Khi máy tính Windows tắt PostgreSQL Service, toàn bộ backend và frontend tự động chuyển sang chế độ fallback an toàn với tập dữ liệu chuẩn hóa Single Source of Truth (8 đơn, 4 sản phẩm, 6 khách). Khi khởi động lại PostgreSQL, hệ thống tự động lưu vào DB. |

