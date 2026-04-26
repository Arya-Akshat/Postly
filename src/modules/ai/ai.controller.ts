import { Request, Response, NextFunction } from 'express';
import { AiService } from './ai.service';
import { successResponse } from '../../utils/response';

export const AiController = {
  async updateKeys(req: Request, res: Response, next: NextFunction) {
    try {
      await AiService.updateKeys(req.user!.id, req.body);
      res.status(200).json(successResponse({ message: 'AI keys updated successfully' }));
    } catch (error) {
      next(error);
    }
  },

  async getKeysStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await AiService.getKeysStatus(req.user!.id);
      res.status(200).json(successResponse(status));
    } catch (error) {
      next(error);
    }
  }
};
