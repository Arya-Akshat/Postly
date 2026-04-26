import { Request, Response, NextFunction } from 'express';
import { SocialService } from './social.service';
import { successResponse } from '../../utils/response';

export const SocialController = {
  async connectAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const account = await SocialService.connectAccount(req.user!.id, req.body);
      res.status(200).json(successResponse({ accountId: account.id, platform: account.platform }));
    } catch (error) {
      next(error);
    }
  },

  async getAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const accounts = await SocialService.getAccounts(req.user!.id);
      res.status(200).json(successResponse(accounts));
    } catch (error) {
      next(error);
    }
  },

  async disconnectAccount(req: Request, res: Response, next: NextFunction) {
    try {
      await SocialService.disconnectAccount(req.user!.id, req.params.id);
      res.status(200).json(successResponse({ message: 'Account disconnected' }));
    } catch (error) {
      next(error);
    }
  }
};
