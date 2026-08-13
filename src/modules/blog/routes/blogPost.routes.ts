import { Router } from 'express';
import { BlogPostController } from '../controllers/BlogPostController';
import {
  createBlogPostSchema,
  updateBlogPostSchema,
  validateBody,
} from '../validations/blogPost.validation';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { isAdminMiddleware } from '../../../middleware/isAdmin.middleware';

const blogPostRoutes = Router();
const controller = new BlogPostController();

// ============ ROTAS MAIS ESPECÍFICAS PRIMEIRO ============

// 🔥 1. Buscar post por ID (admin) - UUID
blogPostRoutes.get(
  '/id/:id',
  authMiddleware,
  isAdminMiddleware,
  controller.findById
);

// 🔥 2. Buscar post por SLUG (público)
blogPostRoutes.get(
  '/slug/:slug',
  controller.findBySlug
);

// 🔥 3. Listar posts (com paginação e filtros)
blogPostRoutes.get('/', controller.list);

// ============ ROTAS POST, PUT, DELETE ============

// Criar post
blogPostRoutes.post(
  '/',
  authMiddleware,
  isAdminMiddleware,
  validateBody(createBlogPostSchema),
  controller.create
);

// ✅ Atualizar post - UUID
blogPostRoutes.put(
  '/:id',
  authMiddleware,
  isAdminMiddleware,
  validateBody(updateBlogPostSchema),
  controller.update
);

// ✅ Deletar post - UUID
blogPostRoutes.delete(
  '/:id',
  authMiddleware,
  isAdminMiddleware,
  controller.remove
);

export default blogPostRoutes;