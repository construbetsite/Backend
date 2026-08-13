import { Request, Response } from 'express';
import { BlogPostService } from '../services/BlogPostService';
import { AppError } from '../errors/AppError';

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
      // ✅ Converter dados para snake_case antes de enviar ao service
      const data = toSnakeCase(req.body);
      const post = await this.service.create(data);
      return res.status(201).json({ success: true, data: post });
    } catch (error) {
      console.error('[BlogPostController.create]', error);
      return res.status(this.errorStatus(error)).json({
        success: false,
        message: this.errorMessage(error, 'Erro ao criar post'),
      });
    }
  };

  // GET /api/blog/posts?page=&limit=&category=&tag=&featured=
  list = async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit as string, 10) || 10)
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

      const { items, total } = await this.service.list({
        page,
        limit,
        category,
        tag,
        featured,
      });

      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        success: true,
        data: items,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
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

      console.log(`🔍 Buscando post por slug: ${slug}`);
      const post = await this.service.findBySlug(slug);
      return res.status(200).json({ success: true, data: post });
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
      const post = await this.service.findById(id);
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
      
      // ✅ Converter dados para snake_case antes de enviar ao service
      const data = toSnakeCase(req.body);
      
      // 🔥 Remover campos que não devem ser atualizados
      delete data.id;
      delete data.created_at;
      
      const post = await this.service.update(id, data);
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