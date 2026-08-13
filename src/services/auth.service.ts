import { supabase } from '../config/supabase';
import { UsuariosRepository } from '../repositories/usuarios.repository';

export class AuthService {
  private repository = new UsuariosRepository();

  async register(nome: string, email: string, senha: string) {
    if (!nome || nome.trim().length === 0) {
      throw { status: 400, message: 'Nome é obrigatório.' };
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      throw { status: 400, message: 'E-mail inválido.' };
    }

    if (!senha || senha.length < 6) {
      throw { status: 400, message: 'A senha deve ter pelo menos 6 caracteres.' };
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome },
    });

    if (error) {
      console.error('Erro no register Supabase:', error);

      const msg = error.message || '';
      if (msg.toLowerCase().includes('already registered')) {
        throw { status: 409, message: 'E-mail já cadastrado.' };
      }

      // Evita expor detalhes internos
      throw { status: 400, message: 'Falha ao criar conta. Tente novamente.' };
    }

    const user = data.user;
    if (!user) {
      throw { status: 500, message: 'Falha ao criar conta (usuário não retornado).' };
    }

    return {
      id: user.id,
      nome: (user.user_metadata as any)?.nome || nome,
      email: user.email,
    };
  }

  async login(email: string, senha: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });


    if (error) {
      console.error('Erro no login Supabase:', error.message);
      throw new Error('Usuário ou senha inválidos');
    }

    const { user, session } = data;

    const perfil = await this.repository.findById(user.id);
    if (!perfil) {
      await supabase.auth.signOut();
      throw new Error('Perfil de usuário não encontrado');
    }

    if (!perfil.ativo) {
      await supabase.auth.signOut();
      throw new Error('Usuário inativo. Entre em contato com o suporte.');
    }

    return {
      token: session.access_token,
      user: {
        id: user.id,
        nome: perfil.nome,
        email: user.email,
      },
    };
  }

  async adminLogin(email: string, senha: string) {
    if (!email || !senha) {
      throw { status: 400, message: 'E-mail e senha são obrigatórios' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      console.error('Erro no adminLogin Supabase:', error.message);
      throw { status: 401, message: 'E-mail ou senha inválidos' };
    }

    const user = data?.user;
    const session = data?.session;

    if (!user?.id || !session?.access_token) {
      throw { status: 401, message: 'E-mail ou senha inválidos' };
    }

    const { data: adminData, error: adminError } = await supabase
      .from('administradores')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (adminError) {
      console.error('Erro ao consultar administradores:', adminError.message);
      throw { status: 500, message: 'Erro interno ao validar admin' };
    }

    if (!adminData) {
      throw { status: 403, message: 'Acesso negado. Você não é administrador.' };
    }

    // nome fica no user_metadata.nome (igual ao register)
    const nome = (user.user_metadata as any)?.nome || user.email;

    return {
      token: session.access_token,
      user: {
        id: user.id,
        nome,
        email: user.email,
        isAdmin: true,
      },
    };
  }
}

