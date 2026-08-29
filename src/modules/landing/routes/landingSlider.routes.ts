// routes/landingSlider.routes.ts
// ✅ Rota PÚBLICA para o slider da landing page.

import { Router } from 'express';
import { LandingCategoryService } from '../services/LandingCategoryService';
import { LandingCategoryController } from '../controllers/LandingCategoryController';

const landingSliderRoutes = Router();

const service = new LandingCategoryService();
const controller = new LandingCategoryController(service);

// GET /api/landing/categories
// Público — categorias ativas para o slider (id, title, image, url, order)
landingSliderRoutes.get('/', controller.findSlider);

export default landingSliderRoutes;
