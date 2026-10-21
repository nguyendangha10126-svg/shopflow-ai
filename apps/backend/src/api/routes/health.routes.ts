import { Router, Request, Response } from 'express';
import { prisma } from '../../db';

const router = Router();
const startTime = Date.now();

/**
 * 1. Liveness Probe: Kiểm tra tiến trình Node.js còn sống
 * Endpoint: GET /health hoặc GET /healthz hoặc GET /api/v1/health
 */
router.get(['/health', '/healthz'], async (_req: Request, res: Response) => {
  let dbStatus = 'unreachable';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'unreachable';
  }

  res.status(200).json({
    status: 'healthy',
    service: 'shopflow-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    database: dbStatus,
  });
});

/**
 * 2. Readiness Probe: Kiểm tra cơ sở dữ liệu đã sẵn sàng nhận traffic hay chưa
 * Endpoint: GET /ready hoặc GET /readyz hoặc GET /api/v1/ready
 */
router.get(['/ready', '/readyz'], async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'not_ready',
      database: 'unreachable',
      error: 'Cơ sở dữ liệu PostgreSQL chưa sẵn sàng kết nối',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * 3. Greeting & Service Info
 */
router.get('/hello', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Hello from ShopFlow AI Backend!',
    service: 'shopflow-backend',
    version: '1.0.0',
  });
});

export default router;
