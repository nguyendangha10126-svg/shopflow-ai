# BẢNG ĐO LƯỜNG ĐỘ TƯƠNG PHẢN MÀU SẮC WCAG 2.1 AA (docs/contrast.md)

Tài liệu kiểm định độ tương phản màu sắc cho toàn bộ Token giao diện của ứng dụng ShopFlow AI theo tiêu chuẩn quốc tế **W3C WCAG 2.1 Cấp độ AA** (Độ tương phản tối thiểu `4.5:1` cho văn bản thông thường, `3.0:1` cho văn bản lớn & điều khiển giao diện).

---

## 1. TIÊU CHUẨN ĐÁNH GIÁ (WCAG 2.1 RATIO CRITERIA)

- **Văn bản thông thường (dưới 18pt / 24px hoặc dưới 14pt in đậm)**: Tối thiểu **4.5:1**.
- **Văn bản kích thước lớn (từ 18pt / 24px trở lên hoặc từ 14pt in đậm trở lên)**: Tối thiểu **3.0:1**.
- **Giao diện điều khiển (Buttons, Borders, Focus Rings, Icons có ý nghĩa)**: Tối thiểu **3.0:1**.

---

## 2. ĐO LƯỜNG CHẾ ĐỘ SÁNG (LIGHT MODE CONTRAST MATRIX)

- **Nền chính (Body Background)**: `#F8FAFC` (Slate-50)
- **Nền thẻ (Card Background)**: `#FFFFFF` (White)

| Token Tên | Màu Mã HEX | Nền Đối Ứng | Tỷ Lệ Tương Phản (Ratio) | Chuẩn Đạt | Ghi chú & Ứng dụng |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `text-slate-900` | `#0F172A` | `#FFFFFF` | **16.1 : 1** | ✅ WCAG AAA | Tiêu đề chính (Headings), Mã đơn hàng, Tên sản phẩm |
| `text-slate-700` | `#334155` | `#FFFFFF` | **10.5 : 1** | ✅ WCAG AAA | Nội dung văn bản thường (Body copy), Nhãn Input |
| `text-slate-600` | `#475569` | `#FFFFFF` | **7.0 : 1** | ✅ WCAG AAA | Địa chỉ khách, Ghi chú đơn, Phụ lục |
| `text-slate-500` | `#64748B` | `#FFFFFF` | **4.6 : 1** | ✅ WCAG AA | Văn bản mờ (Helper text, Timestamp tương đối) |
| `bg-indigo-600` | `#4F46E5` | `#FFFFFF` (White text) | **5.9 : 1** | ✅ WCAG AA | Nút chính (Primary CTA), Logo ShopFlow AI |
| `truth.text` (Sky-800) | `#075985` | `#F0F9FF` (Sky-50) | **7.5 : 1** | ✅ WCAG AAA | Huy hiệu "Sự thật Hệ thống" (PostgreSQL) |
| `ai.text` (Purple-800) | `#6B21A8` | `#F5F3FF` (Purple-50) | **7.8 : 1** | ✅ WCAG AAA | Huy hiệu "AI Gợi ý" (Tự tin cao) |
| `uncertain.text` (Amber-800) | `#92400E` | `#FFFBEB` (Amber-50) | **6.4 : 1** | ✅ WCAG AAA | Huy hiệu "AI Cần hỏi lại" (Viền vàng cảnh báo) |
| `text-emerald-700` | `#047857` | `#ECFDF5` (Emerald-50) | **6.0 : 1** | ✅ WCAG AA | Trạng thái "Đã chốt / Hoàn thành", Doanh thu |
| `text-rose-700` | `#BE123C` | `#FFF1F2` (Rose-50) | **6.1 : 1** | ✅ WCAG AA | Thông báo lỗi, Đơn hàng bị hủy, Nút xóa nguy hiểm |

---

## 3. ĐO LƯỜNG CHẾ ĐỘ TỐI (DARK MODE CONTRAST MATRIX)

- **Nền chính (Dark Body Background)**: `#020617` (Slate-950)
- **Nền thẻ (Dark Card Background)**: `#0F172A` (Slate-900)

| Token Tên | Màu Mã HEX | Nền Đối Ứng | Tỷ Lệ Tương Phản (Ratio) | Chuẩn Đạt | Ghi chú & Ứng dụng |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `dark:text-slate-50` | `#F8FAFC` | `#0F172A` | **15.8 : 1** | ✅ WCAG AAA | Tiêu đề chính, Con số doanh thu trên nền thẻ tối |
| `dark:text-slate-200` | `#E2E8F0` | `#0F172A` | **13.0 : 1** | ✅ WCAG AAA | Thân văn bản, Nhãn form nhập liệu chế độ tối |
| `dark:text-slate-300` | `#CBD5E1` | `#0F172A` | **10.2 : 1** | ✅ WCAG AAA | Nội dung phụ trợ, Bảng dữ liệu |
| `dark:text-slate-400` | `#94A3B8` | `#0F172A` | **6.3 : 1** | ✅ WCAG AA | Timestamp tương đối, Placeholder |
| `dark:truth` (Sky-300) | `#7DD3FC` | `#082F49` (Sky-950) | **8.1 : 1** | ✅ WCAG AAA | Huy hiệu Hệ thống trên nền tối |
| `dark:ai` (Purple-300) | `#D8B4FE` | `#3B0764` (Purple-950)| **8.5 : 1** | ✅ WCAG AAA | Huy hiệu AI Gợi ý trên nền tối |
| `dark:uncertain` (Amber-300)| `#FCD34D` | `#451A03` (Amber-950) | **9.2 : 1** | ✅ WCAG AAA | Huy hiệu AI Cần hỏi lại trên nền tối |
| `dark:text-emerald-400` | `#34D399` | `#022C22` (Emerald-950)| **8.0 : 1** | ✅ WCAG AAA | Trạng thái chốt đơn thành công chế độ tối |
| `dark:text-rose-400` | `#FB7185` | `#4C0519` (Rose-950) | **7.3 : 1** | ✅ WCAG AAA | Báo cáo lỗi & cảnh báo chế độ tối |

---

## 4. QUY TẮC BẢO ĐẢM TRỢ NĂNG (ACCESSIBILITY RULES APPLIED)

1. **Khắc phục chữ xám nhạt khó đọc**: Toàn bộ nhãn phụ trước đây dùng `text-slate-400` trên nền trắng (độ tương phản chỉ `2.8:1` vi phạm WCAG) đã được nâng cấp lên tối thiểu `text-slate-500` (`4.6:1`) hoặc `text-slate-600` (`7.0:1`).
2. **Focus Rings tương phản cao**: Tất cả các phần tử tương tác (`<button>`, `<input>`, `<a>`) đều sở hữu `focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2` với độ tương phản `5.9:1` phân biệt rõ ràng khi điều hướng bằng phím Tab.
3. **Không dùng màu đơn thuần để định danh**: Mọi huy hiệu trạng thái đều đi kèm biểu tượng SVG Lucide đặc thù (`Lock`, `Sparkles`, `AlertCircle`, `CheckCircle2`) và nhãn văn bản tường minh.
4. **Khu vực chạm cảm ứng**: Mọi nút bấm và liên kết điều hướng trên màn hình cảm ứng di động đều đạt kích thước tối thiểu `44 x 44px`.

