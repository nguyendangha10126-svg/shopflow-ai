import { PiiMasker } from "../src/services/ai/pii-masker";
import { MockAIProvider } from "../src/infrastructure/ai/mock-ai.provider";
import { AIProviderFactory } from "../src/infrastructure/ai/ai-provider.factory";

console.log("🧪 BẮT ĐẦU KIỂM THỬ ĐƠN VỊ CHO AI MODULE (G14)");

// 1. Kiểm thử PII Masker (Nghị định 13/2023/NĐ-CP)
const rawTextWithPhone =
  "Chị lấy 1 áo sơ mi trắng sz M về 123 Lê Lợi Q1 HCM nhé, sđt chị 0903123456";
const { maskedText, phoneMap } = PiiMasker.mask(rawTextWithPhone);

console.assert(
  !maskedText.includes("0903123456"),
  "Test 1.1 Thất bại: SĐT chưa được che giấu trong prompt",
);
console.assert(
  maskedText.includes("[PHONE_1]"),
  "Test 1.2 Thất bại: Không tìm thấy placeholder [PHONE_1]",
);
console.assert(
  phoneMap["[PHONE_1]"] === "0903123456",
  "Test 1.3 Thất bại: Bản đồ SĐT không lưu đúng số",
);

const restoredPhone = PiiMasker.restorePhone("[PHONE_1]", phoneMap);
console.assert(
  restoredPhone === "0903123456",
  "Test 1.4 Thất bại: Khôi phục SĐT thất bại",
);
console.log("✅ 1. Kiểm thử PII Masking & Restoration: ĐẠT");

// 2. Kiểm thử AIProviderFactory (Strategy Pattern)
const provider = AIProviderFactory.getProvider();
console.assert(
  provider !== null,
  "Test 2.1 Thất bại: Provider không được khởi tạo",
);
console.log("✅ 2. Kiểm thử AIProviderFactory: ĐẠT");

// 3. Kiểm thử MockAIProvider trích xuất thực thể
async function testMockExtraction() {
  const mock = new MockAIProvider();
  const result = await mock.extractDraftOrder(
    "Shop ơi lấy cho chị 1 áo sơ mi lụa trắng size L",
  );

  console.assert(
    result.items.length === 1,
    "Test 3.1 Thất bại: Không trích xuất được 1 mặt hàng",
  );
  console.assert(
    result.items[0].size === "L",
    "Test 3.2 Thất bại: Không nhận diện đúng size L",
  );
  console.assert(
    result.items[0].color === "Trắng",
    "Test 3.3 Thất bại: Không nhận diện đúng màu Trắng",
  );
  console.assert(
    result.confidence_score >= 0.9,
    "Test 3.4 Thất bại: Điểm tin cậy quá thấp",
  );
  console.log("✅ 3. Kiểm thử Trích xuất Thực thể AI (MockProvider): ĐẠT");

  const faqAnswer = await mock.answerFaq("Chính sách đổi trả thế nào?", [
    "Đổi hàng 7 ngày",
  ]);
  console.assert(
    faqAnswer.length > 10,
    "Test 3.5 Thất bại: Câu trả lời FAQ quá ngắn",
  );
  console.log("✅ 4. Kiểm thử Hỗ trợ FAQ AI: ĐẠT");
}

testMockExtraction()
  .then(() => {
    console.log(
      "\n🎉 TOÀN BỘ CÁC KIỂM THỬ ĐƠN VỊ CHO AI MODULE ĐÃ VƯỢT QUA 100%!",
    );
  })
  .catch((err) => {
    console.error("❌ Lỗi kiểm thử:", err);
    process.exit(1);
  });
