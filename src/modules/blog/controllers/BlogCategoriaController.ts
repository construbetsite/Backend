// src/modules/blog/controllers/BlogCategoriaController.ts
import { Request, Response } from 'express';
import { BlogCategoriaRepository } from '../repositories/BlogCategoriaRepository';
import {
  getCache,
  setCache,
  generateKey,
  TTL_CATEGORIES,
} from '../../../lib/cache';

const categoriaRepository = new BlogCategoriaRepository();

export class BlogCategoriaController {
  async listarTodas(req: Request, res: Response) {
    try {
      const cacheKey = generateKey('blog_categories:list');
      const cached = getCache<any>(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      console.log('[BlogCategoriaController] Listando categorias...');

      const categorias = await categoriaRepository.listarTodas();

      console.log(`[BlogCategoriaController] ${categorias.length} categorias encontradas`);

      const responsePayload = {
        success: true,
        data: categorias,
      };

      setCache(cacheKey, responsePayload, TTL_CATEGORIES);

      return res.json(responsePayload);
    } catch (error: any) {
      console.error('[BlogCategoriaController] Erro:', error);

      return res.status(500).json({
        success: false,
        message: 'Erro ao listar categorias',
        error: error.message
      });
    }
  }
}