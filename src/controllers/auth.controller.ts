import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  private service = new AuthService();

  register = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { nome, email, senha } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({
          success: false,
          message: 'Nome, e-mail e senha são obrigatórios.',
        });
      }

      const result = await this.service.register(nome, email, senha);
      return res.status(201).json({ success: true, user: result });
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      const status = typeof error?.status === 'number' ? error.status : 500;
      const message = error?.message || 'Erro interno ao cadastrar usuário.';
      return res.status(status).json({ success: false, message });
    }
  };

  login = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({
          success: false,
          message: 'E-mail e senha são obrigatórios',
        });
      }

      const result = await this.service.login(email, senha);

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(401).json({
        success: false,
        message: error.message || 'Falha na autenticação',
      });
    }
  };

  adminLogin = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({
          success: false,
          message: 'E-mail e senha são obrigatórios',
        });
      }

      const result = await this.service.adminLogin(email, senha);

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      const status = typeof error?.status === 'number' ? error.status : 500;
      return res.status(status).json({
        success: false,
        message: error?.message || 'Erro ao realizar login administrativo',
      });
    }
  };
}