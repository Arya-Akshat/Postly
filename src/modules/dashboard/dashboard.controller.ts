import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { successResponse } from '../../utils/response';

export const DashboardController = {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await DashboardService.getStats(req.user!.id);
      res.status(200).json(successResponse(stats));
    } catch (error) {
      next(error);
    }
  }
};
