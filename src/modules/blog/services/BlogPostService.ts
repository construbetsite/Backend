import { BlogPostRepository } from '../repositories/BlogPostRepository';
import { AppError, ConflictError, NotFoundError } from '../errors/AppError';
import { supabase } from '../../../config/supabase';
// ✅ USAR OS TIPOS CORRETOS
import { BlogPost, ListBlogPostsParams, CreatePostDTO, UpdatePostDTO } from '../types/blogPost.types';

function generateSlug(text: string): string {
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return normalized || 'post';
}

export class BlogPostService {
  private repository = new BlogPostRepository();

  /**
   * ✅ AUTO-ENRIQUECIMENTO: Busca o nome da categoria se apenas categoria_id foi fornecido
   */
  private async enrichCategoryName(data: CreatePostDTO | UpdatePostDTO): Promise<void> {
    if (data.categoria_id && !data.category) {
      const { data: categoria, error } = await supabase
        .from('blog_categoria')
        .select('nome')
        .eq('id', data.categoria_id)
        .single();

      if (!error && categoria) {
        data.category = categoria.nome; // Preenche o campo com o nome legível
      }
    }
  }

  // ✅ USAR CreatePostDTO
  async create(data: CreatePostDTO): Promise<BlogPost> {
    // ✅ AUTO-PREENCHER CATEGORIA SE NECESSÁRIO
    await this.enrichCategoryName(data);

    const slug = data.slug?.trim() ? data.slug.trim() : generateSlug(data.title);

    const slugInUse = await this.repository.slugExists(slug);
    if (slugInUse) {
      throw new ConflictError(`Já existe um post com o slug "${slug}"`);
    }

    return this.repository.create({ ...data, slug });
  }

  async list(params: ListBlogPostsParams): Promise<{
    items: BlogPost[];
    total: number;
  }> {
    const { data, count } = await this.repository.findAll(params);
    return { items: data, total: count };
  }

  async findBySlug(slug: string): Promise<BlogPost> {
    const post = await this.repository.findBySlug(slug);
    if (!post) {
      throw new NotFoundError(`Post com slug "${slug}" não encontrado`);
    }
    return post;
  }

  async findById(id: string): Promise<BlogPost> {
    const post = await this.repository.findById(id);
    if (!post) {
      throw new NotFoundError(`Post com id "${id}" não encontrado`);
    }
    return post;
  }

  // ✅ USAR UpdatePostDTO
  async update(id: string, data: UpdatePostDTO): Promise<BlogPost> {
    await this.findById(id);

    // ✅ AUTO-PREENCHER CATEGORIA SE NECESSÁRIO
    await this.enrichCategoryName(data);

    if (data.slug) {
      const slugInUse = await this.repository.slugExists(data.slug.trim(), id);
      if (slugInUse) {
        throw new ConflictError(`Já existe um post com o slug "${data.slug}"`);
      }
      data.slug = data.slug.trim();
    }

    const updated = await this.repository.update(id, data);
    if (!updated) {
      throw new NotFoundError(`Post com id "${id}" não encontrado`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.repository.delete(id);
  }
}