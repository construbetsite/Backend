import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const authRoutes = Router();
const controller = new AuthController();

authRoutes.post('/login', controller.login);

authRoutes.post('/register', controller.register);

authRoutes.post('/admin/login', controller.adminLogin);


export default authRoutes;
