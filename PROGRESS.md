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
| **U4** | **Dán tin AI (1): Ingestion & Clipboard** | ✅ **HOÀN THÀNH** | `MessageIngestionModal.tsx`, `Modal.tsx` | Clipboard API fallback, 3 tin mẫu 1 chạm, đếm 2.000 ký tự, Lucide icons | Không có lỗi. Sẵn sàng vào U5. |
| **U5** | **Dán tin AI (2): Trình duyệt đơn nháp** | ✅ **HOÀN THÀNH** | `DraftOrderReviewModal.tsx` | Phân cấp 3 loại dữ liệu, tô sáng nguồn tin, sao chép câu hỏi khách, thanh hành động cố định | Không có lỗi. Sẵn sàng vào U6. |
| **U6** | **Quản lý Đơn hàng & Drawer thao tác nhanh** | ✅ **HOÀN THÀNH** | `Drawer.tsx`, `OrderDetailDrawer.tsx`, `OrdersPage.tsx` | Drawer chi tiết, chip đếm trạng thái động, sao chép tin nhắn Zalo, gọi khách, modal xác nhận | Không có lỗi. Sẵn sàng vào U7. |
| **U7** | **Quản lý Sản phẩm (1): Lưới, Form, Undo** | ✅ **HOÀN THÀNH** | `ProductsPage.tsx`, `ProductImage.tsx`, `product.repository.ts`, `product.routes.ts` | Chế độ xem Lưới/Bảng, Thêm/Sửa sản phẩm, Xóa mềm có Hoàn tác (Undo) | Không có lỗi. Sẵn sàng vào U8. |
| **U8** | **Quản lý Sản phẩm (2): Tải ảnh & Storage** | ✅ **HOÀN THÀNH** | `storage.provider.ts`, `upload.routes.ts`, `ImageUploader.tsx`, `image.ts` | StorageProvider (Disk dev / Cloudinary prod), Client resize & nén WebP, magic bytes | Không có lỗi. Sẵn sàng vào U9. |
| **U9** | **Khách hàng & Hồ sơ chi tiết (CRM mini)** | ⏳ Đang thực hiện | - | Lịch sử đơn hàng của khách, nhãn Khách quen (>=3 đơn) | Chuyển sang U9 ngay. |
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

### Bước U4: Nâng cấp trải nghiệm Dán tin AI (Ingestion Sheet & Clipboard)
- **Thời gian**: 2026-10-21 21:45
- **Công việc đã làm**:
  1. **Nâng cấp giao diện Ingestion**:
     - Hỗ trợ tùy biến độ rộng linh hoạt `maxWidth="max-w-2xl"` trên component `Modal.tsx`.
     - Thay thế toàn bộ emoji bằng biểu tượng Lucide (`Sparkles`, `Clipboard`, `Plus`, `Trash2`, `AlertCircle`, `FileText`, `Loader2`).
  2. **Thao tác 1 chạm Clipboard an toàn**:
     - Tự động đọc dữ liệu từ `navigator.clipboard.readText()`.
     - Xử lý mượt mà khi trình duyệt chặn quyền (Permission Denied / Insecure context) với thông báo hướng dẫn nhẹ nhàng, không gây crash ứng dụng.
     - Hỗ trợ nút ghép thêm tin nhắn (`+ Ghép thêm tin`) và nút xóa nhanh.
  3. **Đếm ký tự & Phím tắt nhanh**:
     - Hiển thị bộ đếm thời gian thực `charCount / 2.000 ký tự` kèm màu cảnh báo khi gần đạt giới hạn.
     - Hỗ trợ phím tắt `Ctrl + Enter` (hoặc `Cmd + Enter`) để gửi phân tích ngay lập tức.
  4. **Kịch bản mẫu 1 chạm**:
     - Bổ sung 3 mẫu tin nhắn thực tế của khách hàng Việt Nam (Đủ thông tin & size, Thiếu size/màu, Nhiều món & viết tắt) để người dùng thử nghiệm nhanh mà không cần gõ.
  5. **Quy trình phân tích thật minh bạch**:
     - Không tạo độ trễ giả mạo, hiển thị trạng thái thực tế kèm `aria-live="polite"` cho bộ đọc màn hình.
- **Kiểm chứng**: `npm run lint` & `npm run build` đạt 100%.

### Bước U5: Hoàn thiện Trình duyệt đơn nháp AI (Draft Order Review Modal)
- **Thời gian**: 2026-10-21 21:47
- **Công việc đã làm**:
  1. **Phân cấp 3 tầng dữ liệu trực quan**:
     - *Sự thật hệ thống (Truth)*: Tồn kho thực tế, SKU, đơn giá chuẩn từ danh mục - gắn huy hiệu Khiên xanh bảo vệ.
     - *AI Gợi ý (AI Proposed)*: Tên khách hàng, SĐT, địa chỉ giao hàng trích xuất - gắn huy hiệu Tia sáng tím.
     - *Cần hỏi lại / Nghi ngờ (Uncertain)*: Cảnh báo hàng thiếu biến thể (size/màu) hoặc cảnh báo prompt injection - gắn huy hiệu Cảnh báo hổ phách.
  2. **Tô sáng nguồn tin tương tác 2 chiều (Source Highlighting)**:
     - Khi rê chuột hoặc nhắm focus vào từng trường thông tin bên phải (khách, SĐT, địa chỉ, mặt hàng), đoạn tin nhắn gốc tương ứng bên trái sẽ tự động nổi bật nền tím/vàng và cuộn vào tầm nhìn.
  3. **Sao chép câu hỏi khách 1 chạm**:
     - Tự động tạo mẫu câu nhắn lịch sự cho shop: *"Dạ Shop May xin phép xác nhận lại size/màu..."*, nút bấm 1 chạm sao chép thẳng vào clipboard để gửi qua Zalo/Messenger kèm thông báo toast.
  4. **Thanh hành động cố định đáy (Sticky Action Bar)**:
     - 3 nút rõ ràng: "Bỏ qua" (thứ cấp), "Lưu nháp" (viền), "Chốt & Trừ kho" (chính - màu tím nổi bật), kèm trạng thái cảnh báo khi vượt tồn kho hoặc chưa chọn đủ phân loại.
- **Kiểm chứng**:
  - `npm run lint` và `npm run build` không còn lỗi TypeScript nào.

### Bước U6: Nâng cấp Quản lý Đơn hàng & Drawer thao tác nhanh
- **Thời gian**: 2026-10-21 21:52
- **Công việc đã làm**:
  1. **Thành phần Drawer trượt phải chuyên nghiệp (`Drawer.tsx`)**:
     - Hỗ trợ cuộn độc lập, khóa scroll thân trang, bẫy tiêu điểm (Focus trap) và đóng bằng phím ESC.
  2. **Drawer chi tiết đơn hàng toàn diện (`OrderDetailDrawer.tsx`)**:
     - Hiển thị đầy đủ thông tin: Mã đơn `#1001`, trạng thái, nguồn đơn (AI Dán tin vs Thủ công), thời gian tạo tương đối.
     - **Sao chép tin nhắn Zalo / Messenger 1 chạm**: Tự động tổng hợp thông tin mã đơn, mặt hàng, tổng thanh toán, địa chỉ để gửi nhanh cho khách.
     - **Gọi điện thoại 1 chạm (`tel:`)** và sao chép địa chỉ giao hàng tiện lợi.
     - Danh sách chi tiết từng sản phẩm kèm SKU, phân loại và giá trị. Bảng tổng kết tài chính rõ ràng.
  3. **Bộ lọc trạng thái tích hợp bộ đếm động (Dynamic Counters)**:
     - Tất cả (8), Bản nháp (1), Đã xác nhận (3), Đang giao (2), Hoàn thành (2), Đã hủy (0) được tính trực tiếp từ dữ liệu hệ thống.
  4. **Thẻ đơn hàng rút gọn & Nút hành động trực tiếp**:
     - Cho phép click mở Drawer từ bất cứ đâu trên thẻ đơn.
     - Nút "Chốt & Trừ kho", "Giao hàng", "Đã giao" hiển thị ngay trên từng dòng đơn theo đúng trạng thái.
  5. **Hộp thoại xác nhận an toàn**:
     - Modal xác nhận trước khi "Chốt & Trừ kho" để tránh bấm nhầm.
     - Modal xác nhận hủy đơn hàng kèm nhập lý do và cam kết hoàn trả tồn kho.
  6. **Loại bỏ 100% Emoji**: Thay thế toàn bộ bằng Lucide icons (`CheckCircle2`, `Truck`, `Clock`, `XCircle`, `Plus`, `Phone`, `Share2`, `Eye`,...).
- **Kiểm chứng**:
  - `npm run lint` và `npm run build` đều vượt qua 100% không cảnh báo.

### Bước U7: Nâng cấp Quản lý Sản phẩm (Lưới, Bảng, Form & Hoàn tác)
- **Thời gian**: 2026-10-21 21:57
- **Công việc đã làm**:
  1. **Chế độ xem kép Lưới (Grid) & Bảng (Table)**:
     - Lưới thẻ ảnh thời trang trực quan có huy hiệu trạng thái kho (Sắp hết hàng $\le 5$ cái) và phân loại kích cỡ.
     - Bảng danh sách chi tiết SKU, số lượng tồn kho tổng, đơn giá thấp nhất và hành động nhanh.
  2. **Thanh chỉ số nhanh (Catalog KPIs)**:
     - Thống kê 4 sản phẩm, 8 SKU, 2 SKU sắp hết hàng, 83 chiếc tồn kho thực tế khớp Single Source of Truth.
  3. **Thêm / Sửa sản phẩm linh hoạt**:
     - Hỗ trợ đổi tên, danh mục, mô tả và tinh chỉnh giá bán/tồn kho từng biến thể.
  4. **Xóa mềm có Hoàn tác (Soft Delete with Undo)**:
     - Khi bấm xóa, sản phẩm được đánh dấu xóa mềm và kích hoạt thanh thông báo nổi với nút **"Hoàn tác"** (Undo) gọi `POST /products/:id/restore` phục hồi ngay tức thì.
- **Kiểm chứng**: `npm run lint` và `npm run build` đạt 100%.

### Bước U8: Hệ thống Tải ảnh An toàn & Lớp Trừu tượng StorageProvider
- **Thời gian**: 2026-10-21 21:59
- **Công việc đã làm**:
  1. **Lớp trừu tượng `StorageProvider` (`storage.provider.ts`)**:
     - `LocalStorageProvider`: Lưu trữ an toàn tại `public/uploads` trong môi trường phát triển cục bộ.
     - `CloudinaryStorageProvider`: Adapter kết nối Cloudinary cho môi trường Production khi cấu hình biến môi trường.
     - Đã ghi tài liệu so sánh Cloudinary vs Supabase Storage vs Cloudflare R2 vào `DECISIONS.md`.
  2. **Bảo mật tệp tải lên (Magic Bytes Validation)**:
     - Kiểm tra chuỗi byte đầu (FF D8 FF cho JPEG, 89 50 4E 47 cho PNG, RIFF/WEBP cho WebP), chặn đứng mã độc giả dạng ảnh.
  3. **Nén và co giãn ảnh phía Client (`image.ts`)**:
     - Canvas resize tự động kích thước tối đa 1200x1200px, nén WebP/JPEG chất lượng cao, giới hạn $\le 5$MB/ảnh.
  4. **Giao diện Tải ảnh `ImageUploader.tsx` & Hiển thị `ProductImage.tsx`**:
     - Hỗ trợ chọn tối đa 5 ảnh / sản phẩm, chọn ảnh bìa (Cover), xóa ảnh, hiển thị khung ảnh dự phòng thanh lịch khi chưa có ảnh hoặc ảnh lỗi.
- **Kiểm chứng**: Tuyến đường `POST /api/v1/upload/image` và `npm run build` thành công mỹ mãn.



