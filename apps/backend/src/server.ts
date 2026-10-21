import app from './app';
import { env } from './config/env';
import { logger } from './core/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 [Backend C3] Máy chủ ShopFlow đang chạy tại: http://localhost:${env.PORT}`);
  logger.info(`🩺 Health check: http://localhost:${env.PORT}/api/v1/health`);
  logger.info(`🛡️ Môi trường: ${env.NODE_ENV} | Giới hạn Body: 1MB | CORS: ${env.FRONTEND_URL}`);
});

export default app;
export { server };
