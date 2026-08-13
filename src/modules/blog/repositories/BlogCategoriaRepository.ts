import { supabase } from '../../../config/supabase';
import { BlogCategoria, BlogCategoriaResumida } from '../types/blogPost.types';

// ✅ REMOVER 'descricao' daqui
const SELECT_COLUMNS = 'id, nome';

function toResumida(row: BlogCategoria): BlogCategoriaResumida {
  return { id: row.id, nome: row.nome };
}

export class BlogCategoriaRepository {
  // Retorna todas as categorias ordenadas por nome (id e nome)
  async listarTodas(): Promise<BlogCategoriaResumida[]> {
    const { data, error } = await supabase
      .from('blog_categorias')
      .select(SELECT_COLUMNS)
      .order('nome', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => toResumida(row as BlogCategoria));
  }

  // Busca uma categoria pelo id (para validação)
  async buscarPorId(id: string): Promise<BlogCategoria | null> {
    const { data, error } = await supabase
      .from('blog_categorias')
      .select(SELECT_COLUMNS)
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? (data as BlogCategoria) : null;
  }

  // Busca em lote várias categorias pelos ids (evita N+1).
  // Utilizado para preencher a propriedade `categoria` dos posts
  // sem depender de JOIN/FK no PostgREST.
  async buscarPorIds(ids: string[]): Promise<Map<string, BlogCategoriaResumida>> {
    const mapa = new Map<string, BlogCategoriaResumida>();
    const semDuplicados = Array.from(new Set(ids.filter(Boolean)));

    if (semDuplicados.length === 0) return mapa;

    const { data, error } = await supabase
      .from('blog_categorias')
      .select(SELECT_COLUMNS)
      .in('id', semDuplicados);

    if (error) throw new Error(error.message);

    (data ?? []).forEach((row) => {
      const r = row as BlogCategoria;
      mapa.set(r.id, { id: r.id, nome: r.nome });
    });

    return mapa;
  }
}