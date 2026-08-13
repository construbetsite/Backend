import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>

  try {
    const { data: userData, error } = await supabase.auth.getUser(token);

    if (error || !userData?.user) {
      return res
        .status(401)
        .json({ success: false, message: 'Token inválido ou expirado' });
    }

    req.user = userData.user;
    return next();
  } catch {
    return res
      .status(401)
      .json({ success: false, message: 'Token inválido ou expirado' });
  }
};


