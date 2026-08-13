import { BlogCategoriaRepository } from '../repositories/BlogCategoriaRepository';
import { BlogCategoria, BlogCategoriaResumida } from '../types/blogPost.types';

export class BlogCategoriaService {
  private repository = new BlogCategoriaRepository();

  // Retorna todas as categorias (id e nome), ordenadas por nome
  async listarTodas(): Promise<BlogCategoriaResumida[]> {
    return this.repository.listarTodas();
  }

  // Busca uma categoria pelo id (retorna null se não existir)
  async buscarPorId(id: string): Promise<BlogCategoria | null> {
    return this.repository.buscarPorId(id);
  }

  // Busca várias categorias pelos ids (consulta em lote, evita N+1)
  async buscarPorIds(
    ids: string[]
  ): Promise<Map<string, BlogCategoriaResumida>> {
    return this.repository.buscarPorIds(ids);
  }
}
