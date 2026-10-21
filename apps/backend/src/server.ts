import app from './app';
import { env } from './config/env';
import { logger } from './core/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 [Backend C3] Máy chủ ShopFlow đang chạy tại: http://localhost:${env.PORT}`);
  logger.info(`🩺 Health check: http://localhost:${env.PORT}/api/v1/health`);
  logger.info(`🛡️ Môi trường: ${env.NODE_ENV} | Giới hạn Body: 10MB | CORS: ${env.FRONTEND_URL}`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`❌ Cổng ${env.PORT} đang bị chiếm dụng bởi một tiến trình khác.`);
    logger.error(`👉 Bạn có thể giải phóng cổng 5000 bằng lệnh: npx kill-port 5000`);
    process.exit(1);
  } else {
    logger.error(`❌ Lỗi khởi động máy chủ: ${err.message}`);
    process.exit(1);
  }
});

export default app;
export { server };
