import { Router } from 'express';
import multer from 'multer';
import { BlogUploadController } from '../controllers/BlogUploadController';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { isAdminMiddleware } from '../../../middleware/isAdmin.middleware';

const blogUploadRoutes = Router();
const controller = new BlogUploadController();

// Upload em memória (até 5 MB), apenas 1 arquivo no campo "image".
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

blogUploadRoutes.post(
  '/',
  authMiddleware,
  isAdminMiddleware,
  upload.single('image'),
  controller.upload
);

export default blogUploadRoutes;
