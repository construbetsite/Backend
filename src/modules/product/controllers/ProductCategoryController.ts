// controllers/ProductCategoryController.ts

import { Request, Response } from 'express';
import { ProductCategoryService } from '../services/ProductCategoryService';
import {
  getCache,
  setCache,
  generateKey,
  invalidatePrefix,
  TTL_CATEGORIES,
} from '../../../lib/cache';

export class ProductCategoryController {
  constructor(
    private readonly service: ProductCategoryService
  ) {}

  findAll = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { active, parentId } = req.query;

      const cacheKey = generateKey('product_categories:list', {
        active,
        parentId,
      });

      const cached = getCache<any[]>(cacheKey);
      if (cached) {
        res.status(200).json(cached);
        return;
      }

      const categories =
        await this.service.findAll({
          active:
            active !== undefined
              ? active === 'true'
              : undefined,

          parentId:
            parentId === undefined
              ? undefined
              : parentId === 'null'
              ? null
              : String(parentId),
        });

      setCache(cacheKey, categories, TTL_CATEGORIES);
      res.status(200).json(categories);
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
      });
    }
  };

  findById = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const id = req.params.id as string;
      const cacheKey = generateKey('product_categories:id', { id });

      const cached = getCache<any>(cacheKey);
      if (cached) {
        res.status(200).json(cached);
        return;
      }

      const category =
        await this.service.findById(id);

      setCache(cacheKey, category, TTL_CATEGORIES);
      res.status(200).json(category);
    } catch (error: any) {
      res.status(404).json({
        message: error.message,
      });
    }
  };

  findBySlug = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const slug = req.params.slug as string;
      const cacheKey = generateKey('product_categories:slug', { slug });

      const cached = getCache<any>(cacheKey);
      if (cached) {
        res.status(200).json(cached);
        return;
      }

      const category =
        await this.service.findBySlug(slug);

      setCache(cacheKey, category, TTL_CATEGORIES);
      res.status(200).json(category);
    } catch (error: any) {
      res.status(404).json({
        message: error.message,
      });
    }
  };

  create = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const category =
        await this.service.create(req.body);

      invalidatePrefix('product_categories:');
      invalidatePrefix('products:');
      invalidatePrefix('route:/api/product-categories');

      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({
        message: error.message,
      });
    }
  };

  update = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const category =
        await this.service.update(
          req.params.id as string,
          req.body
        );

      invalidatePrefix('product_categories:');
      invalidatePrefix('products:');
      invalidatePrefix('route:/api/product-categories');

      res.status(200).json(category);
    } catch (error: any) {
      res.status(400).json({
        message: error.message,
      });
    }
  };

  delete = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      await this.service.delete(req.params.id as string);

      invalidatePrefix('product_categories:');
      invalidatePrefix('products:');
      invalidatePrefix('route:/api/product-categories');

      res.status(204).send();
    } catch (error: any) {
      res.status(404).json({
        message: error.message,
      });
    }
  };
}