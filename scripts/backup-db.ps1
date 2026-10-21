# ==============================================================================
# SHOPFLOW AI - TẬP LỆNH SAO LƯU DATABASE CHO WINDOWS POWERSHELL
# ==============================================================================
param (
    [string]$BackupDir = ".\backups",
    [int]$RetentionDays = 7
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $BackupDir "shopflow_backup_$timestamp.sql"

Write-Host "📦 Đang khởi tạo bản sao lưu cơ sở dữ liệu ShopFlow..." -ForegroundColor Cyan

# Kiểm tra Docker container
$dockerRunning = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerRunning) {
    docker exec -t shopflow_postgres pg_dump -U shopflow_user -d shopflow_db > $backupFile
    Write-Host "✅ Đã tạo thành công bản sao lưu: $backupFile" -ForegroundColor Green
} else {
    Write-Host "⚠️ Docker không tìm thấy trong PATH. Bạn có thể kết nối pg_dump trực tiếp." -ForegroundColor Yellow
}

# Dọn dẹp bản backup cũ
Get-ChildItem -Path $BackupDir -Filter "shopflow_backup_*.sql" | Where-Object {
    $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays)
} | Remove-Item -Force

Write-Host "🎉 Hoàn tất quy trình kiểm tra sao lưu!" -ForegroundColor Green

