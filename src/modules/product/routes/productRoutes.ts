// routes/productRoutes.ts

import { Router } from 'express';

import { ProductRepository } from '../repositories/ProductRepository';
import { ProductService } from '../services/ProductService';
import { ProductController } from '../controllers/ProductController';
import {
  createProductSchema,
  updateProductSchema,
  validateBody,
} from '../validations/productValidation';

const router = Router();

const repository = new ProductRepository();
const service = new ProductService(repository);
const controller = new ProductController(service);


// Lista produtos
// GET /api/products
router.get('/', controller.findAll);


// Produto por slug
// GET /api/products/slug/:slug
router.get('/slug/:slug', controller.findBySlug);


// Produto por ID
// GET /api/products/:id
router.get('/:id', controller.findById);


// Criar produto
// POST /api/products
router.post('/', validateBody(createProductSchema), controller.create);


// Atualizar produto
// PUT /api/products/:id
router.put('/:id', validateBody(updateProductSchema), controller.update);


// Excluir produto
// DELETE /api/products/:id
router.delete('/:id', controller.delete);


export default router;