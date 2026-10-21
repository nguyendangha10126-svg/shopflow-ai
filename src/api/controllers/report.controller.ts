import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../../services/report.service';

const reportService = new ReportService();

export class ReportController {
  async getRevenueReport(req: Request, res: Response, next: NextFunction) {
    try {
      const days = parseInt(req.query.days as string, 10) || 30;
      const data = await reportService.getDailyRevenue(req.user!.shopId, days);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  async getTopProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 5;
      const data = await reportService.getTopSellingProducts(req.user!.shopId, limit);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  async getLowStockVariants(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportService.getLowStockVariants(req.user!.shopId);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  async getUsageReport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportService.getUsageReport(req.user!.shopId);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }
}

