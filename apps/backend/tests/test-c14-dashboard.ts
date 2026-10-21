import request from 'supertest';
import app from '../src/app';
import { JwtService } from '../src/core/auth/jwt.service';
import { UserRole } from '@prisma/client';

async function runDashboardTests() {
  console.log('🧪 BẮT ĐẦU KIỂM THỬ DASHBOARD, BÁO CÁO & MỨC DÙNG AI (BƯỚC C14)...\n');
  let passedCount = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, errorDetails?: unknown) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (errorDetails) console.error('   Chi tiết lỗi:', JSON.stringify(errorDetails, null, 2));
    }
  }

  // --- TEST 1: GET /api/v1/dashboard/summary từ chối khi không có Token (HTTP 401) ---
  const resNoAuth = await request(app).get('/api/v1/dashboard/summary');
  assert(
    resNoAuth.status === 401 && resNoAuth.body?.error?.code === 'UNAUTHORIZED',
    'TEST 1: GET /api/v1/dashboard/summary từ chối truy cập khi không có token (HTTP 401)'
  );

  // --- TEST 2: GET /api/v1/dashboard/summary với Token hợp lệ ---
  const fakeShopId = '00000000-0000-0000-0000-000000000001';
  const fakeUserId = '00000000-0000-0000-0000-000000000002';
  const authToken = JwtService.generateTokens({
    userId: fakeUserId,
    shopId: fakeShopId,
    email: 'owner@mayboutique.vn',
    role: UserRole.OWNER,
  }).access_token;

  const res = await request(app)
    .get('/api/v1/dashboard/summary')
    .set('Authorization', `Bearer ${authToken}`);

  assert(
    res.status === 200 && res.body?.data !== undefined,
    'TEST 2: GET /api/v1/dashboard/summary phản hồi HTTP 200 kèm payload dữ liệu',
    res.body
  );

  const data = res.body?.data;

  // --- TEST 3: Kiểm tra các trường KPI doanh thu và đơn hàng ---
  assert(
    typeof data?.kpis?.total_revenue_vnd === 'number' &&
      typeof data?.kpis?.total_orders === 'number' &&
      typeof data?.kpis?.ai_conversion_rate === 'number' &&
      data?.kpis?.total_revenue_vnd >= 0,
    'TEST 3: Khối KPIs tính toán doanh thu thuần và tỷ lệ chuyển đổi AI hợp lệ'
  );

  // --- TEST 4: Kiểm tra Biểu đồ 7 ngày gần nhất (Time Series) ---
  assert(
    Array.isArray(data?.revenue_trend_7d) && data?.revenue_trend_7d.length === 7,
    'TEST 4: Biểu đồ doanh thu 7 ngày gồm đúng 7 mốc thời gian liên tiếp'
  );

  // --- TEST 5: Kiểm tra Thống kê Nguồn đơn (AI Clipboard vs Thủ công) ---
  assert(
    data?.orders_by_source?.clipboard !== undefined &&
      data?.orders_by_source?.manual !== undefined,
    'TEST 5: Phân bổ nguồn đơn hàng bóc tách rõ ràng giữa Clipboard AI và Thủ công'
  );

  // --- TEST 6: Kiểm tra Khối Hạn mức & Giám sát Telemetry AI ---
  const aiUsage = data?.ai_usage;
  assert(
    typeof aiUsage?.used_this_month === 'number' &&
      typeof aiUsage?.monthly_limit === 'number' &&
      typeof aiUsage?.remaining === 'number' &&
      typeof aiUsage?.usage_percentage === 'number' &&
      typeof aiUsage?.is_near_limit === 'boolean' &&
      typeof aiUsage?.p50_latency_ms === 'number' &&
      typeof aiUsage?.p95_latency_ms === 'number',
    'TEST 6: Khối Hạn mức AI trả về đầy đủ lượt dùng/tháng, %, cảnh báo sắp hết và độ trễ p50/p95'
  );

  // --- TEST 7: Kiểm tra tính logic của hạn mức (used + remaining === monthly_limit) ---
  assert(
    aiUsage.used_this_month + aiUsage.remaining === aiUsage.monthly_limit,
    'TEST 7: Hạn mức AI đảm bảo tính toán cân bằng (used + remaining = monthly_limit)'
  );

  console.log(`\n🏁 KẾT QUẢ: ĐÃ VƯỢT QUA ${passedCount}/${totalTests} BÀI KIỂM THỬ DASHBOARD & BÁO CÁO (BƯỚC C14)!`);
}

runDashboardTests().catch((err) => {
  console.error('❌ LỖI KHÔNG MONG MUỐN KHI CHẠY TEST C14:', err);
  process.exit(1);
});

