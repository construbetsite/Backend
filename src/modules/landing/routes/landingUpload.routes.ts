import { Router } from 'express';
import multer from 'multer';
import { LandingUploadController } from '../controllers/LandingUploadController';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { isAdminMiddleware } from '../../../middleware/isAdmin.middleware';

const landingUploadRoutes = Router();
const controller = new LandingUploadController();

// Upload em memória (até 5 MB), apenas 1 arquivo no campo "image".
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// POST /api/landing-categories/upload
landingUploadRoutes.post(
  '/',
  authMiddleware,
  isAdminMiddleware,
  upload.single('image'),
  controller.upload
);

export default landingUploadRoutes;
