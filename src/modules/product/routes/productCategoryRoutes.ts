// routes/productCategoryRoutes.ts

import { Router } from 'express';

import { ProductCategoryRepository } from '../repositories/ProductCategoryRepository';
import { ProductCategoryService } from '../services/ProductCategoryService';
import { ProductCategoryController } from '../controllers/ProductCategoryController';

const router = Router();

const repository =
  new ProductCategoryRepository();

const service =
  new ProductCategoryService(repository);

const controller =
  new ProductCategoryController(service);


// Lista categorias
// GET /api/product-categories
router.get('/', controller.findAll);


// Categoria por slug
// GET /api/product-categories/slug/:slug
router.get('/slug/:slug', controller.findBySlug);


// Categoria por ID
// GET /api/product-categories/:id
router.get('/:id', controller.findById);


// Criar categoria
// POST /api/product-categories
router.post('/', controller.create);


// Atualizar categoria
// PUT /api/product-categories/:id
router.put('/:id', controller.update);


// Excluir categoria
// DELETE /api/product-categories/:id
router.delete('/:id', controller.delete);


export default router;