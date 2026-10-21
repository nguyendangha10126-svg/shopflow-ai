# TÀI LIỆU ĐỊNH NGHĨA CHỈ SỐ KINH DOANH & CÂU LỆNH KIỂM CHỨNG DB (docs/metrics.md)

Tài liệu chuẩn hóa định nghĩa công thức tính toán và câu lệnh SQL kiểm chứng cho toàn bộ các chỉ số trên Bảng điều khiển (Dashboard), Quản lý Đơn hàng, Quản lý Khách hàng và Tồn kho Sản phẩm của ShopFlow AI.

---

## 1. NGUYÊN TẮC DUY NHẤT (SINGLE SOURCE OF TRUTH)

1. Mọi số liệu hiển thị trên giao diện người dùng phải được tính toán trực tiếp từ cơ sở dữ liệu quan hệ (PostgreSQL) hoặc bộ dữ liệu chuẩn hóa của Shop.
2. Tuyệt đối không sinh số ngẫu nhiên trên frontend. Mọi tỷ lệ phần trăm hoặc tổng số tiền phải có công thức toán học và tập hợp bản ghi tương ứng.
3. Các đơn hàng ở trạng thái **Bản nháp (`DRAFT`)** và **Đã hủy (`CANCELLED`)** không được ghi nhận vào doanh thu thuần hoặc chi tiêu tích lũy của khách hàng.

---

## 2. BẢNG ĐỊNH NGHĨA CHỈ SỐ & CÔNG THỨC TOÁN HỌC

| STT | Chỉ số giao diện | Định nghĩa nghiệp vụ | Trạng thái ghi nhận | Công thức tính toán |
| :---: | :--- | :--- | :--- | :--- |
| **M1** | **Doanh thu thuần** (`total_revenue_vnd`) | Tổng giá trị thực thu của các đơn hàng hợp lệ đã phát sinh giao dịch. | `CONFIRMED`, `SHIPPING`, `DELIVERED` | `∑ (total_vnd)` của các đơn chưa xóa có trạng thái hợp lệ. |
| **M2** | **Tổng số đơn hàng** (`total_orders`) | Toàn bộ các đơn hàng đã tạo trong hệ thống (bao gồm cả đơn nháp, đơn chốt, đang giao, hoàn thành và đã hủy). | Toàn bộ trạng thái | `Count(id)` của các đơn chưa xóa (`deleted_at IS NULL`). |
| **M3** | **Đơn đang xử lý** (`in_progress_orders`) | Các đơn hàng nhân viên hoặc chủ shop cần đóng gói, xuất kho hoặc bàn giao cho đơn vị vận chuyển. | `CONFIRMED`, `SHIPPING` | `Count(id WHERE status IN ('CONFIRMED', 'SHIPPING'))`. |
| **M4** | **Hiệu quả chốt đơn AI** (`ai_conversion_rate`) | Tỷ lệ phần trăm đơn hàng được bóc tách từ tin nhắn AI (`source = CLIPBOARD`) chuyển đổi thành đơn thành công (chốt, giao hoặc hoàn tất). | Nguồn `CLIPBOARD` & trạng thái hợp lệ | `(Đơn AI hợp lệ / Tổng đơn AI) * 100%`. |
| **M5** | **Tổng SKU đang kinh doanh** (`active_products_count`) | Tổng số biến thể sản phẩm (size/màu sắc) đang bật kinh doanh và chưa bị xóa. | `is_active = true, deleted_at IS NULL` | `Count(ProductVariant.id)`. |
| **M6** | **SKU sắp hết hàng** (`low_stock_products_count`) | Số lượng biến thể sản phẩm có số lượng tồn kho thực tế nhỏ hơn hoặc bằng ngưỡng cảnh báo. | `stock <= low_stock_threshold` | `Count(ProductVariant.id WHERE stock <= low_stock_threshold)`. |
| **M7** | **Chi tiêu khách hàng** (`total_spent_vnd`) | Tổng số tiền khách hàng đã thanh toán thực tế cho các đơn đã xác nhận hoặc hoàn thành. | `CONFIRMED`, `SHIPPING`, `DELIVERED` | `∑ (total_vnd)` liên kết qua `customer_id`. |
| **M8** | **Nhãn "Khách quen"** (`is_regular_customer`) | Danh hiệu khách hàng thân thiết khi đã phát sinh từ 3 giao dịch mua hàng thành công trở lên. | `CONFIRMED`, `SHIPPING`, `DELIVERED` | `Count(orders WHERE status IN ('CONFIRMED', 'DELIVERED')) >= 3`. |

---

## 3. CÂU LỆNH SQL KIỂM CHỨNG TỪ CƠ SỞ DỮ LIỆU (SQL VERIFICATION)

Chủ shop và kỹ sư QA có thể chạy trực tiếp các câu lệnh sau trong PostgreSQL (`psql` hoặc DBeaver / Prisma Studio) để đối soát:

### 3.1. Kiểm chứng Doanh thu thuần & Số lượng đơn theo trạng thái (M1, M2, M3)
```sql
-- 1. Doanh thu thuần thực tế (Net Revenue)
SELECT 
    COALESCE(SUM(total_vnd), 0) AS total_revenue_vnd,
    COUNT(*) AS total_orders,
    COUNT(CASE WHEN status IN ('CONFIRMED', 'SHIPPING') THEN 1 END) AS in_progress_orders
FROM "Order"
WHERE shop_id = '00000000-0000-0000-0000-000000000002'
  AND deleted_at IS NULL;

-- 2. Phân rã chi tiết đơn hàng theo từng trạng thái (để đối soát thanh hiển thị)
SELECT 
    status,
    COUNT(*) AS count_by_status,
    COALESCE(SUM(total_vnd), 0) AS sum_revenue_vnd
FROM "Order"
WHERE shop_id = '00000000-0000-0000-0000-000000000002'
  AND deleted_at IS NULL
GROUP BY status;
```

### 3.2. Kiểm chứng Hiệu quả chốt đơn AI (M4)
```sql
SELECT 
    COUNT(*) AS total_ai_orders,
    COUNT(CASE WHEN status NOT IN ('DRAFT', 'CANCELLED') THEN 1 END) AS successful_ai_orders,
    ROUND(
        (COUNT(CASE WHEN status NOT IN ('DRAFT', 'CANCELLED') THEN 1 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 
        1
    ) AS ai_conversion_rate_percent
FROM "Order"
WHERE shop_id = '00000000-0000-0000-0000-000000000002'
  AND source = 'CLIPBOARD'
  AND deleted_at IS NULL;
```

### 3.3. Kiểm chứng Tồn kho & Cảnh báo sắp hết hàng (M5, M6)
```sql
SELECT 
    COUNT(*) AS total_active_skus,
    COUNT(CASE WHEN stock <= low_stock_threshold THEN 1 END) AS low_stock_skus
FROM "ProductVariant"
WHERE shop_id = '00000000-0000-0000-0000-000000000002'
  AND is_active = true
  AND deleted_at IS NULL;

-- Danh sách chi tiết các SKU sắp hết hàng cần nhập gấp
SELECT 
    p.name AS product_name,
    pv.variant_name,
    pv.sku,
    pv.stock,
    pv.low_stock_threshold
FROM "ProductVariant" pv
JOIN "Product" p ON pv.product_id = p.id
WHERE pv.shop_id = '00000000-0000-0000-0000-000000000002'
  AND pv.is_active = true
  AND pv.deleted_at IS NULL
  AND pv.stock <= pv.low_stock_threshold
ORDER BY pv.stock ASC;
```

### 3.4. Kiểm chứng Chi tiêu & Tiêu chuẩn "Khách quen" (M7, M8)
```sql
SELECT 
    c.id,
    c.name,
    c.phone,
    COUNT(o.id) AS verified_completed_orders,
    COALESCE(SUM(o.total_vnd), 0) AS total_spent_calculated,
    CASE WHEN COUNT(o.id) >= 3 THEN true ELSE false END AS is_regular_customer
FROM "Customer" c
LEFT JOIN "Order" o 
    ON c.id = o.customer_id 
   AND o.deleted_at IS NULL 
   AND o.status IN ('CONFIRMED', 'SHIPPING', 'DELIVERED')
WHERE c.shop_id = '00000000-0000-0000-0000-000000000002'
  AND c.deleted_at IS NULL
GROUP BY c.id, c.name, c.phone
ORDER BY total_spent_calculated DESC;
```
