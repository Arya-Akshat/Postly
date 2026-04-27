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
  },

  async getPostById(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await PostsService.getById(req.user!.id, req.params.id);
      res.status(200).json(successResponse(post));
    } catch (error) {
      next(error);
    }
  },

  async schedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId, scheduledAt } = req.body;
      await PostsService.schedule(req.user!.id, postId, new Date(scheduledAt));
      res.status(200).json(successResponse({ message: 'Post scheduled' }));
    } catch (error) {
      next(error);
    }
  },

  async retry(req: Request, res: Response, next: NextFunction) {
    try {
      await PostsService.retry(req.user!.id, req.params.id);
      res.status(200).json(successResponse({ message: 'Retry triggered' }));
    } catch (error) {
      next(error);
    }
  }
};
