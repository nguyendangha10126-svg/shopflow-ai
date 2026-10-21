import request from 'supertest';
import app from '../src/app';
import { JwtService } from '../src/core/auth/jwt.service';
import { UserRole } from '@prisma/client';
import { FaqService } from '../src/services/faq.service';

async function runFaqRagTests() {
  console.log('🧪 BẮT ĐẦU KIỂM THỬ RAG FAQ & TƯ VẤN CHÍNH SÁCH (BƯỚC C15)...\n');
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

  // --- TEST 1: Thuật toán cắt chunk văn bản ngữ nghĩa (chunkText) ---
  const samplePolicyText = `Đoạn 1: Shop hỗ trợ đổi size trong vòng 7 ngày kể từ khi nhận hàng.
Đoạn 2: Phí vận chuyển nội thành là 20.000đ, ngoại thành là 30.000đ. Đơn từ 500k được freeship.
Đoạn 3: Khách hàng được quyền kiểm tra hàng trước khi thanh toán tiền cho shipper.`;

  const chunks = FaqService.chunkText(samplePolicyText, 100);
  assert(
    chunks.length >= 2 && chunks.every((c) => c.length > 0),
    'TEST 1: Thuật toán chunkText cắt nhỏ văn bản chính sách thành các khối ngữ nghĩa độc lập'
  );

  // --- TEST 2: GET /api/v1/faq/documents yêu cầu Token (HTTP 401) ---
  const resNoAuth = await request(app).get('/api/v1/faq/documents');
  assert(
    resNoAuth.status === 401 && resNoAuth.body?.error?.code === 'UNAUTHORIZED',
    'TEST 2: GET /api/v1/faq/documents từ chối khi không có Authorization Token (HTTP 401)'
  );

  // --- TEST 3: POST /api/v1/faq/documents kiểm tra Zod Schema ---
  const fakeShopId = '00000000-0000-0000-0000-000000000001';
  const fakeUserId = '00000000-0000-0000-0000-000000000002';
  const authToken = JwtService.generateTokens({
    userId: fakeUserId,
    shopId: fakeShopId,
    email: 'owner@mayboutique.vn',
    role: UserRole.OWNER,
  }).access_token;

  const resInvalidDoc = await request(app)
    .post('/api/v1/faq/documents')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      title: 'A', // Quá ngắn (< 2 ký tự)
      raw_text: 'Ngắn', // Quá ngắn (< 10 ký tự)
    });

  assert(
    resInvalidDoc.status === 400 && resInvalidDoc.body?.error?.code === 'VALIDATION_ERROR',
    'TEST 3: POST /api/v1/faq/documents từ chối tài liệu có tiêu đề hoặc nội dung quá ngắn (HTTP 400)'
  );

  // --- TEST 4: POST /api/v1/ai/faq-query yêu cầu Token (HTTP 401) ---
  const resNoAuthQuery = await request(app).post('/api/v1/ai/faq-query').send({
    question: 'Shop có cho đổi size không?',
  });
  assert(
    resNoAuthQuery.status === 401 && resNoAuthQuery.body?.error?.code === 'UNAUTHORIZED',
    'TEST 4: POST /api/v1/ai/faq-query từ chối khi không có Authorization Token (HTTP 401)'
  );

  // --- TEST 5: POST /api/v1/ai/faq-query kiểm tra độ dài câu hỏi ---
  const resEmptyQuery = await request(app)
    .post('/api/v1/ai/faq-query')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      question: '', // Rỗng
    });

  assert(
    resEmptyQuery.status === 400 && resEmptyQuery.body?.error?.code === 'VALIDATION_ERROR',
    'TEST 5: POST /api/v1/ai/faq-query từ chối câu hỏi rỗng hoặc quá ngắn (HTTP 400)'
  );

  // --- TEST 6: POST /api/v1/ai/faq-query Trả lời RAG kèm trích dẫn nguồn ---
  const resFaqQuery = await request(app)
    .post('/api/v1/ai/faq-query')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      question: 'Shop ơi có cho đổi hàng nếu mặc không vừa size không ạ?',
    });

  assert(
    resFaqQuery.status === 200 &&
      typeof resFaqQuery.body?.data?.answer === 'string' &&
      Array.isArray(resFaqQuery.body?.data?.sources) &&
      resFaqQuery.body?.data?.telemetry !== undefined,
    'TEST 6: POST /api/v1/ai/faq-query trả về câu trả lời RAG, mảng nguồn trích dẫn và telemetry'
  );

  // --- TEST 7: Kiểm tra định dạng câu trả lời RAG có chứa lời giải thích lịch sự ---
  const answer = resFaqQuery.body?.data?.answer;
  assert(
    answer.length > 10 && (answer.includes('Dạ') || answer.includes('shop') || answer.includes('Shop')),
    'TEST 7: Câu trả lời tư vấn RAG mang văn phong tiếng Việt chuẩn bán hàng online thân thiện'
  );

  console.log(`\n🏁 KẾT QUẢ: ĐÃ VƯỢT QUA ${passedCount}/${totalTests} BÀI KIỂM THỬ RAG FAQ & TƯ VẤN (BƯỚC C15)!`);
}

runFaqRagTests().catch((err) => {
  console.error('❌ LỖI KHÔNG MONG MUỐN KHI CHẠY TEST C15:', err);
  process.exit(1);
});
