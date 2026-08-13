import { Request, Response } from 'express';
import { UsuariosService } from '../services/usuarios.service';

export class UsuariosController {
  private service = new UsuariosService();

  
  criar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email, senha, nome } = req.body;

      if (!email || !senha || !nome) {
        return res.status(400).json({
          success: false,
          message: 'nome, email e senha são obrigatórios',
        });
      }

      const result = await this.service.criar({ email, senha, nome });

      return res.status(201).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Falha ao criar usuário',
      });
    }
  };
}

