import { Request, Response } from 'express';
import { BlogPostService } from '../services/BlogPostService';
import { AppError } from '../errors/AppError';
import {
  buildPaginationMeta,
  normalizePagination,
} from '../../../lib/pagination';
import {
  getCache,
  setCache,
  generateKey,
  invalidatePrefix,
  sendWithConditionalCache,
  CACHE_CONTROL_DYNAMIC,
  CACHE_CONTROL_DETAIL,
  TTL_BLOG_POSTS,
} from '../../../lib/cache';

// ✅ Validador de UUID
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// ✅ Função para converter camelCase para snake_case
function toSnakeCase(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const result: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Converte camelCase para snake_case
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      result[snakeKey] = obj[key];
    }
  }
  return result;
}

// ✅ Função auxiliar para extrair ID como string
function extractId(params: any): string {
  const id = params.id;
  return Array.isArray(id) ? id[0] : id;
}

// ✅ Função auxiliar para extrair slug como string
function extractSlug(params: any): string {
  const slug = params.slug;
  return Array.isArray(slug) ? slug[0] : slug;
}

export class BlogPostController {
  private service = new BlogPostService();

  private errorStatus(error: unknown): number {
    if (error instanceof AppError) return error.statusCode;
    return 500;
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  }

  // POST /api/blog/posts
  create = async (req: Request, res: Response) => {
    try {
      // ✅ LOG DO BODY ORIGINAL
      console.log('📥 [Controller CREATE] Body original:', req.body);

      // ✅ MAPPING EXPLÍCITO: frontend envia productIds (camelCase) → product_ids (snake_case)
      if (req.body.productIds !== undefined && req.body.product_ids === undefined) {
        req.body.product_ids = req.body.productIds;
      }

      // ✅ Converter dados para snake_case antes de enviar ao service
      const data = toSnakeCase(req.body);

      // ✅ LOG DOS DADOS CONVERTIDOS (CAMPOS DE IMAGEM E VÍDEO E PRODUTOS)
      console.log('🐛 [Controller CREATE] productIds no body:', req.body.productIds);
      console.log('🐛 [Controller CREATE] product_ids p/ service:', data.product_ids);

      // ✅ LOG DOS DADOS CONVERTIDOS (CAMPOS DE IMAGEM E VÍDEO)
      console.log('📥 [Controller CREATE] Dados convertidos:', {
        title: data.title,
        status: data.status,
        video1: data.video1,      // ✅ ADICIONADO
        video2: data.video2,      // ✅ ADICIONADO
        image_url: data.image_url,
        image_path: data.image_path,
        image_filename: data.image_filename,
        image_size: data.image_size,
        image_mime_type: data.image_mime_type,
        storage_bucket: data.storage_bucket,
      });

      const post = await this.service.create(data);

      // ✅ Invalidação do cache de posts do blog
      invalidatePrefix('blog_posts:');
      invalidatePrefix('route:/api/blog');

      // ✅ LOG DO POST CRIADO
      console.log('✅ [Controller CREATE] Post criado:', {
        id: post.id,
        title: post.title,
        video1: post.video1,     // ✅ ADICIONADO
        video2: post.video2,     // ✅ ADICIONADO
        image_url: post.image_url,
        image_path: post.image_path,
        status: post.status,
      });

      return res.status(201).json({ success: true, data: post });
    } catch (error) {
      console.error('[BlogPostController.create]', error);
      return res.status(this.errorStatus(error)).json({
        success: false,
        message: this.errorMessage(error, 'Erro ao criar post'),
      });
    }
  };

  // GET /api/blog/posts?page=&limit=&category=&tag=&featured=&status=
  list = async (req: Request, res: Response) => {
    try {
      // ✅ Suporte a cursor (opcional) ou page/limit
      const { page: cursorPage, limit: paginationLimit } = normalizePagination(req.query);

      const page =
        req.query.cursor !== undefined
          ? cursorPage
          : Math.max(1, parseInt(req.query.page as string, 10) || 1);

      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit as string, 10) || paginationLimit)
      );

      const category =
        typeof req.query.category === 'string' ? req.query.category : undefined;
      const tag = typeof req.query.tag === 'string' ? req.query.tag : undefined;
      const featured =
        req.query.featured === 'true'
          ? true
          : req.query.featured === 'false'
            ? false
            : undefined;

      // ✅ USAR STATUS (NÃO ATIVO)
      const status =
        req.query.status === 'true'
          ? true
          : req.query.status === 'false'
            ? false
            : undefined;

      const cacheKey = generateKey('blog_posts:list', {
        page,
        limit,
        cursor: req.query.cursor,
        category,
        tag,
        featured,
        status,
      });

      // ✅ Cache HTTP: CDN/navegador responde sem bater no servidor (transparente ao frontend)
      // ✅ ETag + Cache-Control: 304 em <50ms se nada mudou
      const cached = getCache<any>(cacheKey);
      if (cached) {
        sendWithConditionalCache(req, res, cached, CACHE_CONTROL_DYNAMIC);
        return;
      }

      const { items, total } = await this.service.list({
        page,
        limit,
        category,
        tag,
        featured,
        status, // ← status (não ativo)
      });

      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;

      const pagination = buildPaginationMeta(total, offset, limit);

      const responsePayload = {
        success: true,
        data: items,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          totalPages,
          hasMore: pagination.hasMore,
          nextCursor: pagination.nextCursor,
        },
      };

      setCache(cacheKey, responsePayload, TTL_BLOG_POSTS);

      sendWithConditionalCache(req, res, responsePayload, CACHE_CONTROL_DYNAMIC);
      return;
    } catch (error) {
      console.error('[BlogPostController.list]', error);
      return res.status(this.errorStatus(error)).json({
        success: false,
        message: this.errorMessage(error, 'Erro ao listar posts'),
      });
    }
  };

  // GET /api/blog/posts/slug/:slug (público)
  findBySlug = async (req: Request, res: Response) => {
    try {
      const slug = extractSlug(req.params);

      if (!slug || slug.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Slug não fornecido',
        });
      }

      // ✅ Chave de cache inclui o `include` (versões plain vs enriched são distintas)
      const cacheKey = generateKey('blog_posts:slug', {
        slug,
        include: req.query.include || 'none',
      });

      // ✅ Cache HTTP para o detalhe do post (payload inalterado) + ETag ultraleve
      const cached = getCache<any>(cacheKey);
      if (cached) {
        sendWithConditionalCache(req, res, cached, CACHE_CONTROL_DETAIL);
        return;
      }

      console.log(`🔍 Buscando post por slug: ${slug}`);

      // ✅ ?include=products → retorna o post com os produtos vinculados
      const includeProducts = req.query.include === 'products';
      const post = includeProducts
        ? await this.service.findBySlugWithProducts(slug)
        : await this.service.findBySlug(slug);

      const responsePayload = { success: true, data: post };
      setCache(cacheKey, responsePayload, TTL_BLOG_POSTS);

      sendWithConditionalCache(req, res, responsePayload, CACHE_CONTROL_DETAIL);
      return;
    } catch (error) {
      console.error('[BlogPostController.findBySlug]', error);
      return res.status(this.errorStatus(error)).json({
        success: false,
        message: this.errorMessage(error, 'Erro ao buscar post por slug'),
      });
    }
  };

  // GET /api/blog/posts/id/:id (admin) - Aceita UUID
  findById = async (req: Request, res: Response) => {
    try {
      const id = extractId(req.params);

      if (!isValidUUID(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido: deve ser um UUID válido',
        });
      }

      console.log(`🔍 Buscando post por ID: ${id}`);

      // ✅ ?include=products → retorna o post com os produtos vinculados
      const includeProducts = req.query.include === 'products';
      const post = includeProducts
        ? await this.service.findByIdWithProducts(id)
        : await this.service.findById(id);

      // ✅ LOG DO POST ENCONTRADO
      console.log('✅ [Controller findById] Post encontrado:', {
        id: post.id,
        title: post.title,
        video1: post.video1,     // ✅ ADICIONADO
        video2: post.video2,     // ✅ ADICIONADO
        image_url: post.image_url,
        image_path: post.image_path,
        status: post.status,
      });

      return res.status(200).json({ success: true, data: post });
    } catch (error) {
      console.error('[BlogPostController.findById]', error);
      return res.status(this.errorStatus(error)).json({
        success: false,
        message: this.errorMessage(error, 'Erro ao buscar post por id'),
      });
    }
  };

  // ✅ CORRIGIDO: PUT /api/blog/posts/:id - Aceita UUID
  update = async (req: Request, res: Response) => {
    try {
      const id = extractId(req.params);

      if (!isValidUUID(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido: deve ser um UUID válido',
        });
      }

      console.log(`📝 Atualizando post ID: ${id}`);

      // ✅ LOG DO BODY ORIGINAL
      console.log('📥 [Controller UPDATE] Body original:', req.body);

      // ✅ Converter dados para snake_case antes de enviar ao service
      const data = toSnakeCase(req.body);

      // ✅ LOG DOS DADOS CONVERTIDOS (CAMPOS DE IMAGEM E VÍDEO)
      console.log('📥 [Controller UPDATE] Dados convertidos:', {
        title: data.title,
        status: data.status,
        video1: data.video1,      // ✅ ADICIONADO
        video2: data.video2,      // ✅ ADICIONADO
        image_url: data.image_url,
        image_path: data.image_path,
        image_filename: data.image_filename,
        image_size: data.image_size,
        image_mime_type: data.image_mime_type,
        storage_bucket: data.storage_bucket,
      });

      // 🔥 Remover campos que não devem ser atualizados
      delete data.id;
      delete data.created_at;

      // ✅ MAPPING EXPLÍCITO: frontend envia productIds (camelCase) → product_ids (snake_case)
      // Prioridade: Joi já normalizou (data.product_ids) → req.body.productIds (original) → req.body.product_ids
      if (data.product_ids === undefined) {
        if (req.body.productIds !== undefined) {
          data.product_ids = req.body.productIds;
        } else if (req.body.product_ids !== undefined) {
          data.product_ids = req.body.product_ids;
        }
      }

      // ✅ LOG DE DEPURAÇÃO: valores que chegaram ao update
      console.log('🐛 [Controller UPDATE] productIds no body:', req.body.productIds);
      console.log('🐛 [Controller UPDATE] product_ids no body:', req.body.product_ids);
      console.log('🐛 [Controller UPDATE] updateData p/ service:', JSON.stringify(data));

      const post = await this.service.update(id, data);

      // ✅ Invalidação do cache de posts do blog
      invalidatePrefix('blog_posts:');
      invalidatePrefix('route:/api/blog');

      // ✅ LOG DO POST ATUALIZADO
      console.log('✅ [Controller UPDATE] Post atualizado:', {
        id: post.id,
        title: post.title,
        video1: post.video1,     // ✅ ADICIONADO
        video2: post.video2,     // ✅ ADICIONADO
        image_url: post.image_url,
        image_path: post.image_path,
        status: post.status,
      });

      return res.status(200).json({ success: true, data: post });
    } catch (error) {
      console.error('[BlogPostController.update]', error);
      return res.status(this.errorStatus(error)).json({
        success: false,
        message: this.errorMessage(error, 'Erro ao atualizar post'),
      });
    }
  };

  // DELETE /api/blog/posts/:id - Aceita UUID
  remove = async (req: Request, res: Response) => {
    try {
      const id = extractId(req.params);

      if (!isValidUUID(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido: deve ser um UUID válido',
        });
      }

      console.log(`🗑️ Excluindo post ID: ${id}`);
      await this.service.delete(id);

      // ✅ Invalidação do cache de posts do blog
      invalidatePrefix('blog_posts:');
      invalidatePrefix('route:/api/blog');

      return res.status(204).send();
    } catch (error) {
      console.error('[BlogPostController.remove]', error);
      return res.status(this.errorStatus(error)).json({
        success: false,
        message: this.errorMessage(error, 'Erro ao deletar post'),
      });
    }
  };
}