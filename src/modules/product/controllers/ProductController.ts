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
import {
  normalizePagination,
  offsetFrom,
  buildPaginationMeta,
} from '../../../lib/pagination';

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

      const pagination = normalizePagination(req.query);
      const hasPagination =
        req.query.page !== undefined ||
        req.query.limit !== undefined ||
        req.query.cursor !== undefined;

      const cacheKey = generateKey('products:list', {
        categoryId,
        commercialType,
        active,
        featured,
        page: hasPagination ? pagination.page : undefined,
        limit: hasPagination ? pagination.limit : undefined,
        cursor: hasPagination ? req.query.cursor : undefined,
      });

      const cached = getCache<any>(cacheKey);
      if (cached) {
        res.status(200).json(cached);
        return;
      }

      const filters = {
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
      };

      if (hasPagination) {
        // ============ MODO PAGINADO (novo, gradual) ============
        // GET /api/products?limit=20&page=1 | ?limit=20&cursor=xxx
        const offset = offsetFrom(pagination);

        const { items, total } =
          await this.service.findAllPaginated(
            filters,
            offset,
            pagination.limit
          );

        const payload = {
          success: true,
          data: items,
          pagination: buildPaginationMeta(
            total,
            offset,
            pagination.limit
          ),
        };

        setCache(cacheKey, payload, TTL_PRODUCTS);
        res.status(200).json(payload);
        return;
      }

      // ============ MODO LEGADO (sem paginação: array puro) ============
      // Mantém a compatibilidade com o frontend atual.
      const products = await this.service.findAll(filters);

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