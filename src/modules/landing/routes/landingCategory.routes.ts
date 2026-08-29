import { Router } from 'express';
import { LandingCategoryController } from '../controllers/LandingCategoryController';
import { LandingCategoryService } from '../services/LandingCategoryService';
import {
  createLandingCategorySchema,
  updateLandingCategorySchema,
  validateBody,
} from '../validations/landingCategory.validation';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { isAdminMiddleware } from '../../../middleware/isAdmin.middleware';

const landingCategoryRoutes = Router();

const service = new LandingCategoryService();
const controller = new LandingCategoryController(service);

// ============ ROTAS PÚBLICAS ============

// Listar categorias
// GET /api/landing-categories
// Admin (sem query param) -> todas; Frontend ?active=true -> apenas ativas
landingCategoryRoutes.get('/', controller.findAll);

// Obter categoria específica
// GET /api/landing-categories/:id
landingCategoryRoutes.get('/:id', controller.findById);

// ============ ROTAS ADMIN (autenticação + permissão) ============

// Criar categoria
// POST /api/landing-categories
landingCategoryRoutes.post(
  '/',
  authMiddleware,
  isAdminMiddleware,
  validateBody(createLandingCategorySchema),
  controller.create
);

// Atualizar categoria
// PUT /api/landing-categories/:id
landingCategoryRoutes.put(
  '/:id',
  authMiddleware,
  isAdminMiddleware,
  validateBody(updateLandingCategorySchema),
  controller.update
);

// Excluir categoria (remove a imagem do bucket)
// DELETE /api/landing-categories/:id
landingCategoryRoutes.delete(
  '/:id',
  authMiddleware,
  isAdminMiddleware,
  controller.delete
);

export default landingCategoryRoutes;
