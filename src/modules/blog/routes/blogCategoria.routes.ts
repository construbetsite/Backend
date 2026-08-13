import { Router } from 'express';
import { BlogCategoriaController } from '../controllers/BlogCategoriaController';

const blogCategoriaRoutes = Router();
const controller = new BlogCategoriaController();

// ============ PÚBLICO (sem autenticação) ============
// Listar todas as categorias do blog
blogCategoriaRoutes.get('/', controller.listarTodas);

export default blogCategoriaRoutes;
