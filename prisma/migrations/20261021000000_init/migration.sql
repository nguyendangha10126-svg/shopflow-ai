-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'STAFF');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('CLIPBOARD', 'MANUAL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'TRIAL');

-- CreateTable
CREATE TABLE "shops" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_counters" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "last_order_number" INTEGER NOT NULL DEFAULT 1000,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "shop_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "price_vnd" INTEGER NOT NULL DEFAULT 0,
    "max_products" INTEGER NOT NULL DEFAULT 20,
    "max_orders_per_month" INTEGER NOT NULL DEFAULT 30,
    "max_ai_drafts_per_month" INTEGER NOT NULL DEFAULT 30,
    "max_ai_faq_per_month" INTEGER NOT NULL DEFAULT 50,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "starts_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "category" VARCHAR(100),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "sku" VARCHAR(100) NOT NULL,
    "variant_name" VARCHAR(150) NOT NULL,
    "size" VARCHAR(30),
    "color" VARCHAR(50),
    "price_vnd" INTEGER NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 5,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "address" TEXT,
    "total_spent_vnd" BIGINT NOT NULL DEFAULT 0,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "order_number" INTEGER NOT NULL,
    "customer_id" UUID,
    "customer_name" VARCHAR(100) NOT NULL,
    "customer_phone" VARCHAR(20) NOT NULL,
    "shipping_address" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "source" "OrderSource" NOT NULL DEFAULT 'CLIPBOARD',
    "subtotal_vnd" INTEGER NOT NULL DEFAULT 0,
    "shipping_fee_vnd" INTEGER NOT NULL DEFAULT 0,
    "discount_vnd" INTEGER NOT NULL DEFAULT 0,
    "total_vnd" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_variant_id" UUID NOT NULL,
    "snap_product_name" VARCHAR(200) NOT NULL,
    "snap_variant_name" VARCHAR(150) NOT NULL,
    "snap_sku" VARCHAR(100) NOT NULL,
    "snap_price_vnd" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "subtotal_vnd" INTEGER NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "from_status" "OrderStatus" NOT NULL,
    "to_status" "OrderStatus" NOT NULL,
    "changed_by" UUID,
    "reason" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_ai_meta" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "raw_anonymized_message" TEXT NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "warning_flags" JSONB NOT NULL DEFAULT '[]',
    "ai_response_json" JSONB NOT NULL,
    "needs_clarification" BOOLEAN NOT NULL DEFAULT false,
    "questions_for_staff" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draft_ai_meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_documents" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content_type" VARCHAR(50) NOT NULL DEFAULT 'POLICIES',
    "raw_text" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "faq_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_chunks" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "chunk_index" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faq_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_logs" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "user_id" UUID,
    "feature" VARCHAR(50) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "latency_ms" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(30) NOT NULL,
    "error_code" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(100) NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shop_counters_shop_id_key" ON "shop_counters"("shop_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_shop_id_role_idx" ON "users"("shop_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

-- CreateIndex
CREATE INDEX "subscriptions_shop_id_status_idx" ON "subscriptions"("shop_id", "status");

-- CreateIndex
CREATE INDEX "products_shop_id_is_active_idx" ON "products"("shop_id", "is_active");

-- CreateIndex
CREATE INDEX "product_variants_shop_id_stock_idx" ON "product_variants"("shop_id", "stock");

-- CreateIndex
CREATE INDEX "product_variants_shop_id_product_id_idx" ON "product_variants"("shop_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_shop_id_sku_key" ON "product_variants"("shop_id", "sku");

-- CreateIndex
CREATE INDEX "customers_shop_id_created_at_idx" ON "customers"("shop_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "customers_shop_id_phone_key" ON "customers"("shop_id", "phone");

-- CreateIndex
CREATE INDEX "orders_shop_id_status_created_at_idx" ON "orders"("shop_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "orders_shop_id_customer_id_idx" ON "orders"("shop_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_shop_id_order_number_key" ON "orders"("shop_id", "order_number");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_product_variant_id_idx" ON "order_items"("product_variant_id");

-- CreateIndex
CREATE INDEX "order_status_history_order_id_created_at_idx" ON "order_status_history"("order_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "draft_ai_meta_order_id_key" ON "draft_ai_meta"("order_id");

-- CreateIndex
CREATE INDEX "faq_documents_shop_id_is_active_idx" ON "faq_documents"("shop_id", "is_active");

-- CreateIndex
CREATE INDEX "faq_chunks_shop_id_idx" ON "faq_chunks"("shop_id");

-- CreateIndex
CREATE INDEX "faq_chunks_document_id_idx" ON "faq_chunks"("document_id");

-- CreateIndex
CREATE INDEX "ai_logs_shop_id_created_at_idx" ON "ai_logs"("shop_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_shop_id_created_at_idx" ON "audit_logs"("shop_id", "created_at");

-- AddForeignKey
ALTER TABLE "shop_counters" ADD CONSTRAINT "shop_counters_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_ai_meta" ADD CONSTRAINT "draft_ai_meta_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq_documents" ADD CONSTRAINT "faq_documents_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq_chunks" ADD CONSTRAINT "faq_chunks_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq_chunks" ADD CONSTRAINT "faq_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "faq_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_logs" ADD CONSTRAINT "ai_logs_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_logs" ADD CONSTRAINT "ai_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;



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
