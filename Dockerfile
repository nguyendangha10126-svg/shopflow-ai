# ==============================================================================
# SHOPFLOW AI - DOCKERFILE CHÍNH (BACKEND EXPRESS MULTI-STAGE ALPINE)
# Dùng cho các nền tảng PaaS (Render, Railway, Fly.io) triển khai trực tiếp từ root
# ==============================================================================

# ------------------------------------------------------------------------------
# GIAI ĐOẠN 1: BUILDER (Biên dịch TypeScript & Sinh mã Prisma)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Cài đặt công cụ hệ thống cần thiết cho native modules
RUN apk add --no-cache libc6-compat python3 make g++

# Sao chép file cấu hình Monorepo và Prisma Schema
COPY package*.json ./
COPY tsconfig.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/
COPY prisma ./prisma/
COPY apps/backend/tsconfig.json ./apps/backend/

# Cài đặt toàn bộ dependencies (bao gồm devDependencies để biên dịch)
RUN npm ci

# Sinh mã Prisma Client cho Linux Alpine
RUN npx prisma generate --schema=prisma/schema.prisma

# Sao chép mã nguồn Backend
COPY apps/backend/src ./apps/backend/src/

# Biên dịch mã nguồn Backend TypeScript -> JavaScript thuần
RUN npm run build --workspace=apps/backend

# Loại bỏ devDependencies để thu nhỏ kích thước node_modules
RUN npm prune --production

# ------------------------------------------------------------------------------
# GIAI ĐOẠN 2: RUNNER (Môi trường Runtime Siêu Nhẹ & Bảo Mật)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Cấu hình biến môi trường chuẩn Production
ENV NODE_ENV=production
ENV PORT=5000

# Cài đặt dumb-init và curl để xử lý tín hiệu SIGTERM/SIGINT và Healthcheck
RUN apk add --no-cache dumb-init curl

# Chạy với quyền người dùng không đặc quyền (Non-root user)
USER node

# Sao chép các tệp thực thi từ giai đoạn Builder
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/apps/backend/package*.json ./apps/backend/
COPY --chown=node:node --from=builder /app/node_modules ./node_modules/
COPY --chown=node:node --from=builder /app/apps/backend/dist ./apps/backend/dist/
COPY --chown=node:node --from=builder /app/prisma ./prisma/

# Cổng lắng nghe
EXPOSE 5000

# Healthcheck định kỳ 20 giây một lần
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/healthz || exit 1

# Khởi chạy ứng dụng qua dumb-init để graceful shutdown an toàn
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "apps/backend/dist/server.js"]
