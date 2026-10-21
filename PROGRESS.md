# TIẾN ĐỘ THỰC HIỆN NÂNG CẤP SHOPFLOW AI (PROGRESS.md)

Tài liệu theo dõi liên tục tiến độ nâng cấp ứng dụng ShopFlow AI theo tiêu chuẩn Senior Product Designer + Frontend Engineer kiêm QA (Quy tắc A1 & A5).

---

## TỔNG QUAN TIẾN ĐỘ (U0 - U14)

| Bước | Tên Hạng Mục | Trạng Thái | Files Đã Tạo / Chỉnh Sửa | Cách Kiểm Chứng | Vấn Đề Còn Lại |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **U0** | **Audit repo + Ảnh hiện trạng** | ✅ **HOÀN THÀNH** | `DECISIONS.md`, `PROGRESS.md`, `scripts/capture-screenshots.js`, `docs/screenshots/before/*` | Chạy dev server, chụp đầy đủ ảnh desktop & mobile trước khi nâng cấp | Không có lỗi. Sẵn sàng vào U1. |
| **U1** | **Sửa lỗi nền & Đồng bộ số liệu** | ⏳ Đang thực hiện | `docs/metrics.md`, backend routes, customer calc, relative time | API test, kiểm tra số liệu Dashboard khớp Orders & Customers | Chuyển sang U1 ngay. |
| **U2** | **Hệ thống thiết kế (Design Tokens, Lucide)** | ⏳ Chờ | - | Kiểm tra typecheck, xem trang `/styleguide` | Chờ U1 |
| **U3** | **App Shell & Điều hướng (Mobile + Desktop)** | ⏳ Chờ | - | Test phím tắt Ctrl+K, responsive 390px, thanh tab đáy | Chờ U2 |
| **U4** | **Dán tin AI (1): Ingestion & Clipboard** | ⏳ Chờ | - | Thử dán tin nhắn từ clipboard, đếm ký tự | Chờ U3 |
| **U5** | **Dán tin AI (2): Trình duyệt đơn nháp** | ⏳ Chờ | - | Duyệt đơn nháp 3 phân loại, kiểm tra tô sáng nguồn | Chờ U4 |
| **U6** | **Quản lý Đơn hàng & Drawer thao tác nhanh** | ⏳ Chờ | - | Drawer chi tiết, sao chép tin nhắn Zalo, gọi khách | Chờ U5 |
| **U7** | **Quản lý Sản phẩm (1): Lưới, Form, Undo** | ⏳ Chờ | - | Test thêm/sửa sản phẩm, xóa mềm có nút Hoàn tác | Chờ U6 |
| **U8** | **Quản lý Sản phẩm (2): Tải ảnh & Storage** | ⏳ Chờ | - | Upload ảnh <5MB, client resize, ProductImage fallback | Chờ U7 |
| **U9** | **Khách hàng & Hồ sơ chi tiết (CRM mini)** | ⏳ Chờ | - | Lịch sử đơn hàng của khách, nhãn Khách quen (>=3 đơn) | Chờ U8 |
| **U10**| **Bảng điều khiển Tổng quan (Dashboard)** | ⏳ Chờ | - | Khối Cần xử lý ngay, Biểu đồ có trục/giá trị, KPI | Chờ U9 |
| **U11**| **Chính sách & Trả lời khách (FAQ RAG)** | ⏳ Chờ | - | Trình soạn thảo chính sách, giao diện chat Thử hỏi | Chờ U10 |
| **U12**| **Landing Page, Onboarding & Chế độ Demo** | ⏳ Chờ | - | Luồng đăng nhập, trang giới thiệu, onboarding 3 bước | Chờ U11 |
| **U13**| **Tinh chỉnh Motion & PWA Offline** | ⏳ Chờ | - | Kiểm tra ngắt mạng PWA shell, prefers-reduced-motion | Chờ U12 |
| **U14**| **Kiểm thử toàn diện, Đo lường & Nghiệm thu**| ⏳ Chờ | - | Lighthouse >=90/95, axe 0 lỗi, ảnh `docs/screenshots/after/*` | Chờ U13 |

---

## NHẬT KÝ CHI TIẾT THEO BƯỚC

### Bước U0: Audit repo, khởi tạo git và ghi nhận hiện trạng
- **Thời gian**: 2026-10-21 21:15
- **Công việc đã làm**:
  1. Khởi tạo Git repository trên nhánh mới `upgrade/ui-ux`.
  2. Cài đặt `puppeteer-core` để tự động hóa chụp ảnh màn hình và kiểm thử giao diện.
  3. Viết script `scripts/capture-screenshots.js` kết nối Chrome headless hệ thống.
  4. Chụp toàn bộ màn hình trước khi nâng cấp (desktop 1280px, mobile 390px, chế độ sáng) lưu vào `docs/screenshots/before/`.
  5. Thiết lập `DECISIONS.md` ghi nhận toàn bộ giả định thiết kế và danh sách vấn đề phân theo 4 nhóm: Lỗi, Khó dùng, Thiếu, Đẹp.
  6. Khởi tạo `PROGRESS.md` để theo dõi tiến độ tự chủ U0-U14.
- **Cam kết chất lượng**: Không sửa đổi code nghiệp vụ trong bước U0.
