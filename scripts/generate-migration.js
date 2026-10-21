const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Generating Prisma SQL from schema.prisma...');
const prismaSql = execSync('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script', { encoding: 'utf-8' });

const customConstraints = `
-- ====================================================================
-- BỔ SUNG: RÀNG BUỘC TOÀN VẸN, EXTENSIONS & FULL-TEXT SEARCH
-- ====================================================================

-- 1. Bật Extensions hỗ trợ tìm kiếm tiếng Việt và mờ
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Hàm loại bỏ dấu tiếng Việt chuẩn hóa (IMMUTABLE phục vụ Indexing)
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text AS $$
  SELECT public.unaccent('public.unaccent', $1);
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

-- 3. RÀNG BUỘC KIỂM TRA (CHECK CONSTRAINTS)
ALTER TABLE product_variants
  ADD CONSTRAINT chk_variant_price_positive CHECK (price_vnd >= 0),
  ADD CONSTRAINT chk_variant_stock_non_negative CHECK (stock >= 0),
  ADD CONSTRAINT chk_variant_low_stock_non_negative CHECK (low_stock_threshold >= 0);

ALTER TABLE order_items
  ADD CONSTRAINT chk_order_item_quantity_positive CHECK (quantity > 0),
  ADD CONSTRAINT chk_order_item_price_positive CHECK (snap_price_vnd >= 0),
  ADD CONSTRAINT chk_order_item_subtotal_positive CHECK (subtotal_vnd >= 0);

ALTER TABLE orders
  ADD CONSTRAINT chk_order_number_positive CHECK (order_number >= 1001),
  ADD CONSTRAINT chk_order_subtotal_positive CHECK (subtotal_vnd >= 0),
  ADD CONSTRAINT chk_order_shipping_fee_positive CHECK (shipping_fee_vnd >= 0),
  ADD CONSTRAINT chk_order_discount_positive CHECK (discount_vnd >= 0),
  ADD CONSTRAINT chk_order_total_positive CHECK (total_vnd >= 0);

ALTER TABLE shop_counters
  ADD CONSTRAINT chk_counter_last_order_positive CHECK (last_order_number >= 1000);

-- 4. CHỈ MỤC MỘT PHẦN (PARTIAL UNIQUE INDEXES)
DROP INDEX IF EXISTS idx_product_variants_shop_sku;
CREATE UNIQUE INDEX IF NOT EXISTS uq_variants_shop_sku_active 
  ON product_variants(shop_id, sku) 
  WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS idx_customers_shop_phone;
CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_shop_phone_active 
  ON customers(shop_id, phone) 
  WHERE deleted_at IS NULL;

-- 5. CHỈ MỤC TÌM KIẾM TOÀN VĂN TIẾNG VIỆT (FULL-TEXT SEARCH & TRIGRAM)
ALTER TABLE faq_chunks 
  ADD COLUMN IF NOT EXISTS search_tsv tsvector 
  GENERATED ALWAYS AS (to_tsvector('simple', public.immutable_unaccent(content))) STORED;

CREATE INDEX IF NOT EXISTS idx_faq_chunks_search_tsv 
  ON faq_chunks USING gin(search_tsv);

CREATE INDEX IF NOT EXISTS idx_products_name_trgm 
  ON products USING gin(public.immutable_unaccent(name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_variants_name_trgm 
  ON product_variants USING gin(public.immutable_unaccent(variant_name) gin_trgm_ops);
`;

const fullSql = prismaSql + '\n' + customConstraints;
const targetDir = path.join(__dirname, 'prisma', 'migrations', '20261021000000_init');
fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(path.join(targetDir, 'migration.sql'), fullSql, 'utf-8');
console.log('✅ Migration generated successfully at: ' + path.join(targetDir, 'migration.sql'));

