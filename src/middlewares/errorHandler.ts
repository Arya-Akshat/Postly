import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { errorResponse } from '../utils/response';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');

  if (err.name === 'SyntaxError') {
    return res.status(400).json(errorResponse('Invalid JSON payload', 'INVALID_JSON'));
  }

  return res.status(500).json(errorResponse('Internal server error', 'INTERNAL_ERROR'));
};
