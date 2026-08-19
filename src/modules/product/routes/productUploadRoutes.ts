import { Router } from 'express';
import multer from 'multer';

import {
  ProductUploadController
} from '../controllers/ProductUploadController';

import {
  authMiddleware
} from '../../../middleware/auth.middleware';

import {
  isAdminMiddleware
} from '../../../middleware/isAdmin.middleware';

const productUploadRoutes =
  Router();

const controller =
  new ProductUploadController();


// ============================================================
// MULTER
// ============================================================

const upload = multer({

  storage:
    multer.memoryStorage(),

  limits: {
    fileSize:
      5 * 1024 * 1024,
  },

});


// ============================================================
// POST /api/product/upload
// ============================================================

productUploadRoutes.post(
  '/',
  authMiddleware,
  isAdminMiddleware,
  upload.single('image'),
  controller.upload
);

export default productUploadRoutes;