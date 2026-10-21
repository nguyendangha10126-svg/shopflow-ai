import app from './app';
import { env } from './config/env';
import { prisma } from './infrastructure/database/prisma';

const server = app.listen(env.PORT, () => {
  console.log('====================================================');
  console.log(`🚀 ShopFlow AI Backend Server đang chạy!`);
  console.log(`📡 URL: http://localhost:${env.PORT}/api/v1`);
  console.log(`🩺 Health Check: http://localhost:${env.PORT}/api/v1/health`);
  console.log(`🌍 Môi trường: ${env.NODE_ENV}`);
  console.log(`🤖 AI Provider: ${env.AI_PROVIDER}`);
  console.log('====================================================');
});

// Xử lý dừng máy chủ an toàn (Graceful Shutdown)
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Nhận tín hiệu ${signal}. Đang đóng các kết nối an toàn...`);
  
  server.close(async () => {
    console.log('✅ HTTP server đã dừng tiếp nhận kết nối mới.');
    try {
      await prisma.$disconnect();
      console.log('✅ Đã ngắt kết nối PostgreSQL an toàn.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Lỗi khi ngắt kết nối cơ sở dữ liệu:', err);
      process.exit(1);
    }
  });

  // Ép buộc dừng sau 10 giây nếu các kết nối bị treo
  setTimeout(() => {
    console.error('⚠️ Đóng quá thời gian quy định (10s), buộc dừng tiến trình.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

