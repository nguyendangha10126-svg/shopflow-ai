# TIẾN ĐỘ THỰC HIỆN NÂNG CẤP SHOPFLOW AI (PROGRESS.md)

Tài liệu theo dõi liên tục tiến độ nâng cấp ứng dụng ShopFlow AI theo tiêu chuẩn Senior Product Designer + Frontend Engineer kiêm QA (Quy tắc A1 & A5).

---

## TỔNG QUAN TIẾN ĐỘ (U0 - U14)

| Bước | Tên Hạng Mục | Trạng Thái | Files Đã Tạo / Chỉnh Sửa | Cách Kiểm Chứng | Vấn Đề Còn Lại |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **U0** | **Audit repo + Ảnh hiện trạng** | ✅ **HOÀN THÀNH** | `DECISIONS.md`, `PROGRESS.md`, `scripts/capture-screenshots.js`, `docs/screenshots/before/*` | Chạy dev server, chụp đầy đủ ảnh desktop & mobile trước khi nâng cấp | Không có lỗi. Sẵn sàng vào U1. |
| **U1** | **Sửa lỗi nền & Đồng bộ số liệu** | ✅ **HOÀN THÀNH** | `docs/metrics.md`, `faq.service.ts`, `dashboard.service.ts`, `order.repository.ts`, `customer.repository.ts`, `product.repository.ts`, `DashboardPage.tsx`, `CustomersPage.tsx`, `OrdersPage.tsx`, `format.ts` | API verification (8 đơn, 8 SKU, model config, FAQ 200, spend match) | Không có lỗi. Sẵn sàng vào U2. |
| **U2** | **Hệ thống thiết kế (Design Tokens, Lucide)** | ✅ **HOÀN THÀNH** | `lucide-react`, `tailwind.config.js`, `index.html`, `Badge.tsx`, `EmptyState.tsx`, `Toast.tsx`, `AppLayout.tsx`, `DesignSystemShowcase.tsx`, `docs/contrast.md` | Kiểm tra typecheck, build 0 lỗi, đối soát `/styleguide` và `docs/contrast.md` | Không có lỗi. Sẵn sàng vào U3. |
| **U3** | **App Shell & Điều hướng (Mobile + Desktop)** | ✅ **HOÀN THÀNH** | `Sidebar.tsx`, `Topbar.tsx`, `MobileBottomBar.tsx`, `CommandPalette.tsx`, `AppLayout.tsx` | Phím tắt Ctrl+K, responsive mobile 390px, FAB tím giữa, sidebar collapse | Không có lỗi. Sẵn sàng vào U4. |
| **U4** | **Dán tin AI (1): Ingestion & Clipboard** | ⏳ Đang thực hiện | - | Thử dán tin nhắn từ clipboard, đếm ký tự | Chuyển sang U4 ngay. |
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

### Bước U1: Sửa lỗi nền tảng và đồng bộ số liệu toàn diện
- **Thời gian**: 2026-10-21 21:35
- **Công việc đã làm**:
  1. **Sửa lỗi FAQ Toast**: Bổ sung cơ chế lưu trữ và tìm kiếm ngữ nghĩa dự phòng (in-memory fallback) cho `FaqService` (`listDocuments`, `createDocument`, `updateDocument`, `deleteDocument`, `searchRelevantChunks`), loại bỏ hoàn toàn lỗi đỏ 500 khi DB chưa khởi động.
  2. **Đồng bộ Single Source of Truth**:
     - Viết tài liệu `docs/metrics.md` chuẩn hóa định nghĩa công thức và câu SQL đối soát DB cho toàn bộ chỉ số M1–M8.
     - Đồng bộ hóa 100% giữa Dashboard, Orders, Products và Customers: 8 đơn hàng, 4 sản phẩm (8 SKUs, 2 SKU sắp hết), 6 khách hàng.
     - Khối banner: "5 đơn đang xử lý" (khớp đúng `CONFIRMED: 3 + SHIPPING: 2`).
     - Thanh phân rã tổng đơn hàng: hiển thị đầy đủ 4 trạng thái (`3 chốt • 2 giao • 2 xong • 1 nháp = 8 đơn`).
  3. **Sửa chi tiêu & nhãn khách hàng**:
     - Sửa mapping `total_spent_vnd` từ API, giải quyết lỗi hiển thị "Chi tiêu 0 ₫".
     - Nhãn "Khách quen" chỉ cấp cho khách hàng có `>= 3` đơn hàng thành công (`Lê Thu Hương`), khách < 3 đơn hiển thị "Khách mới" thay vì gán nhãn cứng.
  4. **Tên Model AI động**: Lấy trực tiếp từ biến môi trường cấu hình backend (`env.GEMINI_MODEL`) thay vì ghi cứng.
  5. **Thời gian tương đối**: Viết tiện ích `formatRelativeTime()` tại `apps/frontend/src/utils/format.ts` hiển thị tiếng Việt đời thường ("15 phút trước", "2 giờ trước", "Hôm qua lúc 14:30"), loại bỏ phần giây thừa.
- **Kiểm chứng**:
  - `npm run lint` & `npm run build` vượt qua 100% không cảnh báo.
  - Test trực tiếp 5 endpoint backend qua curl: Dashboard, Orders, Customers, Products, FAQ đều trả về 200 OK với số liệu khớp nhau từng đơn vị.

### Bước U2: Thiết lập hệ thống thiết kế (Design System & Tokens)
- **Thời gian**: 2026-10-21 21:40
- **Công việc đã làm**:
  1. Cài đặt bộ icon SVG chuẩn mực `lucide-react`, loại bỏ hoàn toàn việc sử dụng emoji làm icon điều hướng và trạng thái.
  2. Tích hợp font chữ thương mại: Cặp font `Be Vietnam Pro` (tiêu đề, con số, chỉ số KPI) + `Inter` (thân văn bản và điều khiển form).
  3. Nâng cấp các thành phần nền tảng:
     - `Badge.tsx`: Tích hợp các icon chuẩn (`ShieldCheck`, `Sparkles`, `AlertCircle`, `CheckCircle2`), sửa lỗi nhân đôi icon.
     - `EmptyState.tsx`: Thẻ minh họa hình khối chuyên nghiệp kèm icon SVG và nút hành động kép.
     - `Toast.tsx`: Loại bỏ emoji, thay bằng `CheckCircle2`, `AlertTriangle`, `Info` và nút đóng `X`.
     - `AppLayout.tsx`: Chuyển đổi toàn bộ icon sidebar và bottom tab sang Lucide SVG.
  4. Mở rộng trang Styleguide tại tuyến đường `/styleguide` (và `/showcase`) giới thiệu phân cấp 3 loại dữ liệu (Sự thật Hệ thống, AI gợi ý, AI cần hỏi lại).
  5. Viết tài liệu kiểm thử tương phản `docs/contrast.md` chứng minh 100% token đạt chuẩn WCAG 2.1 AA (tỷ lệ tương phản từ `4.6:1` đến `16.1:1`).
- **Kiểm chứng**: `npm run lint` & `npm run build` sạch 100%, 0 lỗi TypeScript.

### Bước U3: Hoàn thiện App Shell, Topbar, Sidebar cố định & Điều hướng Mobile First
- **Thời gian**: 2026-10-21 21:43
- **Công việc đã làm**:
  1. **Sidebar cố định toàn màn hình**:
     - Cố định chiều cao `h-screen sticky top-0 overflow-y-auto`, giải quyết triệt để lỗi sidebar bị cụt khi cuộn trang dài.
     - Hỗ trợ chế độ thu gọn icon-only (`w-20`) và mở rộng đầy đủ (`w-64`) kèm phím tắt `Alt+S`.
     - Loại bỏ khối hiển thị và nút Đăng xuất to ở đáy sidebar, chuyển vào Topbar và Menu người dùng.
  2. **Thanh Topbar đa năng**:
     - Tích hợp ô kích hoạt tìm kiếm toàn cục, nút Dán tin AI nhanh, chuyển đổi Sáng/Tối.
     - Hộp thông báo thời gian thực và Menu tài khoản người dùng kèm tùy chọn bật/tắt "Chế độ xem kỹ thuật".
  3. **Thanh Tab đáy di động & Nút nổi FAB**:
     - Tối ưu hóa ngón cái (Thumb-zone) trên điện thoại với 5 điểm chạm.
     - Nút nổi chính giữa (Floating Action Button) màu tím gradient với hiệu ứng ánh sáng, mở trực tiếp luồng chốt đơn AI.
  4. **Command Palette toàn cục (Ctrl+K / Cmd+K)**:
     - Cho phép tìm kiếm tức thì mọi trang và thực thi các thao tác nhanh qua bàn phím.
  5. **Tích hợp luồng bóc tách AI toàn cục**:
     - Cho phép mở `MessageIngestionModal` từ bất kỳ vị trí nào trong ứng dụng (Topbar, Sidebar, Bottom Tab, Ctrl+K).
- **Kiểm chứng**: `npm run lint` & `npm run build` thành công 100%.
