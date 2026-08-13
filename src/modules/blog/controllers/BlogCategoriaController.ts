// src/modules/blog/controllers/BlogCategoriaController.ts
import { Request, Response } from 'express';
import { BlogCategoriaRepository } from '../repositories/BlogCategoriaRepository';

const categoriaRepository = new BlogCategoriaRepository();

export class BlogCategoriaController {
  async listarTodas(req: Request, res: Response) {
    try {
      console.log('[BlogCategoriaController] Listando categorias...');
      
      const categorias = await categoriaRepository.listarTodas();
      
      console.log(`[BlogCategoriaController] ${categorias.length} categorias encontradas`);
      
      return res.json({
        success: true,
        data: categorias
      });
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