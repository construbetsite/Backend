// controllers/LandingCategoryController.ts

import { Request, Response } from 'express';
import { LandingCategoryService } from '../services/LandingCategoryService';
import {
  getCache,
  setCache,
  generateKey,
  invalidatePrefix,
  TTL_CATEGORIES,
} from '../../../lib/cache';
import { AppError } from '../errors/AppError';

export class LandingCategoryController {
  constructor(
    private readonly service: LandingCategoryService
  ) { }

  private errorStatus(error: unknown): number {
    if (error instanceof AppError) return error.statusCode;
    return 500;
  }

  // GET /api/landing-categories
  // Admin sem query param -> todas as categorias
  // Frontend ?active=true -> apenas ativas
  findAll = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { active } = req.query;

      const cacheKey = generateKey('landing_categories:list', { active });

      const cached = getCache<any[]>(cacheKey);
      if (cached) {
        res.status(200).json({ success: true, data: cached });
        return;
      }

      const categories = await this.service.findAll({
        active:
          active !== undefined
            ? active === 'true'
            : undefined,
      });

      setCache(cacheKey, categories, TTL_CATEGORIES);
      res.status(200).json({ success: true, data: categories });
    } catch (error: any) {
      res.status(this.errorStatus(error)).json({
        success: false,
        message: error.message || 'Erro ao listar categorias da landing page',
      });
    }
  };

  // ✅ SLIDER PÚBLICO — GET /api/landing/categories
  // Retorna apenas categorias ativas (status = true), ordenadas por `order` ASC,
  // com projeção enxuta: id, title, image, url, order.
  findSlider = async (req: Request, res: Response): Promise<void> => {
    try {
      const cacheKey = generateKey('landing_categories:slider');

      const cached = getCache<any[]>(cacheKey);
      if (cached) {
        res.status(200).json({ success: true, data: cached });
        return;
      }

      const categories = await this.service.findActiveForSlider();

      setCache(cacheKey, categories, TTL_CATEGORIES);
      res.status(200).json({ success: true, data: categories });
    } catch (error: any) {
      res.status(this.errorStatus(error)).json({
        success: false,
        message: error.message || 'Erro ao listar categorias da landing page',
      });
    }
  };

  // GET /api/landing-categories/:id
  findById = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const id = req.params.id as string;
      const cacheKey = generateKey('landing_categories:id', { id });

      const cached = getCache<any>(cacheKey);
      if (cached) {
        res.status(200).json({ success: true, data: cached });
        return;
      }

      const category = await this.service.findById(id);

      setCache(cacheKey, category, TTL_CATEGORIES);
      res.status(200).json({ success: true, data: category });
    } catch (error: any) {
      res.status(this.errorStatus(error)).json({
        success: false,
        message: error.message || 'Erro ao buscar categoria',
      });
    }
  };

  // POST /api/landing-categories
  create = async (
    req: Request,
    res: Response
  ): Promise<Response | void> => {
    // ✅ LOGS DE DEPURAÇÃO (diagnóstico de req.body vazio)
    console.log('📥 [LandingCategoryController.create] req.body:', req.body);
    console.log(
      '📥 [LandingCategoryController.create] content-type:',
      req.headers['content-type']
    );

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        message:
          'Corpo da requisição inválido. Envie JSON com Content-Type: application/json e os campos title, image e url.',
        errors: [
          'Se você está enviando multipart/form-data (com imagem no mesmo request), o backend espera 2 chamadas: primeiro POST /api/landing-categories/upload para a imagem, depois POST /api/landing-categories com a URL no JSON.',
        ],
      });
    }

    try {
      const category = await this.service.create(req.body);

      invalidatePrefix('landing_categories:');
      invalidatePrefix('route:/api/landing-categories');

      res.status(201).json({ success: true, data: category });
    } catch (error: any) {
      res.status(this.errorStatus(error)).json({
        success: false,
        message: error.message || 'Erro ao criar categoria',
      });
    }
  };

  // PUT /api/landing-categories/:id
  update = async (
    req: Request,
    res: Response
  ): Promise<Response | void> => {
    // ✅ LOGS DE DEPURAÇÃO
    console.log('📥 [LandingCategoryController.update] req.body:', req.body);
    console.log(
      '📥 [LandingCategoryController.update] content-type:',
      req.headers['content-type']
    );

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        message:
          'Corpo da requisição inválido. Envie JSON com Content-Type: application/json.',
      });
    }

    try {
      const category = await this.service.update(
        req.params.id as string,
        req.body
      );

      invalidatePrefix('landing_categories:');
      invalidatePrefix('route:/api/landing-categories');

      res.status(200).json({ success: true, data: category });
    } catch (error: any) {
      res.status(this.errorStatus(error)).json({
        success: false,
        message: error.message || 'Erro ao atualizar categoria',
      });
    }
  };

  // DELETE /api/landing-categories/:id
  delete = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      await this.service.delete(req.params.id as string);

      invalidatePrefix('landing_categories:');
      invalidatePrefix('route:/api/landing-categories');

      res.status(204).send();
    } catch (error: any) {
      res.status(this.errorStatus(error)).json({
        success: false,
        message: error.message || 'Erro ao excluir categoria',
      });
    }
  };
}
