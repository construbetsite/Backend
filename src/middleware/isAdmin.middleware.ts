// src/middlewares/isAdminMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export interface AdminRequest extends Request {
  user?: any;
}

export const isAdminMiddleware = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Usuário não autenticado' });
    }

    // ✅ USAR TABELA 'usuarios'
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, role, active')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[isAdminMiddleware] Erro:', error);
      return res
        .status(500)
        .json({ success: false, message: 'Erro ao validar permissão' });
    }

    if (!data) {
      return res
        .status(403)
        .json({ success: false, message: 'Usuário não encontrado' });
    }

    if (!data.active) {
      return res
        .status(403)
        .json({ success: false, message: 'Usuário inativo' });
    }

    if (data.role !== 'admin') {
      return res
        .status(403)
        .json({ success: false, message: 'Acesso negado. Permissão de admin necessária.' });
    }

    req.user = {
      ...req.user,
      role: data.role,
      isAdmin: true
    };

    return next();
  } catch (error) {
    console.error('[isAdminMiddleware] Erro interno:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Erro interno ao validar admin' });
  }
};