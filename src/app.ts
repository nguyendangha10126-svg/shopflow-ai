import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env';
import { apiRateLimiter } from './api/middlewares/rate-limiter.middleware';
import { errorMiddleware } from './api/middlewares/error.middleware';
import { NotFoundError } from './core/errors/app-error';
import healthRoutes from './api/routes/health.routes';
import authRoutes from './api/routes/auth.routes';
import productRoutes from './api/routes/product.routes';
import orderRoutes from './api/routes/order.routes';
import aiRoutes from './api/routes/ai.routes';
import faqRoutes from './api/routes/faq.routes';
import reportRoutes from './api/routes/report.routes';
import usageRoutes from './api/routes/usage.routes';

const app: Application = express();

// 1. Bảo mật HTTP Headers (Helmet - cho phép phục vụ static UI)
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

// 2. Cấu hình CORS cho phép Frontend truy cập kèm Credentials (Cookie)
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key']
  })
);

// 3. Phân tích Cookies và JSON Body
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 4. Phục vụ giao diện người dùng tĩnh (Frontend Single Page App)
app.use(express.static(path.join(__dirname, '../public')));

// 5. Rate Limiting toàn cục cho các API
app.use('/api', apiRateLimiter);

// 6. Mount API Routes phiên bản v1
app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/faq-documents', faqRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/usage', usageRoutes);

// 7. Xử lý Route không tồn tại (404 Handler)
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(
    new NotFoundError(
      'ROUTE_NOT_FOUND',
      `Endpoint không tồn tại: [${req.method}] ${req.originalUrl}`
    )
  );
});

// 8. Middleware xử lý lỗi tập trung chuẩn thống nhất
app.use(errorMiddleware);

export default app;
