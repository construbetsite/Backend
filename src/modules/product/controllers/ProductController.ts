// controllers/ProductController.ts

import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';
import { CommercialType } from '../types/Product';
import {
  getCache,
  setCache,
  generateKey,
  invalidatePrefix,
  TTL_PRODUCTS,
  TTL_PRODUCT_DETAIL,
} from '../../../lib/cache';

export class ProductController {
  constructor(
    private readonly service: ProductService
  ) {}

  findAll = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const {
        categoryId,
        commercialType,
        active,
        featured,
      } = req.query;

      const cacheKey = generateKey('products:list', {
        categoryId,
        commercialType,
        active,
        featured,
      });

      const cached = getCache<any[]>(cacheKey);
      if (cached) {
        res.status(200).json(cached);
        return;
      }

      const products =
        await this.service.findAll({
          categoryId: categoryId as string | undefined,

          commercialType:
            commercialType as CommercialType | undefined,

          active:
            active !== undefined
              ? active === 'true'
              : undefined,

          featured:
            featured !== undefined
              ? featured === 'true'
              : undefined,
        });

      setCache(cacheKey, products, TTL_PRODUCTS);
      res.status(200).json(products);
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
      const cacheKey = generateKey('products:id', { id });

      const cached = getCache<any>(cacheKey);
      if (cached) {
        res.status(200).json(cached);
        return;
      }

      const product =
        await this.service.findById(id);

      setCache(cacheKey, product, TTL_PRODUCT_DETAIL);
      res.status(200).json(product);
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
      const cacheKey = generateKey('products:slug', { slug });

      const cached = getCache<any>(cacheKey);
      if (cached) {
        res.status(200).json(cached);
        return;
      }

      const product =
        await this.service.findBySlug(slug);

      setCache(cacheKey, product, TTL_PRODUCT_DETAIL);
      res.status(200).json(product);
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
      const product =
        await this.service.create(req.body);

      invalidatePrefix('products:');
      invalidatePrefix('route:/api/product');

      res.status(201).json(product);
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
      const product =
        await this.service.update(
          req.params.id as string,
          req.body
        );

      invalidatePrefix('products:');
      invalidatePrefix('route:/api/product');

      res.status(200).json(product);
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

      invalidatePrefix('products:');
      invalidatePrefix('route:/api/product');

      res.status(204).send();
    } catch (error: any) {
      res.status(404).json({
        message: error.message,
      });
    }
  };
}