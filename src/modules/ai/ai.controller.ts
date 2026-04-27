import { Request, Response, NextFunction } from 'express';
import { AiService } from './ai.service';
import { AiEngineService } from './ai-engine.service';
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
  },
  
  async generateContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { idea, platforms, tone, post_type, model, language, level } = req.body;
      const results = await AiEngineService.generateForPlatforms(
        req.user!.id,
        platforms,
        idea,
        tone,
        post_type,
        model,
        level || 'MEDIUM'
      );
      res.status(200).json(successResponse(results));
    } catch (error) {
      next(error);
    }
  }
};
