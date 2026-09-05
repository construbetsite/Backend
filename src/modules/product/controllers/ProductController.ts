// controllers/ProductController.ts

import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';
import { CommercialType } from '../types/Product';
import {
  getCache,
  setCacheWithEtag, // 🔥 R1: grava ETag pré-calculado junto ao payload
  generateKey,
  invalidatePrefix,
  sendWithConditionalCache,
  serveFromCache,
  CACHE_CONTROL_DYNAMIC,
  CACHE_CONTROL_DETAIL,
  CACHE_CONTROL_VITRINE,
  TTL_PRODUCTS,
  TTL_PRODUCT_DETAIL,
  TTL_VITRINE,
  TTL_VITRINE_STALE,
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

  /** MAX_LIMIT global é 100; a vitrine nunca passa de 20 por garantia de contrato. */
  static readonly VITRINE_MAX_LIMIT = 20;

  /**
   * Tarefa 2 — ROTA VITRINE (lista enxuta para a landing page).
   *
   * GET /api/product/vitrine?page=1&limit=20 | ?cursor=xxx
   *
   * O payload é montado uma vez, cacheado (com ETag pré-calculado e
   * stale-while-revalidate no servidor) e enviado com 304 sempre que
   * o cliente já tem a versão atual — o Frontend não re-baixa nada.
   */
  vitrine = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const pagination = normalizePagination(req.query);
      const limit = Math.min(
        pagination.limit,
        ProductController.VITRINE_MAX_LIMIT
      );
      const page = pagination.page;
      const offset = offsetFrom({ page, limit });

      const cacheKey = generateKey('products:vitrine', {
        page,
        limit,
      });

      const payload = await serveFromCache(
        cacheKey,
        TTL_VITRINE,
        TTL_VITRINE_STALE,
        async () => {
          const { items, total } =
            await this.service.findVitrine(offset, limit);

          // Apenas o corpo enxuto — quem cuida do cache + ETag
          // pré-calculado é o próprio serveFromCache.
          return {
            success: true,
            data: items,
            pagination: buildPaginationMeta(
              total,
              offset,
              limit
            ),
          };
        }
      );

      sendWithConditionalCache(
        req,
        res,
        payload,
        CACHE_CONTROL_VITRINE
      );
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
      });
    }
  };

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
        // ✅ ETag + Cache-Control: 304 em <50ms se nada mudou
        sendWithConditionalCache(req, res, cached, CACHE_CONTROL_DYNAMIC);
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

        setCacheWithEtag(cacheKey, payload, TTL_PRODUCTS); // 🔥 R1
        sendWithConditionalCache(req, res, payload, CACHE_CONTROL_DYNAMIC);
        return;
      }

      // ============ MODO LEGADO (sem paginação: array puro) ============
      // Mantém a compatibilidade com o frontend atual.
      const products = await this.service.findAll(filters);

      setCacheWithEtag(cacheKey, products, TTL_PRODUCTS); // 🔥 R1
      sendWithConditionalCache(req, res, products, CACHE_CONTROL_DYNAMIC);
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
        sendWithConditionalCache(req, res, cached, CACHE_CONTROL_DETAIL);
        return;
      }

      const product =
        await this.service.findById(id);

      setCacheWithEtag(cacheKey, product, TTL_PRODUCT_DETAIL); // 🔥 R1
      sendWithConditionalCache(req, res, product, CACHE_CONTROL_DETAIL);
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
        sendWithConditionalCache(req, res, cached, CACHE_CONTROL_DETAIL);
        return;
      }

      const product =
        await this.service.findBySlug(slug);

      setCacheWithEtag(cacheKey, product, TTL_PRODUCT_DETAIL); // 🔥 R1
      sendWithConditionalCache(req, res, product, CACHE_CONTROL_DETAIL);
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