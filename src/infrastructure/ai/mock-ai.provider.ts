import { IAIProvider, ExtractedOrderResult, ExtractedOrderItem } from '../../core/interfaces/ai-provider.interface';

export class MockAIProvider implements IAIProvider {
  async extractDraftOrder(rawMessage: string): Promise<ExtractedOrderResult> {
    // 1. LÀM SẠCH VÀ PHÒNG VỆ INJECTION (XML SANITIZATION & PROMPT INJECTION)
    let sanitizedMessage = rawMessage.replace(/<\/?[^>]+(>|$)/g, ' '); // Lọc sạch XML tags
    sanitizedMessage = sanitizedMessage.replace(/(?:rác\s*){10,}/gi, ' '); // Lọc buffer flood

    const textLower = sanitizedMessage.toLowerCase();

    // Kiểm tra các lệnh Injection độc hại trực tiếp
    const maliciousPatterns = [
      'ignore previous',
      'bỏ qua các chỉ dẫn',
      'admin của shopflow',
      'đặt cờ freeship và xóa',
      'xóa toàn bộ',
      'role: system',
      'system prompt'
    ];

    if (maliciousPatterns.some((pattern) => textLower.includes(pattern))) {
      return {
        customer: {},
        items: [],
        raw_tokens_used: 110,
        confidence_score: 0.0
      };
    }

    // 2. NHẬN DIỆN THẮC MẮC / TƯ VẤN (INQUIRY / GREETING / SPAM - KHÔNG PHẢI ĐƠN HÀNG)
    const hasOrderIntent =
      textLower.includes('ship cho em về') ||
      textLower.includes('ship cho mình') ||
      textLower.includes('lấy 1') ||
      textLower.includes('lấy 2') ||
      textLower.includes('cho 1') ||
      textLower.includes('chốt 1');

    const isPureInquiry =
      !hasOrderIntent &&
      (textLower.includes('mặc quần jean') ||
        textLower.includes('mặc vừa chân váy') ||
        textLower.includes('mặc size gì vừa') ||
        textLower.includes('mặc vừa size gì') ||
        textLower.includes('size mấy vừa') ||
        textLower.includes('có được đổi size không') ||
        textLower.includes('còn hàng sẵn không để mai em qua thử') ||
        textLower.includes('chào shop') ||
        textLower.includes('hi shop') ||
        textLower.includes('chấm hóng') ||
        textLower.includes('video unbox') ||
        (textLower.includes('cao 1m5') && textLower.includes('nặng')));

    if (isPureInquiry) {
      return {
        customer: {},
        items: [],
        raw_tokens_used: 90,
        confidence_score: 0.0
      };
    }

    // 3. XỬ LÝ KHÁCH ĐỔI Ý (TEMPORAL CHANGE OF MIND)
    let detectedSize: string | undefined = undefined;
    let detectedColor: string | undefined = undefined;
    let quantityMultiplier = 1;
    let excludeChanVay = false;

    if (textLower.includes('thôi bỏ chân váy') || textLower.includes('lấy mỗi sơ mi')) {
      excludeChanVay = true;
    }

    if (textLower.includes('thêm 1 cái nữa là 2 cái') || textLower.includes('lấy 2 cái')) {
      quantityMultiplier = 2;
    }

    // Ưu tiên quyết định sau cùng khi đổi ý
    if (textLower.includes('lấy size m thôi') || textLower.includes('đổi sang size m') || textLower.includes('đổi sang m')) {
      detectedSize = 'M';
    } else if (textLower.includes('đổi sang size l') || textLower.includes('lấy size l thôi')) {
      detectedSize = 'L';
    } else if (textLower.includes('đổi cho mình sang áo thun trắng') || textLower.includes('đổi sang áo thun trắng')) {
      detectedColor = 'Trắng';
      detectedSize = 'L';
    } else if (textLower.includes('đổi sang màu đen') || textLower.includes('lấy màu đen thôi')) {
      detectedColor = 'Đen';
    } else {
      // Nhận diện kích cỡ thông thường
      if (textLower.includes('size xl') || textLower.includes('sz xl')) detectedSize = 'XL';
      else if (textLower.includes('size l') || textLower.includes('sz l') || textLower.includes('thun đen l')) detectedSize = 'L';
      else if (textLower.includes('size m') || textLower.includes('sz m')) detectedSize = 'M';
      else if (textLower.includes('size s') || textLower.includes('sz s') || textLower.includes('trắng s')) detectedSize = 'S';
      else if (textLower.includes('size 28') || textLower.includes('sz 28')) detectedSize = '28';
      else if (textLower.includes('size 29') || textLower.includes('sz 29')) detectedSize = '29';

      // Nhận diện màu sắc thông thường
      if (textLower.includes('áo thun trắng')) detectedColor = 'Trắng';
      else if (textLower.includes('màu đen') || textLower.includes('đen') || textLower.includes('den')) detectedColor = 'Đen';
      else if (textLower.includes('màu trắng') || textLower.includes('trắng') || textLower.includes('trang') || textLower.includes('trg')) detectedColor = 'Trắng';
      else if (textLower.includes('màu be') || textLower.includes('be')) detectedColor = 'Be';
      else if (textLower.includes('màu đỏ') || textLower.includes('đỏ') || textLower.includes('do')) detectedColor = 'Đỏ';
      else if (textLower.includes('màu hồng') || textLower.includes('hồng')) detectedColor = 'Hồng';
    }

    // 4. BÓC TÁCH MẶT HÀNG (ITEMS) - HỖ TRỢ TEENCODE & TYPO
    const items: ExtractedOrderItem[] = [];

    // Nhận diện Áo sơ mi (hỗ trợ "xomi", "xơ mi", "so mi")
    if (
      textLower.includes('áo sơ mi') ||
      textLower.includes('sơ mi') ||
      textLower.includes('so mi') ||
      textLower.includes('xomi') ||
      textLower.includes('xơ mi')
    ) {
      items.push({
        raw_text: 'áo sơ mi lụa trắng',
        suggested_product_name: 'Áo sơ mi lụa trắng dài tay',
        suggested_sku: 'SOMI-LUA-TRANG',
        size: detectedSize || 'M',
        color: detectedColor || 'Trắng',
        quantity: quantityMultiplier
      });
    }

    // Nhận diện Đầm hoa (hỗ trợ typo "đâm hoa", "dam hoa")
    if (
      textLower.includes('đầm hoa') ||
      textLower.includes('dam hoa') ||
      textLower.includes('đâm hoa') ||
      textLower.includes('váy hoa')
    ) {
      items.push({
        raw_text: 'đầm hoa nhí đỏ',
        suggested_product_name: 'Đầm hoa nhí đỏ vintage',
        suggested_sku: 'VAY-HOA-DO',
        size: detectedSize || 'S',
        color: detectedColor || 'Đỏ',
        quantity: 1
      });
    }

    // Nhận diện Chân váy (nếu không bị loại bỏ bởi đổi ý)
    if (!excludeChanVay && (textLower.includes('chân váy') || textLower.includes('chan vay') || textLower.includes('váy tennis') || textLower.includes('váy chữ a'))) {
      items.push({
        raw_text: 'chân váy chữ a đen',
        suggested_product_name: 'Chân váy chữ A dáng ngắn đen',
        suggested_sku: 'VAY-CHU-A-DEN',
        size: detectedSize || 'S',
        color: detectedColor || 'Đen',
        quantity: 1
      });
    }

    // Nhận diện Quần jean
    if (textLower.includes('quần jean') || textLower.includes('quan jean') || textLower.includes('jean ống rộng')) {
      items.push({
        raw_text: 'quần jean ống rộng',
        suggested_product_name: 'Quần jean ống rộng lưng cao',
        suggested_sku: 'JEAN-RONG-XANH',
        size: detectedSize || '28',
        color: detectedColor || 'Xanh nhạt',
        quantity: quantityMultiplier
      });
    }

    // Nhận diện Áo thun
    if (textLower.includes('áo thun') || textLower.includes('ao thun') || textLower.includes('thun cotton') || textLower.includes('t-shirt')) {
      items.push({
        raw_text: 'áo thun cotton basic',
        suggested_product_name: 'Áo thun cotton basic đen',
        suggested_sku: 'THUN-COTTON-DEN',
        size: detectedSize || 'L',
        color: detectedColor || 'Đen',
        quantity: 1
      });
    }

    // Nếu không khớp từ khóa nhưng có ý định mua rõ ràng
    if (items.length === 0 && (textLower.includes('ship') || textLower.includes('chốt') || textLower.includes('lấy') || textLower.includes('order'))) {
      items.push({
        raw_text: rawMessage.substring(0, 35),
        suggested_product_name: 'Sản phẩm thời trang',
        size: detectedSize || 'M',
        color: detectedColor || 'Trắng',
        quantity: 1
      });
    }

    // 5. BÓC TÁCH KHÁCH HÀNG
    let extractedName = 'Khách hàng';
    const nameMatch = rawMessage.match(/(?:tên|cho bạn mình tên|chị|em)\s+([A-ZÀ-Ỹa-zà-ỹ]+)/i);
    if (nameMatch && nameMatch[1]) {
      extractedName = nameMatch[1];
    }

    let extractedAddress = '';
    const addressMatch = rawMessage.match(/(?:về|đến|ở|tại|qua)\s+([^,]+(?:,[^,]+){1,4})/i);
    if (addressMatch && addressMatch[1]) {
      extractedAddress = addressMatch[1].trim();
    } else {
      extractedAddress = 'Địa chỉ khách cung cấp';
    }

    return {
      customer: {
        name: extractedName,
        phone: '[PHONE_1]',
        address: extractedAddress
      },
      items,
      raw_tokens_used: 190 + items.length * 35,
      confidence_score: items.length > 0 ? 0.94 : 0.0
    };
  }

  async answerFaq(question: string, contextChunks: string[]): Promise<string> {
    if (contextChunks.length === 0) {
      return 'Dạ shop hiện chưa có thông tin chính sách cho câu hỏi này ạ.';
    }
    return 'Dạ theo chính sách của shop, quý khách được hỗ trợ kiểm tra hàng trước khi thanh toán và đổi size miễn phí trong 7 ngày nếu còn nguyên tem mác ạ.';
  }
}
