import request from 'supertest';
import app from '../src/app';

async function runTests() {
  console.log('🧪 BẮT ĐẦU KIỂM THỬ BACKEND NỀN (BƯỚC C3)...\n');
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

  // TEST 1: Endpoint /health trả về 200 OK
  const resHealth = await request(app).get('/api/v1/health');
  assert(
    resHealth.status === 200 &&
      resHealth.body.status === 'healthy' &&
      typeof resHealth.body.uptime_seconds === 'number',
    'TEST 1: GET /api/v1/health phản hồi 200 với trạng thái healthy',
    resHealth.body
  );

  // TEST 2: Endpoint không tồn tại trả về 404 với mã NOT_FOUND
  const res404 = await request(app).get('/api/v1/duong-dan-khong-ton-tai');
  assert(
    res404.status === 404 && res404.body?.error?.code === 'NOT_FOUND',
    'TEST 2: Đường dẫn lạ trả về 404 và mã lỗi NOT_FOUND chuẩn OpenAPI',
    res404.body
  );

  // TEST 3: Validate chặn trường lạ (Reject unknown fields .strict())
  const resExtraFields = await request(app).post('/api/v1/test/validate').send({
    name: 'Nguyen Van A',
    email: 'a@gmail.com',
    truong_la_khong_hop_le: 'hacker_data', // Trường lạ
  });
  assert(
    resExtraFields.status === 400 &&
      resExtraFields.body?.error?.code === 'VALIDATION_ERROR' &&
      JSON.stringify(resExtraFields.body?.error?.details).includes('truong_la_khong_hop_le'),
    'TEST 3: Validate Zod từ chối trường lạ không cho phép (Reject unknown field)',
    resExtraFields.body
  );

  // TEST 4: Validate chặn dữ liệu thiếu hoặc sai định dạng email/tên
  const resMissingFields = await request(app).post('/api/v1/test/validate').send({
    name: 'N', // Quá ngắn
    email: 'email-sai-dinh-dang', // Sai email
  });
  assert(
    resMissingFields.status === 400 &&
      resMissingFields.body?.error?.code === 'VALIDATION_ERROR' &&
      Array.isArray(resMissingFields.body?.error?.details),
    'TEST 4: Validate Zod bắt lỗi thiếu trường hoặc sai định dạng email/tên',
    resMissingFields.body
  );

  // TEST 5: Dữ liệu hợp lệ vượt qua Validate
  const resValid = await request(app).post('/api/v1/test/validate').send({
    name: 'Nguyen Van A',
    email: 'a@gmail.com',
  });
  assert(
    resValid.status === 200 &&
      resValid.body?.success === true &&
      resValid.body?.data?.name === 'Nguyen Van A',
    'TEST 5: Dữ liệu hợp lệ vượt qua validate thành công (200 OK)',
    resValid.body
  );

  // TEST 6: Phân loại lỗi tùy chỉnh AppError (409 Conflict)
  const resConflict = await request(app).get('/api/v1/test/conflict');
  assert(
    resConflict.status === 409 &&
      resConflict.body?.error?.code === 'DUPLICATE_ENTRY' &&
      resConflict.body?.error?.details?.field === 'email',
    'TEST 6: Custom AppError trả về đúng HTTP 409 và mã lỗi DUPLICATE_ENTRY',
    resConflict.body
  );

  // TEST 7: Phân loại lỗi tùy chỉnh AppError (403 Forbidden)
  const resForbidden = await request(app).get('/api/v1/test/forbidden');
  assert(
    resForbidden.status === 403 && resForbidden.body?.error?.code === 'FORBIDDEN',
    'TEST 7: Custom AppError trả về đúng HTTP 403 và mã lỗi FORBIDDEN',
    resForbidden.body
  );

  // TEST 8: Gửi JSON lỗi cú pháp
  const resBadJson = await request(app)
    .post('/api/v1/test/validate')
    .set('Content-Type', 'application/json')
    .send('{ "name": "A", "email": '); // JSON cụt
  assert(
    resBadJson.status === 400 && resBadJson.body?.error?.code === 'INVALID_JSON',
    'TEST 8: Body Parser chặn JSON hỏng cú pháp với mã INVALID_JSON (HTTP 400)',
    resBadJson.body
  );

  console.log(`\n🏁 KẾT QUẢ: ĐÃ VƯỢT QUA ${passedCount}/${totalTests} BÀI KIỂM THỬ NỀN TẢNG!`);

  if (passedCount !== totalTests) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('❌ Lỗi không mong muốn trong khi chạy test:', err);
  process.exit(1);
});
