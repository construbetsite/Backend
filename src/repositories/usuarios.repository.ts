import { supabase } from '../config/supabase';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
}

export class UsuariosRepository {
  async findById(id: string): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, ativo')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error('Erro ao buscar usuário');
    return data;
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, ativo')
      .eq('email', email)
      .maybeSingle();

    if (error) throw new Error('Erro ao buscar usuário por email');
    return data;
  }
}