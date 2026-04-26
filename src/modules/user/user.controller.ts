import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { successResponse } from '../../utils/response';

export const UserController = {
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.updateProfile(req.user!.id, req.body);
      res.status(200).json(successResponse(user));
    } catch (error) {
      next(error);
    }
  }
};
