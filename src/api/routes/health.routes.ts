import { Router, Request, Response } from 'express';
import { prisma } from '../../infrastructure/database/prisma';

const router = Router();
const startTime = Date.now();

router.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'error';
  }

  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const isHealthy = dbStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    uptime_seconds: uptimeSeconds
  });
});

export default router;

