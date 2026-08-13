import { Router } from 'express';
import { UsuariosController } from '../controllers/usuarios.controller';

const usuariosRoutes = Router();
const controller = new UsuariosController();

// Cria usuário (Auth + perfil em public.usuarios)
usuariosRoutes.post('/', controller.criar);

export default usuariosRoutes;

