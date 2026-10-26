# 🛍️ ShopFlow AI — Trợ Lý Chốt Đơn & Tồn Kho Thông Minh Cho Micro-Shop Online

> **Đồ Án Tốt Nghiệp Chuyên Ngành Công Nghệ Thông Tin / Kỹ Thuật Phần Mềm**  
> Giải pháp SaaS Micro-Commerce đa khách thuê (Multi-tenancy) ứng dụng **Google Gemini 1.5 Flash**, **Human-in-the-Loop Review**, **Trừ kho nguyên tử có điều kiện**, **PostgreSQL 16**, **Prisma ORM**, **Express TypeScript Backend** và **React Vite TailwindCSS Frontend**.

---

[![Node.js Version](https://img.shields.io/badge/Node.js-20.x%20%7C%2024.x-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3%20Strict-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20Alpine-336791)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.14-2D3748)](https://www.prisma.io/)
[![React](https://img.shields.io/badge/React-18.2%20Vite%205-61DAFB)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/AI%20Model-Gemini%201.5%20Flash-8E75C2)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Docker-Multi--stage%20Compose-2496ED)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🌟 1. TỔNG QUAN & BÀI TOÁN GIẢI QUYẾT

Hơn 85% các chủ shop thời trang online quy mô nhỏ (1–2 nhân sự) tại Việt Nam bán hàng qua tin nhắn Facebook Messenger và Zalo. Mỗi ngày, họ mất hàng giờ để đọc tin nhắn viết tắt, kiểm tra tồn kho trong sổ sách, và sao chép thủ công thông tin người nhận sang các ứng dụng giao hàng.

**ShopFlow AI** giải quyết triệt để vấn đề này với triết lý **"Trợ lý khiêm nhường" (Humble Assistant)**:
1. ⚡ **Bóc tách đơn hàng trong 1 giây:** Dán tin nhắn tự do từ clipboard, AI tự động trích xuất Tên, Số điện thoại (chuẩn hóa 10 số), Địa chỉ, và Danh sách mặt hàng (Size/Màu).
2. 🔒 **Triệt tiêu hoàn toàn ảo giác (Zero Hallucination):** Giá bán và số lượng tồn kho được lấy **100% từ PostgreSQL** (Single Source of Truth), AI tuyệt đối không có quyền tự bịa đặt giá.
3. 🛡️ **Trừ kho nguyên tử an toàn (Atomic Conditional Update):** Mệnh đề SQL `WHERE stock >= qty` loại bỏ 100% rủi ro bán âm kho hoặc tranh chấp hàng hóa đồng thời (Race Condition).
4. 📚 **Trợ lý RAG FAQ có trích dẫn nguồn:** Đối soát câu hỏi của khách với chính sách đổi trả, phí ship của shop và trả lời có trích dẫn tài liệu nguồn xác thực.
5. 💰 **Chi phí tiết kiệm:** Ứng dụng Gemini 1.5 Flash tối ưu token (~7.5 VNĐ/đơn) kèm bộ đếm hạn mức Quota Guard tự động (30 đơn/tháng miễn phí).

---

## 🏗️ 2. KIẾN TRÚC HỆ THỐNG & CƠ CẤU MONOREPO

```text
d:\VSCODE PXU K22\AIBD-DangHa/
├── apps/
│   ├── backend/                     # Máy chủ API RESTful Express TypeScript (Port 5000)
│   │   ├── src/
│   │   │   ├── api/                 # Controllers, Middlewares (Auth, RBAC, RateLimit, Validate), Routes
│   │   │   ├── config/              # Biến môi trường & Zod Fail-fast validation
│   │   │   ├── core/                # Miền cốt lõi (Domain State Machine, Error Classes, AI Engines)
│   │   │   │   └── ai/              # GeminiProvider, MockProvider, PIIAnonymizer, DBMatcher, QuotaGuard
│   │   │   ├── repositories/        # Truy vấn dữ liệu Prisma có kiểm soát Tenant (shop_id)
│   │   │   └── services/            # Nghiệp vụ (Auth, Product, Order, AI, Faq, Dashboard)
│   │   └── tests/                   # Bộ kiểm thử tự động toàn diện (C3 -> C17 + Eval Benchmark)
│   └── frontend/                    # Ứng dụng React 18 SPA (Vite + TailwindCSS)
│       └── src/
│           ├── components/          # Design Tokens (Button, Badge, Card, Modal, Toast, Skeleton)
│           ├── contexts/            # AuthContext (JWT Authentication state)
│           ├── pages/               # Dashboard, Orders, Products, Customers, FAQ, Login, Register
│           └── services/            # API Client (Fetch wrapper hỗ trợ Idempotency-Key)
├── prisma/                          # Lược đồ cơ sở dữ liệu PostgreSQL & Migrations
│   ├── schema.prisma                # Bảng biểu, CHECK constraints, composite indexes & atomic counters
│   └── seed.ts                      # Nạp dữ liệu mẫu ban đầu
├── nginx/                           # Cấu hình Nginx Production (Reverse proxy /api/ & SPA Fallback)
│   └── nginx.conf
├── docs/                            # Tài liệu chuyên sâu (Vận hành, Kịch bản bảo vệ, Báo cáo bảo mật)
│   ├── OPERATIONS_MANUAL.md         # Sổ tay vận hành hàng ngày cho Chủ shop & DevOps
│   ├── GRADUATION_DEFENSE_SCRIPT.md # Kịch bản thuyết trình bảo vệ đồ án 15 phút
│   ├── SECURITY_AUDIT_REPORT.md     # Báo cáo đánh giá an toàn thông tin OWASP API Top 10
│   └── BENCHMARK_REPORT.md          # Báo cáo đánh giá hiệu năng AI trên 50 tin nhắn mẫu
├── docker-compose.yml               # Điều phối 3 container: postgres, backend, frontend
├── Dockerfile.backend               # Multi-stage Dockerfile cho Backend (Node 20 Alpine, Non-root)
├── Dockerfile.frontend              # Multi-stage Dockerfile cho Frontend (Nginx 1.25 Alpine)
└── .env.example                     # Biến môi trường mẫu đầy đủ cho môi trường Production
```

---

## 📊 3. ĐỐI CHIẾU TIẾN ĐỘ 18 BƯỚC (C0 — C18)

| Mã Bước | Hạng Mục Công Việc | Trọng Tâm Kỹ Thuật | Trạng Thái |
| :---: | :--- | :--- | :---: |
| **C0** | Khởi tạo Monorepo & Kiến trúc | Cấu trúc Monorepo, npm workspaces, TypeScript strict | ✅ Hoàn thành |
| **C1** | CSDL Quan hệ & Migration | PostgreSQL 16, Prisma schema, CHECK constraints, Multi-tenancy | ✅ Hoàn thành |
| **C2** | Atomic Counter & Chỉ mục | Bảng đếm `shop_counters`, composite indexes chống IDOR | ✅ Hoàn thành |
| **C3** | Nền tảng Backend Foundation | Zod validation, Pino logger, Rate limiting, Error hierarchy | ✅ Hoàn thành |
| **C4** | Xác thực JWT & Phân quyền | Access/Refresh Token, bcrypt salt 10, RBAC (`OWNER`/`STAFF`) | ✅ Hoàn thành |
| **C5** | CRUD Danh mục & Khách hàng | Quản lý sản phẩm, biến thể tồn kho, tra cứu khách hàng | ✅ Hoàn thành |
| **C6** | Đơn hàng & State Machine | Trừ kho nguyên tử có điều kiện, State Pattern lifecycle | ✅ Hoàn thành |
| **C7** | Frontend Design System | Token màu sắc WCAG AA, Typography, Badge, Modal, Toast | ✅ Hoàn thành |
| **C8** | Frontend Vertical Slice #1 | Màn hình Đăng nhập, Đăng ký, Sản phẩm, Đơn hàng, Khách hàng | ✅ Hoàn thành |
| **C9** | AI Backend (MockProvider) | `PIIAnonymizer` che số ĐT, `DBMatcher`, `IdempotencyGuard` | ✅ Hoàn thành |
| **C10**| GeminiProvider Tích hợp | Google Gemini 1.5 Flash, timeout 8s, retry, fallback tự động | ✅ Hoàn thành |
| **C11**| Frontend "Dán tin nhắn" | Đọc Clipboard 1-chạm, ghép tin, hiển thị skeleton loading | ✅ Hoàn thành |
| **C12**| Frontend "Duyệt đơn nháp" | 3 tầng dữ liệu, tô sáng từ khóa, phím tắt `Ctrl + Enter` | ✅ Hoàn thành |
| **C13**| Kiểm chuẩn Đánh giá AI | Đo 12 chỉ số trên 50 tin nhắn benchmark, xuất báo cáo MD/JSON | ✅ Hoàn thành |
| **C14**| Dashboard & Báo cáo Doanh số| Biểu đồ SVG 7 ngày, tỷ lệ chuyển đổi AI, cảnh báo hạn mức | ✅ Hoàn thành |
| **C15**| Trợ lý RAG FAQ Chính sách | Semantic text chunking, BM25 retrieval, trích dẫn nguồn | ✅ Hoàn thành |
| **C16**| Đóng gói Docker & Deploy | Multi-stage Dockerfiles, Nginx SPA proxy, Healthcheck probes | ✅ Hoàn thành |
| **C17**| E2E Integration Suite | Tự động hóa kiểm thử xuyên suốt 8 giai đoạn nghiệp vụ | ✅ Hoàn thành |
| **C18**| Tổng kết & Bàn giao Hệ thống | Cập nhật README, sổ tay vận hành, tài liệu nghiệm thu | ✅ Hoàn thành |

---

## ⚡ 4. TÍNH NĂNG ĐỘT PHÁ CỐT LÕI

### 1. Mô Hình 3 Tầng Dữ Liệu Trên Phiếu Duyệt Đơn
* 🔒 **Tầng 1 (Hệ thống - System):** Giá tiền niêm yết và số lượng tồn kho lấy từ PostgreSQL. Ngăn chặn 100% lỗi bịa đặt giá.
* ⚡ **Tầng 2 (AI Trích xuất):** Tên khách, địa chỉ, số điện thoại đã chuẩn hóa và tên sản phẩm.
* ⚠️ **Tầng 3 (Dữ liệu chưa chắc chắn):** Khung *"AI muốn hỏi bạn"* liệt kê những điểm còn thiếu (VD: *khách chưa chọn size*) kèm nút bấm 1-chạm sao chép câu hỏi gửi khách.

### 2. Bảo Vệ Dữ Liệu Cá Nhân (Tuân Thủ Nghị Định 13/2023/NĐ-CP)
Trước khi gửi đoạn chat ra máy chủ Google AI, phân hệ `PIIAnonymizer` tự động tìm kiếm số điện thoại Việt Nam và thay thế bằng token `[PHONE_1]`. Sau khi AI phân tích xong, hệ thống mới map ngược số điện thoại thật vào đơn hàng nội bộ.

### 3. Trừ Tồn Kho Nguyên Tử & Chống Bán Âm (Race Condition Defense)
```sql
UPDATE product_variants
SET stock = stock - 1, updated_at = NOW()
WHERE id = '...' AND shop_id = '...' AND stock >= 1;
```
Nếu 2 khách cùng chốt món hàng cuối cùng gần như cùng thời điểm, chỉ 1 giao dịch thành công. Giao dịch sau trả về `OUT_OF_STOCK` (HTTP 409) và rollback ngay lập tức.

### 4. Quy Tắc Nghiệp Vụ Vàng (Business Rules)
* **BR-01 (Thời điểm trừ kho):** Đơn ở trạng thái `DRAFT` **tuyệt đối không trừ kho** để tránh ảo tồn kho. Tồn kho chỉ bị trừ khi đơn chuyển sang `CONFIRMED`.
* **BR-02 (Cố định giá lịch sử):** Đơn hàng lưu bản chụp giá (`snap_price_vnd`) tại thời điểm xác nhận, không bị ảnh hưởng nếu sau này shop đổi giá niêm yết.
* **BR-03 (Hoàn kho tự động):** Khi đơn hàng bị hủy (`CANCELLED`), hệ thống tự động cộng hoàn trả số lượng hàng về lại kho.

---

## 🚀 5. HƯỚNG DẪN CÀI ĐẶT & CHẠY NHANH

### Cách 1: Khởi chạy 1-lệnh bằng Docker Compose (Khuyến nghị cho Production)
```bash
# 1. Sao chép biến môi trường
cp .env.example .env

# 2. Khởi động toàn bộ stack 3 container (PostgreSQL, Backend, Frontend Nginx)
docker compose up -d --build

# 3. Mở trình duyệt truy cập:
# Giao diện chính: http://localhost
# API Healthcheck: http://localhost:5000/healthz
```

### Cách 2: Khởi chạy trong Môi trường Phát triển (Local Dev)
```bash
# 1. Cài đặt toàn bộ dependencies
npm install

# 2. Tạo file cấu hình môi trường
cp .env.example .env

# 3. Khởi chạy song song Backend & Frontend
# Terminal 1: Backend Express (Port 5000)
npm run dev:backend

# Terminal 2: Frontend Vite SPA (Port 5173)
npm run dev:frontend
```

---

## 🧪 6. TỔNG HỢP CÁC LỆNH KIỂM THỬ TỰ ĐỘNG

Dự án cung cấp bộ kiểm thử tự động toàn diện, có thể chạy ngay với `npm run`:

```bash
# 1. Kiểm thử Nền tảng Backend, Logger & Error Middleware
npm run test:c3

# 2. Kiểm thử Xác thực JWT & Phân quyền RBAC (Owner/Staff)
npm run test:c4

# 3. Kiểm thử CRUD Danh mục Sản phẩm & Quản lý Khách hàng
npm run test:c5

# 4. Kiểm thử Đơn hàng, State Machine & Trừ kho đồng thời
npm run test:c6

# 5. Kiểm thử AI Backend, MockProvider & Idempotency Cache
npm run test:c9

# 6. Kiểm thử GeminiProvider & Cơ chế Fallback tự động
npm run test:c10

# 7. Kiểm thử Dashboard Báo cáo Doanh thu & Hạn mức AI
npm run test:c14

# 8. Kiểm thử RAG FAQ Tư vấn chính sách có trích dẫn nguồn
npm run test:c15

# 9. Kiểm thử Đóng gói Docker, Nginx SPA Fallback & Healthchecks
npm run test:c16

# 10. Kiểm thử Tích hợp Đầu cuối E2E xuyên suốt 8 giai đoạn nghiệp vụ
npm run test:c17

# 11. Đánh giá chất lượng AI trên 50 tin nhắn Benchmark thực tế
npm run test:eval
```

---

## 📑 7. DANH MỤC API ENDPOINTS CHÍNH THỨC (RESTful v1)

| Nhóm API | Phương Thức | Tuyến Đường | Mô Tả Chức Năng |
| :--- | :---: | :--- | :--- |
| **Health** | `GET` | `/healthz` & `/api/v1/health` | Liveness Probe kiểm tra trạng thái tiến trình |
| | `GET` | `/readyz` & `/api/v1/ready` | Readiness Probe kiểm tra kết nối CSDL |
| **Xác thực**| `POST` | `/api/v1/auth/register` | Đăng ký tài khoản shop mới (Role: OWNER) |
| | `POST` | `/api/v1/auth/login` | Đăng nhập nhận cặp Access/Refresh Token |
| | `GET` | `/api/v1/auth/me` | Lấy thông tin cá nhân & quyền hạn từ Token |
| **Sản phẩm**| `GET` | `/api/v1/products` | Danh sách sản phẩm (tìm kiếm, lọc tồn kho thấp) |
| | `POST` | `/api/v1/products` | Tạo sản phẩm mới kèm các biến thể (size, màu) |
| **Đơn hàng**| `GET` | `/api/v1/orders` | Danh sách đơn hàng (phân trang, lọc trạng thái) |
| | `POST` | `/api/v1/orders` | Tạo đơn hàng mới (DRAFT hoặc CONFIRMED) |
| | `POST` | `/api/v1/orders/:id/confirm` | Duyệt đơn nháp & kích hoạt trừ kho nguyên tử |
| | `POST` | `/api/v1/orders/:id/cancel` | Hủy đơn hàng và tự động hoàn trả tồn kho |
| **Trí tuệ AI**| `POST` | `/api/v1/ai/draft-order` | Bóc tách tin nhắn chat thành đơn nháp |
| | `POST` | `/api/v1/ai/faq-query` | Hỏi đáp RAG chính sách shop có trích dẫn nguồn |
| **Tài liệu FAQ**| `GET` | `/api/v1/faq/documents` | Danh sách tài liệu chính sách của cửa hàng |
| | `POST` | `/api/v1/faq/seed-samples` | Nạp 1-chạm 3 bộ chính sách mẫu tiếng Việt |
| **Dashboard**| `GET` | `/api/v1/dashboard/summary` | Báo cáo KPI, doanh thu 7 ngày & hạn mức AI |

---

## 📚 8. TÀI LIỆU DỰ ÁN CHI TIẾT

* 📖 [Sổ tay Vận hành & Hướng dẫn Bàn giao (docs/OPERATIONS_MANUAL.md)](docs/OPERATIONS_MANUAL.md): Hướng dẫn chi tiết quy trình xử lý đơn hàng hàng ngày, quản lý hạn mức và khắc phục sự cố.
* 🎓 [Kịch bản Thuyết trình Bảo vệ Đồ án (docs/GRADUATION_DEFENSE_SCRIPT.md)](docs/GRADUATION_DEFENSE_SCRIPT.md): Kịch bản thuyết trình 15 phút kèm câu trả lời các câu hỏi phản biện hóc búa của Hội đồng.
* 🛡️ [Báo cáo Đánh giá An toàn Thông tin (docs/SECURITY_AUDIT_REPORT.md)](docs/SECURITY_AUDIT_REPORT.md): Đối chiếu 10 nguy cơ an ninh theo OWASP API Security Top 10.
* 📊 [Báo cáo Kiểm chuẩn AI Benchmark (docs/BENCHMARK_REPORT.md)](docs/BENCHMARK_REPORT.md): Đo kiểm định lượng 12 chỉ số AI trên bộ dữ liệu 50 tin nhắn thực tế.

---

## 👥 9. TÁC GIẢ & THÔNG TIN DỰ ÁN

* **Dự án:** ShopFlow AI — Nền tảng SaaS Trợ lý Bán hàng & Quản lý Tồn kho Thời trang
* **Chủ nhiệm đề tài / Sinh viên thực hiện:** Đặng Hà & Nhóm Nghiên cứu
* **Chuyên ngành:** Công nghệ Thông tin / Kỹ thuật Phần mềm
* **Năm thực hiện:** 2026
* **Bản quyền mã nguồn:** Được phát hành theo giấy phép mở [MIT License](LICENSE).

---

## 👥 9. TÁC GIẢ & THÔNG TIN DỰ ÁN

* **Dự án:** ShopFlow AI — Nền tảng SaaS Trợ lý Bán hàng & Quản lý Tồn kho Thời trang
* **Chủ nhiệm đề tài / Sinh viên thực hiện:** Đặng Hà & Nhóm Nghiên cứu
* **Chuyên ngành:** Công nghệ Thông tin / Kỹ thuật Phần mềm
* **Năm thực hiện:** 2026
* **Bản quyền mã nguồn:** Được phát hành theo giấy phép mở [MIT License](LICENSE).

#   s h o p f l o w - a i  
 