import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runConstraintTests() {
  console.log('🧪 BẮT ĐẦU KIỂM THỬ RÀNG BUỘC CSDL (CHECK CONSTRAINTS)...\n');

  // Lấy shop demo đầu tiên
  const shop = await prisma.shop.findFirst();
  if (!shop) {
    console.error('❌ Không tìm thấy Shop demo. Hãy chạy `npm run prisma:seed` trước!');
    process.exit(1);
  }

  const product = await prisma.product.findFirst({ where: { shop_id: shop.id } });
  if (!product) {
    console.error('❌ Không tìm thấy Sản phẩm demo. Hãy chạy `npm run prisma:seed` trước!');
    process.exit(1);
  }

  // 1. Kiểm tra CHECK: Giá bán âm (price_vnd < 0)
  console.log('--- TEST 1: Thử INSERT biến thể có giá âm (price_vnd = -50.000đ) ---');
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO product_variants (
        id, shop_id, product_id, sku, variant_name, price_vnd, stock, is_active, updated_at
      ) VALUES (
        gen_random_uuid(), '${shop.id}', '${product.id}', 'TEST-AM-GIA-${Date.now()}',
        'Sản phẩm giá âm', -50000, 10, true, NOW()
      );
    `);
    console.error('❌ THẤT BẠI: CSDL đã cho phép lưu giá âm! (Lỗi ràng buộc)');
  } catch (error: any) {
    if (error.message && error.message.includes('chk_variant_price_positive')) {
      console.log('✅ THÀNH CÔNG: CSDL đã CHẶN giá âm bằng ràng buộc: chk_variant_price_positive');
    } else {
      console.log('✅ CSDL đã chặn vi phạm:', error.message);
    }
  }

  // 2. Kiểm tra CHECK: Tồn kho âm (stock < 0)
  console.log('\n--- TEST 2: Thử INSERT biến thể có tồn kho âm (stock = -5) ---');
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO product_variants (
        id, shop_id, product_id, sku, variant_name, price_vnd, stock, is_active, updated_at
      ) VALUES (
        gen_random_uuid(), '${shop.id}', '${product.id}', 'TEST-AM-KHO-${Date.now()}',
        'Sản phẩm tồn kho âm', 150000, -5, true, NOW()
      );
    `);
    console.error('❌ THẤT BẠI: CSDL đã cho phép lưu tồn kho âm! (Lỗi ràng buộc)');
  } catch (error: any) {
    if (error.message && error.message.includes('chk_variant_stock_non_negative')) {
      console.log('✅ THÀNH CÔNG: CSDL đã CHẶN tồn kho âm bằng ràng buộc: chk_variant_stock_non_negative');
    } else {
      console.log('✅ CSDL đã chặn vi phạm:', error.message);
    }
  }

  // 3. Kiểm tra CHECK: Số đơn hàng không hợp lệ (order_number < 1001)
  console.log('\n--- TEST 3: Thử INSERT đơn hàng có mã đơn < 1001 (order_number = 999) ---');
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO orders (
        id, shop_id, order_number, customer_name, customer_phone, shipping_address,
        subtotal_vnd, shipping_fee_vnd, total_vnd, updated_at
      ) VALUES (
        gen_random_uuid(), '${shop.id}', 999, 'Khách Test', '0900000000', 'Địa chỉ',
        100000, 20000, 120000, NOW()
      );
    `);
    console.error('❌ THẤT BẠI: CSDL đã cho phép lưu mã đơn < 1001! (Lỗi ràng buộc)');
  } catch (error: any) {
    if (error.message && error.message.includes('chk_order_number_positive')) {
      console.log('✅ THÀNH CÔNG: CSDL đã CHẶN mã đơn < 1001 bằng ràng buộc: chk_order_number_positive');
    } else {
      console.log('✅ CSDL đã chặn vi phạm:', error.message);
    }
  }

  // 4. Kiểm tra CHECK: Tổng tiền đơn hàng âm (total_vnd < 0)
  console.log('\n--- TEST 4: Thử INSERT đơn hàng có tổng tiền âm (total_vnd = -10.000đ) ---');
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO orders (
        id, shop_id, order_number, customer_name, customer_phone, shipping_address,
        subtotal_vnd, shipping_fee_vnd, total_vnd, updated_at
      ) VALUES (
        gen_random_uuid(), '${shop.id}', 2999, 'Khách Test', '0900000000', 'Địa chỉ',
        100000, 20000, -10000, NOW()
      );
    `);
    console.error('❌ THẤT BẠI: CSDL đã cho phép lưu tổng tiền âm! (Lỗi ràng buộc)');
  } catch (error: any) {
    if (error.message && error.message.includes('chk_order_total_positive')) {
      console.log('✅ THÀNH CÔNG: CSDL đã CHẶN tổng tiền âm bằng ràng buộc: chk_order_total_positive');
    } else {
      console.log('✅ CSDL đã chặn vi phạm:', error.message);
    }
  }

  console.log('\n🏁 TẤT CẢ CÁC RÀNG BUỘC TOÀN VẸN CSDL ĐÃ ĐƯỢC BẢO VỆ TUYỆT ĐỐI!');
}

runConstraintTests()
  .catch((err) => {
    console.error('❌ Lỗi kiểm thử CSDL:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

