import { Request, Response, NextFunction } from 'express';
import { PostsService } from './posts.service';
import { successResponse } from '../../utils/response';

export const PostsController = {
  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      await PostsService.publish(req.user!.id, req.body.postId);
      res.status(200).json(successResponse({ message: 'Queued for publishing' }));
    } catch (error) {
      next(error);
    }
  },

  async getPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await PostsService.getPosts(req.user!.id, page, limit);
      res.status(200).json(successResponse(data.posts, data.meta));
    } catch (error) {
      next(error);
    }
  },

  async deletePost(req: Request, res: Response, next: NextFunction) {
    try {
      await PostsService.softDelete(req.user!.id, req.params.id);
      res.status(200).json(successResponse({ message: 'Post deleted' }));
    } catch (error) {
      next(error);
    }
  },

  async restorePost(req: Request, res: Response, next: NextFunction) {
    try {
      await PostsService.restore(req.user!.id, req.params.id);
      res.status(200).json(successResponse({ message: 'Post restored' }));
    } catch (error) {
      next(error);
    }
  }
};
