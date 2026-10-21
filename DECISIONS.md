# BẢNG QUYẾT ĐỊNH THIẾT KẾ & KIẾN TRÚC (DECISIONS.md)

Tài liệu ghi lại toàn bộ quyết định kỹ thuật, quy tắc thiết kế sản phẩm, giả định mặc định và kế hoạch nâng cấp ứng dụng ShopFlow AI từ bước U0 đến U14 theo tiêu chuẩn Senior Product Designer & Frontend Engineer.

---

## 1. GIẢ ĐỊNH & THIẾT LẬP MẶC ĐỊNH (PRE-AGREED DEFAULTS)

| Hạng mục | Quyết định chốt | Lý do & Căn cứ kỹ thuật |
| :--- | :--- | :--- |
| **Đối tượng người dùng** | Chủ shop thời trang 25–45 tuổi, thao tác 1 tay trên điện thoại, vừa nhắn tin khách vừa chốt đơn, không am hiểu kỹ thuật. | Mọi UI phải tối ưu ngón cái (thumb-zone), nút bấm >= 44px, chữ rõ ràng, không thuật ngữ khó hiểu. |
| **Nhóm phát triển** | 1–2 kỹ sư mức trung bình; môi trường phát triển máy Windows. | Giữ kiến trúc dễ bảo trì, script tương thích cả Windows PowerShell lẫn Linux/Docker. |
| **Công nghệ (Stack)** | Node.js v24, Express + TypeScript (Backend port 5000), React 18 + Vite 5 + TailwindCSS 3.4 (Frontend port 5173), Prisma ORM + PostgreSQL. | Sử dụng đúng stack đang có, không viết lại từ đầu, giữ nguyên cấu trúc monorepo. |
| **Tiêu chí "Khách quen"** | Khách hàng có **>= 3 đơn hàng** ở trạng thái `CONFIRMED` (Đã xác nhận) hoặc `DELIVERED` (Hoàn thành). | Đảm bảo đúng giá trị thương mại thực tế; đơn nháp (`DRAFT`) hoặc đã hủy (`CANCELLED`) không được tính. |
| **Giới hạn ảnh sản phẩm** | Tối đa **5 ảnh / sản phẩm**; dung lượng tối đa **5MB / ảnh**; định dạng hợp lệ: JPEG, PNG, WebP. | Đảm bảo tốc độ tải trang mobile, tiết kiệm dung lượng lưu trữ, tránh nghẽn băng thông. |
| **Lớp lưu trữ ảnh (`StorageProvider`)** | Viết interface `StorageProvider` trừu tượng.<br>- **Development**: `LocalStorageProvider` ghi vào thư mục đĩa cục bộ `public/uploads`.<br>- **Production**: Cấu hình sẵn adapter cho Cloudinary. | Dễ hoán đổi mà không sửa business logic. So sánh lưu trữ bên dưới. |
| **Bảng giá dịch vụ** | Free / Basic / Pro: Dùng nhãn giữ chỗ `"Giá sẽ cập nhật"`. | Tránh bịa đặt số liệu tài chính khi chưa có chính sách giá chính thức từ ban quản trị. |
| **Quản lý dữ liệu máy chủ** | Giữ cơ chế `apiClient` hiện có kết hợp custom React hooks và centralized caching/refresh. | Đã hoạt động ổn định, kiểm soát chặt chẽ AbortController và lỗi mạng; không cần cài thêm TanStack Query để tránh phình dung lượng bundle thêm 40KB gzip không cần thiết. |

---

## 2. SO SÁNH GIẢI PHÁP LƯU TRỮ ẢNH (STORAGE PROVIDER EVALUATION)

| Nhà cung cấp | Ưu điểm | Nhược điểm / Rủi ro | Đánh giá & Khuyến nghị |
| :--- | :--- | :--- | :--- |
| **Cloudinary** (Được chọn làm mặc định Prod) | Tự động biến đổi kích cỡ (auto-resize), nén WebP/AVIF theo thiết bị, CDN toàn cầu siêu nhanh, SDK Node.js chính chủ. | Hạn mức gói Free hạn chế (25 tín dụng/tháng ~ 25.000 lượt chuyển đổi hoặc 25GB băng thông). *Cần kiểm chứng hạn mức hiện hành.* | **Khuyến nghị số 1 cho Production** giai đoạn đầu của shop nhỏ vì tích hợp xử lý ảnh tức thì. |
| **Cloudflare R2** | Miễn phí băng thông tải về (Zero Egress Fees), tương thích S3 API, giá lưu trữ cực rẻ (\$0.015/GB/tháng). | Không có bộ xử lý nén/resizing ảnh on-the-fly tích hợp sẵn; phải tự viết Cloudflare Worker nếu muốn resize. *Cần kiểm chứng hạn mức hiện hành.* | Phù hợp khi hệ thống mở rộng quy mô lớn (hàng triệu ảnh) cần tối ưu chi phí truyền tải. |
| **Supabase Storage** | Tích hợp sẵn với hệ sinh thái Postgres, quản lý phân quyền Row-Level-Security (RLS), gói Free 1GB. | Tốc độ biến đổi ảnh cơ bản, CDN phụ thuộc hạ tầng Supabase. *Cần kiểm chứng hạn mức hiện hành.* | Thích hợp nếu chuyển toàn bộ backend sang kiến trúc Supabase BaaS. |

---

## 3. PHÂN LOẠI HIỆN TRẠNG & DANH SÁCH VẤN ĐỀ (AUDIT U0)

Qua quá trình duyệt mã nguồn và chụp ảnh trực tiếp các màn hình (`docs/screenshots/before/`):

### 3.1. Nhóm LỖI (Bugs cần sửa gấp ở U1)
1. **Lỗi FAQ Toast**: Khi vào trang FAQ, hệ thống hiển thị thông báo đỏ "Không thể tải danh sách tài liệu chính sách" do chưa xử lý fallback an toàn khi server chưa có dữ liệu vector/chính sách.
2. **Số liệu Dashboard không đồng bộ**:
   - Thẻ hiển thị "24 đơn", dòng chi tiết "8 chốt + 6 giao + 2 nháp" = 16 đơn (lệch 8 đơn).
   - Banner cảnh báo "14 đơn đang xử lý", trong khi danh sách thực tế trang Đơn hàng chỉ có 2 đơn.
   - Cần đồng bộ toàn bộ chỉ số từ DB bằng một nguồn duy nhất (Single Source of Truth), có văn bản `docs/metrics.md` định nghĩa công thức và câu SQL kiểm chứng.
3. **Chi tiêu khách hàng sai**: Khách "Đã mua 3 đơn" nhưng "Chi tiêu 0 ₫", khách mới 1 đơn vẫn hiển thị nhãn "Khách quen".
4. **Tên model AI bị ghi cứng**: Ghi cứng `"Google Gemini 1.5 Flash"` trên giao diện Dashboard thay vì đọc từ cấu hình môi trường backend.
5. **Số SKU tồn kho lệch**: Dashboard báo "20 SKU, 3 sắp hết", không khớp số liệu danh mục trang Sản phẩm.
6. **Thời gian đơn hàng dư thừa**: Hiển thị định dạng đầy đủ `17:17:19 21/10/2026` chứa giây không cần thiết; cần chuyển sang thời gian tương đối thân thiện (VD: "15 phút trước", "Hôm qua lúc 14:30").

### 3.2. Nhóm KHÓ DÙNG (UX Friction)
1. **Lộ thuật ngữ kỹ thuật chuyên sâu**: Giao diện chính chứa các thuật ngữ dành cho lập trình viên như *"Single Source of Truth"*, *"Cô lập theo Shop"*, *"Trừ kho nguyên tử"*, *"RAG chunks ngữ nghĩa"*, *"Chống bịa đặt"*, *"p50/p95/Token"*. Cần dọn sạch khỏi giao diện bán hàng hàng ngày, đưa vào chế độ tùy chọn "Xem kỹ thuật".
2. **Nút "Xóa" hiện trực tiếp không xác nhận**: Rất dễ bấm nhầm trên màn hình cảm ứng điện thoại, gây mất dữ liệu.
3. **Chưa có thao tác nhanh cho chủ shop**: Thiếu nút gọi điện trực tiếp cho khách, sao chép địa chỉ giao hàng gửi shipper, sao chép tin nhắn chốt đơn gửi Zalo/Messenger.
4. **Sidebar không tối ưu cuộn**: Chiều cao sidebar bị cụt khi danh sách đơn hoặc sản phẩm dài.

### 3.3. Nhóm THIẾU (Missing Features)
1. **Chưa có giao diện chuyên biệt cho điện thoại (Mobile First)**: Chưa có thanh điều hướng đáy (Bottom Navigation Tab) và nút nổi Action Button (FAB) để dán tin nhắn AI một chạm.
2. **Sản phẩm chưa có ảnh**: Danh sách sản phẩm chỉ toàn chữ và SKU, không có hình ảnh đại diện trực quan.
3. **Thiếu ngăn kéo chi tiết (Drawer/Sheet)**: Xem chi tiết đơn hàng và khách hàng phải mở trang mới hoặc modal chật hẹp, không mượt mà trên mobile.
4. **Thiếu tìm kiếm nhanh toàn cục (Ctrl+K)**: Không tìm được nhanh đơn hàng, khách hàng, sản phẩm khi có hàng trăm bản ghi.
5. **Thiếu trang giới thiệu Landing Page & Luồng Onboarding**: Người dùng mới vào app không hiểu giá trị và chưa có hướng dẫn từng bước.
6. **Thiếu khả năng hoạt động offline (PWA)**: Mất mạng là app trắng trơn, không có Service Worker và màn hình báo mất mạng thân thiện.

### 3.4. Nhóm ĐẸP & TRẢI NGHIỆM THỊ GIÁC (Aesthetics & Design System)
1. **Dùng Emoji tràn lan làm icon**: Các biểu tượng ⚡, 📋, 👗, 👥, 📚, ⚠️, 📝 làm giao diện thiếu tính chuyên nghiệp thương mại. Cần thay thế 100% bằng bộ icon SVG chuẩn mực `lucide-react`.
2. **Biểu đồ doanh thu thiếu trục và nhãn giá trị**: Biểu đồ 7 ngày chỉ có các cột vô danh, không có thang đo trục Y, không hiển thị giá trị tiền tệ cụ thể khi rê chuột/chạm.
3. **Độ tương phản màu chữ (Contrast)**: Một số nhãn phụ màu xám nhạt (`text-slate-400`) trên nền trắng chưa đạt chuẩn WCAG AA (tối thiểu 4.5:1).
4. **Khoảng cách và phân cấp thị giác (Hierarchy)**: Cần thiết lập lưới khoảng cách 4px đồng bộ, bo góc hiện đại (`rounded-xl` / `rounded-2xl`), hiệu ứng chuyển trang mượt mà tôn trọng `prefers-reduced-motion`.

---

## 4. KẾ HOẠCH NÂNG CẤP TUẦN TỰ (U0 -> U14)

- **U0**: Audit toàn diện, lưu ảnh ban đầu `docs/screenshots/before/`, tạo `DECISIONS.md` & `PROGRESS.md`.
- **U1**: Sửa sạch các lỗi nền tảng a-f, i; viết `docs/metrics.md` chuẩn hóa số liệu.
- **U2**: Thiết lập Design System (Design Tokens, Lucide Icons, WCAG AA Contrast, `/styleguide`).
- **U3**: Xây dựng App Shell hoàn chỉnh (Sidebar, Topbar, Bottom Tab mobile, FAB, Command Palette Ctrl+K).
- **U4**: Trải nghiệm Dán tin AI (1) - Hero Ingestion Modal, Clipboard đọc tự động, đếm ký tự.
- **U5**: Trải nghiệm Dán tin AI (2) - Trình duyệt đơn nháp 3 loại dữ liệu (Tin cậy cao, Cần xác nhận, AI hỏi lại).
- **U6**: Quản lý Đơn hàng - Bố cục thẻ danh sách, Drawer chi tiết, Thao tác 1 chạm (Gọi khách, Gửi Zalo, In vận đơn).
- **U7**: Quản lý Sản phẩm (1) - Chế độ Lưới/Bảng, cảnh báo tồn kho, modal Thêm/Sửa, Xóa mềm có Hoàn tác (Undo).
- **U8**: Quản lý Sản phẩm (2) - Tải lên ảnh an toàn (Client resize + Server Magic bytes), `ProductImage` fallback.
- **U9**: Quản lý Khách hàng & Hồ sơ chi tiết (Lịch sử đơn, nhãn Khách quen chuẩn hóa, ghi chú giao hàng).
- **U10**: Bảng Tổng quan (Dashboard) - Khối "Cần xử lý ngay", KPI đồng bộ, Biểu đồ doanh thu chuẩn, Chế độ "Xem kỹ thuật".
- **U11**: Chính sách & Trợ lý tư vấn FAQ - Trình biên soạn chính sách, Hộp chat "Thử hỏi như khách", Trích dẫn nguồn tài liệu.
- **U12**: Landing Page giới thiệu, Xác thực (Đăng nhập/Đăng ký đẹp), Onboarding 3 bước cho chủ shop mới.
- **U13**: Tinh chỉnh Motion (Micro-interactions), Tích hợp PWA (Manifest, Service Worker offline), Tối ưu hiệu năng.
- **U14**: Kiểm thử toàn diện (Lighthouse, axe-core, kịch bản người dùng `docs/usability-test.md`), Chụp ảnh sau `docs/screenshots/after/`, Nghiệm thu hoàn tất.
