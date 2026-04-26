import pinoHttp from 'pino-http';
import { logger } from '../config/logger';

export const requestLogger = pinoHttp({
  logger,
  customProps: (req, res) => {
    return {
      user_id: (req as any).user?.id,
    };
  },
});
