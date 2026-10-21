import {
  PrismaClient,
  UserRole,
  OrderStatus,
  OrderSource,
  SubscriptionStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu mẫu cho ShopFlow AI...');

  // 1. Tạo Gói dịch vụ (Plans)
  const basicPlan = await prisma.plan.upsert({
    where: { code: 'BASIC' },
    update: {},
    create: {
      name: 'Gói Cơ Bản (Basic)',
      code: 'BASIC',
      price_vnd: 79000,
      max_products: 200,
      max_orders_per_month: 300,
      max_ai_drafts_per_month: 300,
      max_ai_faq_per_month: 300,
    },
  });

  // 2. Tạo Cửa hàng Demo (Shop: Mây Boutique)
  const shop = await prisma.shop.upsert({
    where: { id: 'a0000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Mây Boutique - Thời Trang Nữ',
      phone: '0903123456',
    },
  });

  // Khởi tạo bảng đếm thứ tự đơn hàng nguyên tử (QĐ-04)
  await prisma.shopCounter.upsert({
    where: { shop_id: shop.id },
    update: { last_order_number: 1015 },
    create: {
      shop_id: shop.id,
      last_order_number: 1015,
    },
  });

  // 3. Tạo Đăng ký Gói (Subscription)
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  await prisma.subscription.create({
    data: {
      shop_id: shop.id,
      plan_id: basicPlan.id,
      status: SubscriptionStatus.ACTIVE,
      expires_at: expiresAt,
    },
  });

  // 4. Tạo Tài khoản Người dùng (Chủ shop & Nhân viên)
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('ShopFlow@123', salt);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@mayboutique.vn' },
    update: {},
    create: {
      shop_id: shop.id,
      email: 'owner@mayboutique.vn',
      password_hash: passwordHash,
      full_name: 'Nguyễn Thùy Linh',
      role: UserRole.OWNER,
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff@mayboutique.vn' },
    update: {},
    create: {
      shop_id: shop.id,
      email: 'staff@mayboutique.vn',
      password_hash: passwordHash,
      full_name: 'Trần Quốc Tuấn',
      role: UserRole.STAFF,
    },
  });

  // 5. Tạo 20 Sản phẩm có biến thể (Thời trang nữ)
  const productsData = [
    {
      name: 'Áo sơ mi lụa trắng dài tay',
      sku: 'SOMI-LUA-TRANG',
      price: 250000,
      sizes: ['S', 'M', 'L'],
      color: 'Trắng',
    },
    {
      name: 'Đầm hoa nhí đỏ vintage',
      sku: 'VAY-HOA-DO',
      price: 320000,
      sizes: ['S', 'M', 'L'],
      color: 'Đỏ',
    },
    {
      name: 'Quần jean ống rộng xanh nhạt',
      sku: 'JEAN-RONG-XANH',
      price: 290000,
      sizes: ['26', '27', '28', '29'],
      color: 'Xanh',
    },
    {
      name: 'Áo thun cotton basic đen',
      sku: 'THUN-COTTON-DEN',
      price: 150000,
      sizes: ['M', 'L', 'XL'],
      color: 'Đen',
    },
    {
      name: 'Áo thun cotton basic trắng',
      sku: 'THUN-COTTON-TRANG',
      price: 150000,
      sizes: ['M', 'L', 'XL'],
      color: 'Trắng',
    },
    {
      name: 'Chân váy chữ A dáng ngắn đen',
      sku: 'VAY-CHU-A-DEN',
      price: 180000,
      sizes: ['S', 'M', 'L'],
      color: 'Đen',
    },
    {
      name: 'Set đồ ngủ lụa cộc tay hồng phấn',
      sku: 'SET-LUA-NGU-HONG',
      price: 220000,
      sizes: ['M', 'L'],
      color: 'Hồng',
    },
    {
      name: 'Áo khoác blazer dạ be Hàn Quốc',
      sku: 'BLAZER-DA-BE',
      price: 450000,
      sizes: ['S', 'M'],
      color: 'Be',
    },
    {
      name: 'Quần tây baggy công sở đen',
      sku: 'BAGGY-TAY-DEN',
      price: 260000,
      sizes: ['S', 'M', 'L'],
      color: 'Đen',
    },
    {
      name: 'Váy suông cổ yếm lụa hoa nhí',
      sku: 'VAY-SUONG-HOA',
      price: 280000,
      sizes: ['Freesize'],
      color: 'Hoa nhí',
    },
    {
      name: 'Áo croptop cổ vuông tay bồng',
      sku: 'CROP-VUONG-TRANG',
      price: 160000,
      sizes: ['S', 'M'],
      color: 'Trắng',
    },
    {
      name: 'Chân váy xếp ly dáng dài nâu tây',
      sku: 'VAY-XEP-LY-NAU',
      price: 240000,
      sizes: ['S', 'M'],
      color: 'Nâu',
    },
    {
      name: 'Áo len tăm cổ 3 phân đen',
      sku: 'LEN-TAM-DEN',
      price: 170000,
      sizes: ['Freesize'],
      color: 'Đen',
    },
    {
      name: 'Quần short jean rách gấu xanh',
      sku: 'SHORT-JEAN-XANH',
      price: 190000,
      sizes: ['S', 'M', 'L'],
      color: 'Xanh',
    },
    {
      name: 'Váy ren trắng dự tiệc tay nhún',
      sku: 'VAY-REN-TRANG',
      price: 380000,
      sizes: ['S', 'M'],
      color: 'Trắng',
    },
    {
      name: 'Áo sơ mi cổ đức lụa xanh mint',
      sku: 'SOMI-LUA-MINT',
      price: 250000,
      sizes: ['S', 'M', 'L'],
      color: 'Xanh mint',
    },
    {
      name: 'Đầm babydoll tay phồng hoa cúc',
      sku: 'VAY-BABYDOLL-VANG',
      price: 270000,
      sizes: ['Freesize'],
      color: 'Vàng',
    },
    {
      name: 'Áo cardigan len dệt kim mỏng be',
      sku: 'CARDIGAN-LEN-BE',
      price: 210000,
      sizes: ['Freesize'],
      color: 'Be',
    },
    {
      name: 'Quần ống loe cạp cao đen tôn dáng',
      sku: 'QUAN-LOE-DEN',
      price: 280000,
      sizes: ['S', 'M', 'L'],
      color: 'Đen',
    },
    {
      name: 'Váy hai dây hoa nhí xẻ tà xanh',
      sku: 'VAY-2DAY-XANH',
      price: 290000,
      sizes: ['S', 'M'],
      color: 'Xanh',
    },
  ];

  for (const p of productsData) {
    const product = await prisma.product.create({
      data: {
        shop_id: shop.id,
        name: p.name,
        category: 'Thời trang nữ',
      },
    });

    for (const size of p.sizes) {
      await prisma.productVariant.create({
        data: {
          shop_id: shop.id,
          product_id: product.id,
          sku: `${p.sku}-${size}`,
          variant_name: `${p.name} (${size})`,
          size: size,
          color: p.color,
          price_vnd: p.price,
          stock: size === 'L' ? 1 : 10, // Một số size cố tình để tồn ít để test cảnh báo
          low_stock_threshold: 3,
        },
      });
    }
  }

  // 6. Tạo 10 Khách hàng (PII)
  const customersData = [
    {
      name: 'Nguyễn Phương Lan',
      phone: '0903123456',
      address: '45 Lê Lợi, P. Bến Nghé, Quận 1, TP.HCM',
    },
    {
      name: 'Trần Hoàng Mai',
      phone: '0912334455',
      address: '88 Nguyễn Thị Minh Khai, Hải Châu, Đà Nẵng',
    },
    { name: 'Lê Thu Thảo', phone: '0988776655', address: 'Ngõ 150 Triều Khúc, Thanh Trì, Hà Nội' },
    {
      name: 'Phạm Hồng Nhung',
      phone: '0977112233',
      address: 'Tòa Keangnam, Phạm Hùng, Nam Từ Liêm, Hà Nội',
    },
    { name: 'Vũ Minh Hạnh', phone: '0945667788', address: '12 Chùa Bộc, Đống Đa, Hà Nội' },
    { name: 'Đặng Thùy Dương', phone: '0966554433', address: '15 Quang Trung, Hà Đông, Hà Nội' },
    {
      name: 'Hoàng Bích Ngọc',
      phone: '0988111222',
      address: '90 Hoàng Quốc Việt, Cầu Giấy, Hà Nội',
    },
    {
      name: 'Bùi Thanh Trúc',
      phone: '0909123789',
      address: 'Số 5 Đinh Tiên Hoàng, Quận 1, TP.HCM',
    },
    { name: 'Ngô Mỹ Linh', phone: '0914556677', address: '22 Tôn Đức Thắng, Đống Đa, Hà Nội' },
    { name: 'Đỗ Cẩm Vân', phone: '0933221100', address: '18 Tam Trinh, Hoàng Mai, Hà Nội' },
  ];

  const createdCustomers = [];
  for (const c of customersData) {
    const cust = await prisma.customer.create({
      data: {
        shop_id: shop.id,
        name: c.name,
        phone: c.phone,
        address: c.address,
      },
    });
    createdCustomers.push(cust);
  }

  // 7. Tạo 15 Đơn hàng với đầy đủ trạng thái (#1001 đến #1015)
  const variants = await prisma.productVariant.findMany({ where: { shop_id: shop.id } });

  const statuses = [
    OrderStatus.CONFIRMED,
    OrderStatus.CONFIRMED,
    OrderStatus.PENDING_REVIEW,
    OrderStatus.PENDING_REVIEW,
    OrderStatus.SHIPPING,
    OrderStatus.SHIPPING,
    OrderStatus.DELIVERED,
    OrderStatus.DELIVERED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
    OrderStatus.RETURNED,
    OrderStatus.CONFIRMED,
    OrderStatus.PENDING_REVIEW,
    OrderStatus.DELIVERED,
    OrderStatus.CONFIRMED,
  ];

  for (let i = 0; i < 15; i++) {
    const orderNumber = 1001 + i;
    const cust = createdCustomers[i % createdCustomers.length];
    const v = variants[i % variants.length];
    const status = statuses[i];

    const subtotal = v.price_vnd;
    const shipping = 20000;
    const total = subtotal + shipping;

    const order = await prisma.order.create({
      data: {
        shop_id: shop.id,
        order_number: orderNumber,
        customer_id: cust.id,
        customer_name: cust.name,
        customer_phone: cust.phone,
        shipping_address: cust.address || '',
        status: status,
        source: OrderSource.CLIPBOARD,
        subtotal_vnd: subtotal,
        shipping_fee_vnd: shipping,
        discount_vnd: 0,
        total_vnd: total,
        created_by: owner.id,
        items: {
          create: [
            {
              product_variant_id: v.id,
              snap_product_name: v.variant_name,
              snap_variant_name: v.size || 'M',
              snap_sku: v.sku,
              snap_price_vnd: v.price_vnd,
              quantity: 1,
              subtotal_vnd: v.price_vnd,
            },
          ],
        },
        status_history: {
          create: [
            {
              from_status: OrderStatus.DRAFT,
              to_status: status,
              changed_by: owner.id,
              reason: 'Khởi tạo đơn hàng từ seed dữ liệu',
            },
          ],
        },
      },
    });

    // Nếu đơn ở trạng thái PENDING_REVIEW, tạo kèm DraftAiMeta
    if (status === OrderStatus.PENDING_REVIEW) {
      await prisma.draftAiMeta.create({
        data: {
          order_id: order.id,
          raw_anonymized_message: `Ship cho mình 1 ${v.variant_name} về ${cust.address}, SĐT [PHONE_1]`,
          confidence_score: 0.92,
          ai_response_json: {
            extracted_name: cust.name,
            matched_sku: v.sku,
            quantity: 1,
          },
        },
      });
    }
  }

  // 8. Tạo Tài liệu Chính sách FAQ & Băm Chunks
  const faqDoc = await prisma.faqDocument.create({
    data: {
      shop_id: shop.id,
      title: 'Chính sách Bán hàng & Đổi trả Shop Mây',
      raw_text:
        'Khách hàng được kiểm tra hàng trước khi thanh toán. Đổi size trong vòng 3 ngày kể từ ngày nhận. Phí ship đổi size khách chịu 30.000đ. Đơn hàng từ 500.000đ được miễn phí vận chuyển.',
    },
  });

  await prisma.faqChunk.createMany({
    data: [
      {
        shop_id: shop.id,
        document_id: faqDoc.id,
        chunk_index: 0,
        content:
          'Khách hàng được quyền kiểm tra hàng (đồng kiểm) trước khi thanh toán tiền cho shipper.',
      },
      {
        shop_id: shop.id,
        document_id: faqDoc.id,
        chunk_index: 1,
        content:
          'Chính sách đổi size: Hỗ trợ đổi size trong vòng 3 ngày kể từ khi nhận hàng. Sản phẩm phải còn nguyên tem mác. Phí ship đổi 2 chiều khách hỗ trợ 30.000đ.',
      },
      {
        shop_id: shop.id,
        document_id: faqDoc.id,
        chunk_index: 2,
        content:
          'Chính sách vận chuyển: Phí ship nội thành Hà Nội 20.000đ, ngoại thành và các tỉnh 30.000đ. Đơn hàng từ 500.000đ được freeship toàn quốc.',
      },
    ],
  });

  console.log('✅ Seed dữ liệu thành công hoàn tất!');
  console.log(`• Shop: ${shop.name} (${shop.id})`);
  console.log(`• Tài khoản chủ shop: owner@mayboutique.vn / Mật khẩu: ShopFlow@123`);
  console.log(`• Đã tạo 20 sản phẩm, 10 khách hàng, 15 đơn hàng (#1001 -> #1015) và tài liệu FAQ.`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
