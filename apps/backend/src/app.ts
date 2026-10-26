import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { logger } from './core/logger';
import { NotFoundError } from './core/errors/app-error';
import { errorHandler } from './api/middlewares/error.middleware';
import path from 'path';
import healthRoutes from './api/routes/health.routes';
import authRoutes from './api/routes/auth.routes';
import productRoutes from './api/routes/product.routes';
import customerRoutes from './api/routes/customer.routes';
import orderRoutes from './api/routes/order.routes';
import aiRoutes from './api/routes/ai.routes';
import dashboardRoutes from './api/routes/dashboard.routes';
import faqRoutes from './api/routes/faq.routes';
import uploadRoutes from './api/routes/upload.routes';
import testRoutes from './api/routes/test.routes';

const app = express();

// Đứng sau Nginx/Docker: phải tin proxy để req.ip là IP thật của khách (nếu không, mọi người dùng
// bị tính chung 1 IP và dính rate limit cùng nhau).
if (env.TRUST_PROXY > 0) {
  app.set('trust proxy', env.TRUST_PROXY);
}

// 1. HTTP Security Headers
app.use(helmet());

// 2. CORS với Origin linh hoạt cho phát triển và sản xuất
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
];

const isDev = env.NODE_ENV !== 'production';

app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (curl, mobile apps nội bộ, postman, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      // Cho phép các domain cấu hình sẵn
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Trong môi trường development: Cho phép mọi port localhost và 127.0.0.1
      if (isDev && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      callback(new Error(`CORS không cho phép truy cập từ nguồn: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  })
);

// 3. Giới hạn kích thước Body (10MB) hỗ trợ tải ảnh an toàn
// Chỉ route upload ảnh được nhận body lớn (ảnh base64). Mọi route khác giới hạn 200KB để chống tấn công làm đầy RAM.
app.use('/api/v1/upload', express.json({ limit: '8mb' }));
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: true, limit: '200kb' }));

// Phục vụ tệp tĩnh tải lên cục bộ
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// 4. Rate Limiting toàn cục
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi vài phút rồi thử lại',
    },
  },
});
app.use(globalLimiter);

// 5. Middleware ghi nhận nhật ký HTTP requests
const HEALTH_ENDPOINTS = new Set([
  '/health',
  '/healthz',
  '/ready',
  '/readyz',
  '/api/v1/health',
  '/api/v1/healthz',
  '/api/v1/ready',
  '/api/v1/readyz',
]);

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!HEALTH_ENDPOINTS.has(req.originalUrl)) {
      logger.info(
        {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          durationMs: duration,
        },
        `HTTP ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`
      );
    }
  });
  next();
});

// 6. Đăng ký Routes chính thức
app.use(healthRoutes); // Mount /healthz, /readyz ở cấp root cho Docker/K8s/Nginx
app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/faq', faqRoutes);
app.use('/api/v1/upload', uploadRoutes);

// Tuyến đường kiểm thử tự động (chỉ bật ở dev/test)
if (env.NODE_ENV !== 'production') {
  app.use('/api/v1/test', testRoutes);
}

// 7. Xử lý đường dẫn không tồn tại (404 Handler)
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError(`Đường dẫn API '${req.method} ${req.originalUrl}' không tồn tại`));
});

// 8. Error Handler tập trung chuẩn OpenAPI
app.use(errorHandler);

export default app;
