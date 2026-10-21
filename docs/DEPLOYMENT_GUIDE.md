# HƯỚNG DẪN TRIỂN KHAI PRODUCTION CHI PHÍ 0 ĐỒNG (PRODUCTION DEPLOYMENT GUIDE)

**Hệ thống:** ShopFlow AI - Trợ lý Chốt đơn & Tồn kho Thông minh  
**Mục tiêu:** Vận hành thực tế trên Internet phục vụ người dùng thật với ngân sách **0 VNĐ (Hoàn toàn miễn phí)**

---

### 1. Kiến Trúc Hạ Tầng Triển Khai 0 VNĐ (Architecture Topology)

```mermaid
graph LR
    User["Khách hàng & Chủ Shop<br/>(Điện thoại / Máy tính)"] --> Cloudflare["Cloudflare / Render CDN<br/>(Miễn phí SSL/TLS HTTPS)"]
    Cloudflare --> WebService["Render.com / Koyeb Web Service<br/>(Chạy Docker Container Node.js 20)"]
    WebService --> CloudDB[("Neon.tech / Supabase PostgreSQL<br/>(Free Tier 500MB Storage)")]
    WebService --> GeminiAI["Google AI Studio<br/>(Free Tier 15 RPM - Gemini 1.5 Flash)"]
```

| Thành phần           | Nền tảng Đề xuất (0 VNĐ)               | Giới hạn Miễn phí                        | Mục đích                            |
| :------------------- | :------------------------------------- | :--------------------------------------- | :---------------------------------- |
| **Cơ sở dữ liệu**    | **Neon.tech** hoặc **Supabase**        | 0.5 GB SSD, kết nối SSL, tự động sao lưu | PostgreSQL 16 Multi-tenant          |
| **Máy chủ Ứng dụng** | **Render.com** hoặc **Koyeb**          | 512 MB RAM, 0.1 CPU, HTTPS tự động       | Docker Container chạy Backend + SPA |
| **Trí tuệ nhân tạo** | **Google AI Studio**                   | 15 Requests/phút, 1.500 requests/ngày    | Gemini 1.5 Flash bóc tách đơn hàng  |
| **Tên miền & SSL**   | Subdomain `.onrender.com` / Cloudflare | Miễn phí trọn đời, tự cấp chứng chỉ SSL  | Truy cập Web bảo mật cho điện thoại |

---

### 2. Các Bước Triển Khai Chi Tiết Từng Bước

#### Bước 1: Khởi tạo Cơ sở dữ liệu PostgreSQL trên Neon.tech (Thời gian: 2 phút)

1. Truy cập [https://neon.tech](https://neon.tech) và đăng nhập bằng tài khoản GitHub.
2. Bấm **Create Project**, đặt tên `shopflow-production`, chọn khu vực máy chủ gần Việt Nam nhất (**Singapore - ap-southeast-1**).
3. Sao chép chuỗi kết nối kết nối `Connection String` có định dạng:
   ```text
   postgresql://shopflow_owner:xxxxxx@ep-cool-flower-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

#### Bước 2: Chạy Migration CSDL lên Môi trường Mới (Thời gian: 1 phút)

Mở terminal trên máy trạm của bạn và chạy lệnh triển khai schema:

```bash
# Gán tạm thời URL của Neon vào terminal
export DATABASE_URL="postgresql://shopflow_owner:xxxxxx@ep-cool-flower-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Đẩy schema lên database production
npx prisma migrate deploy

# Nạp dữ liệu mẫu ban đầu (Cửa hàng mẫu, sản phẩm, tài khoản seed)
npx prisma db seed
```

#### Bước 3: Đẩy Mã Nguồn lên GitHub

```bash
git init
git add .
git commit -m "feat: complete ShopFlow AI production readiness"
git branch -M main
git remote add origin https://github.com/<tai-khoan-cua-ban>/shopflow-ai.git
git push -u origin main
```

#### Bước 4: Triển khai Web Service trên Render.com (Thời gian: 3 phút)

1. Đăng nhập [https://render.com](https://render.com) bằng tài khoản GitHub.
2. Bấm **New +** $\rightarrow$ Chọn **Web Service**.
3. Kết nối với kho lưu trữ `shopflow-ai` vừa tải lên.
4. Cấu hình các thông số:
   - **Name:** `shopflow-ai`
   - **Region:** `Singapore` (để độ trễ về Việt Nam dưới 40ms)
   - **Runtime:** `Docker` (Render sẽ tự động đọc tệp `Dockerfile` đa giai đoạn đã chuẩn bị)
   - **Instance Type:** `Free`
5. Khai báo các **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `DATABASE_URL`: _(Dán chuỗi kết nối Neon ở Bước 1)_
   - `JWT_SECRET`: `tao_mot_chuoi_ngau_nhien_dai_tren_32_ky_tu_bao_mat_2026`
   - `JWT_EXPIRES_IN`: `15m`
   - `JWT_REFRESH_EXPIRES_IN`: `7d`
   - `AI_PROVIDER`: `gemini` _(hoặc `mock` nếu chỉ demo)_
   - `GEMINI_API_KEY`: _(Khóa lấy từ Google AI Studio)_
   - `GEMINI_MODEL`: `gemini-1.5-flash`
   - `FRONTEND_URL`: `https://shopflow-ai.onrender.com`
6. Bấm **Create Web Service**. Render sẽ tự động tải mã nguồn, build Docker image, chạy kiểm tra Healthcheck và cấp phát tên miền `https://shopflow-ai.onrender.com`.

---

### 3. Quy Trình Khôi Phục Thảm Họa (Disaster Recovery & Backup)

#### 3.1. Sao Lưu Cơ Sở Dữ Liệu Tự Động

Hệ thống đã chuẩn bị sẵn tập lệnh sao lưu [scripts/backup-db.sh](file:///d:/VSCODE%20PXU%20K22/AIBD-DangHa/scripts/backup-db.sh):

```bash
# Chạy thủ công
bash scripts/backup-db.sh

# Cài đặt CronJob tự động sao lưu lúc 2:00 sáng mỗi ngày trên Linux:
0 2 * * * /bin/bash /duong/dan/scripts/backup-db.sh >> /var/log/shopflow_backup.log 2>&1
```

#### 3.2. Quy Trình Khôi Phục Dữ Liệu Khi Gặp Sự Cố

Nếu cơ sở dữ liệu bị hỏng hoặc mất dữ liệu do thao tác nhầm, thực hiện khôi phục trong 30 giây:

```bash
# Giải nén và nạp lại bản sao lưu gần nhất vào PostgreSQL
gunzip -c backups/shopflow_backup_YYYYMMDD_HHMMSS.sql.gz | psql "$DATABASE_URL"
```

---

### 4. Danh Sách Kiểm Tra An Ninh Trước Giờ G (Go-Live Checklist)

- [x] **Biến môi trường:** Không có mật khẩu, secret hay API key nào bị hardcode trong mã nguồn.
- [x] **Multi-stage Dockerfile:** Dung lượng image dưới 180MB, chạy bằng người dùng không đặc quyền `node`.
- [x] **Liveness & Readiness Probe:** Endpoint `/api/v1/health` giám sát liên tục tình trạng sống chết của CSDL.
- [x] **Rate Limiter:** Khống chế 60 req/phút với API thường và 30 req/phút với AI để chống cạn kiệt tài nguyên.
- [x] **Bảo vệ PII:** Số điện thoại khách hàng được mã hóa regex trước khi gửi ra bên ngoài và che giấu với nhân viên `STAFF`.
- [x] **Chống click đúp:** Idempotency-Key hoạt động trơn tru trong 2 phút.
- [x] **Trừ kho nguyên tử:** Conditional Update triệt tiêu 100% nguy cơ bán âm kho khi tải cao.
