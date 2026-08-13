import { BlogPostRepository } from '../repositories/BlogPostRepository';
import { AppError, ConflictError, NotFoundError } from '../errors/AppError';
import { CreateBlogPostDTO } from '../dtos/CreateBlogPostDTO';
import { UpdateBlogPostDTO } from '../dtos/UpdateBlogPostDTO';
import { BlogPost, ListBlogPostsParams } from '../types/blogPost.types';

// Converte "Meu Post de Teste!" -> "meu-post-de-teste"
function generateSlug(text: string): string {
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // troca qualquer não alfanumérico por hífen
    .replace(/^-+|-+$/g, '') // remove hífens nas pontas
    .replace(/-{2,}/g, '-'); // evita hífens duplicados

  return normalized || 'post';
}

export class BlogPostService {
  private repository = new BlogPostRepository();

  async create(data: CreateBlogPostDTO): Promise<BlogPost> {
    // 1) Slug: usa o informado ou gera a partir do título
    const slug = data.slug?.trim() ? data.slug.trim() : generateSlug(data.title);

    // 2) Verifica unicidade do slug
    const slugInUse = await this.repository.slugExists(slug);
    if (slugInUse) {
      throw new ConflictError(`Já existe um post com o slug "${slug}"`);
    }

    // 3) Insere o post (UUID será gerado automaticamente pelo banco)
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

  // ✅ Aceita UUID (string)
  async findById(id: string): Promise<BlogPost> {
    const post = await this.repository.findById(id);
    if (!post) {
      throw new NotFoundError(`Post com id "${id}" não encontrado`);
    }
    return post;
  }

  // ✅ Aceita UUID (string)
  async update(id: string, data: UpdateBlogPostDTO): Promise<BlogPost> {
    // 1) Confirma que o post existe
    await this.findById(id);

    // 2) Se slug for alterado, garante unicidade (excluindo o próprio post)
    if (data.slug) {
      const slugInUse = await this.repository.slugExists(data.slug.trim(), id);
      if (slugInUse) {
        throw new ConflictError(`Já existe um post com o slug "${data.slug}"`);
      }
      data.slug = data.slug.trim();
    }

    // 3) Atualiza no banco
    const updated = await this.repository.update(id, data);
    if (!updated) {
      throw new NotFoundError(`Post com id "${id}" não encontrado`);
    }
    return updated;
  }

  // ✅ Aceita UUID (string)
  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.repository.delete(id);
  }
}