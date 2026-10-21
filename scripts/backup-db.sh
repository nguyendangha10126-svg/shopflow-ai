#!/usr/bin/env bash
# ==============================================================================
# SHOPFLOW AI - TẬP LỆNH SAO LƯU CƠ SỞ DỮ LIỆU ĐỊNH KỲ (BACKUP AUTOMATION)
# ==============================================================================
set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/shopflow_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=7

mkdir -p "${BACKUP_DIR}"

echo "📦 Đang khởi tạo bản sao lưu cơ sở dữ liệu ShopFlow..."

# Sao lưu từ Docker Container hoặc Database URL
if docker ps | grep -q shopflow_postgres; then
  docker exec -t shopflow_postgres pg_dump -U shopflow_user -d shopflow_db | gzip > "${BACKUP_FILE}"
else
  # Sao lưu trực tiếp nếu chạy pg_dump cục bộ
  pg_dump "${DATABASE_URL:-postgresql://shopflow_user:shopflow_password@localhost:5432/shopflow_db}" | gzip > "${BACKUP_FILE}"
fi

echo "✅ Đã tạo thành công bản sao lưu: ${BACKUP_FILE}"
echo "📊 Kích thước: $(du -h "${BACKUP_FILE}" | cut -f1)"

# Dọn dẹp các bản sao lưu cũ quá 7 ngày
echo "🧹 Đang dọn dẹp các bản sao lưu cũ hơn ${RETENTION_DAYS} ngày..."
find "${BACKUP_DIR}" -type f -name "shopflow_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "🎉 Hoàn tất quy trình sao lưu an toàn!"

