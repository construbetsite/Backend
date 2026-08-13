import { supabase } from '../config/supabase';
import { UsuariosRepository } from '../repositories/usuarios.repository';

export class UsuariosService {
  private repository = new UsuariosRepository();


  async criar(data: { email: string; senha: string; nome: string }) {
    // 1) Cria usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.senha,
    });

    if (authError) {
      throw new Error(authError.message || 'Erro ao criar usuário no Supabase Auth');
    }

    const userId = authData?.user?.id;
    if (!userId) {
      throw new Error('Falha ao obter id do usuário criado no Supabase');
    }

    // 2) Cria perfil na tabela pública `usuarios`
    const { error: perfilError } = await supabase.from('usuarios').insert({
      id: userId,
      nome: data.nome,
      email: data.email,
      ativo: true,
    });

    if (perfilError) {
      // Se falhar ao criar perfil, opcionalmente pode deletar o usuário no Auth.
      throw new Error(perfilError.message || 'Erro ao criar perfil em public.usuarios');
    }

    // 3) Retorna dados do perfil criado
    const perfil = await this.repository.findById(userId);
    if (!perfil) {
      throw new Error('Perfil não encontrado após criação');
    }

    return {
      user: {
        id: perfil.id,
        nome: perfil.nome,
        email: perfil.email,
        ativo: perfil.ativo,
      },
    };
  }
}

