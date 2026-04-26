import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { successResponse, errorResponse } from '../../utils/response';

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AuthService.register(req.body);
      res.status(201).json(successResponse(data));
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json(errorResponse(error.message, 'AUTH_ERROR'));
      } else {
        next(error);
      }
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AuthService.login(req.body);
      res.status(200).json(successResponse(data));
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json(errorResponse(error.message, 'AUTH_ERROR'));
      } else {
        next(error);
      }
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AuthService.refresh(req.body.refreshToken);
      res.status(200).json(successResponse(data));
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json(errorResponse(error.message, 'AUTH_ERROR'));
      } else {
        next(error);
      }
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await AuthService.logout(req.user!.id, req.body.refreshToken);
      res.status(200).json(successResponse({ message: 'Logged out successfully' }));
    } catch (error) {
      next(error);
    }
  },

  async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      await AuthService.logoutAll(req.user!.id);
      res.status(200).json(successResponse({ message: 'Logged out from all devices' }));
    } catch (error) {
      next(error);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getMe(req.user!.id);
      res.status(200).json(successResponse({ user }));
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json(errorResponse(error.message, 'AUTH_ERROR'));
      } else {
        next(error);
      }
    }
  }
};
