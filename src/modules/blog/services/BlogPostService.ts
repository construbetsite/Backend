import { BlogPostRepository } from '../repositories/BlogPostRepository';
import { ProductRepository } from '../../product/repositories/ProductRepository';
import { ProductListItem } from '../../product/types/Product';
import { AppError, ConflictError, NotFoundError } from '../errors/AppError';
import { supabase } from '../../../config/supabase';
// ✅ USAR OS TIPOS CORRETOS
import { BlogPost, ListBlogPostsParams, CreatePostDTO, UpdatePostDTO } from '../types/blogPost.types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * ✅ Valida product_ids: deve ser um array de UUIDs válidos.
 * Retorna 400 informando quais IDs são inválidos.
 */
function validateProductIds(productIds: unknown, fallbackProductIds?: unknown): string[] {
  const raw = productIds !== undefined ? productIds : fallbackProductIds;
  if (raw === undefined || raw === null) return [];

  const ids = (Array.isArray(raw) ? raw : [raw]).map((id: any) => String(id).trim()).filter(Boolean);

  const invalid = ids.filter((id) => !UUID_REGEX.test(id));
  if (invalid.length > 0) {
    throw new AppError(
      `product_ids contém IDs inválidos (esperado UUID): ${invalid.join(', ')}`,
      400,
    );
  }

  return ids;
}

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
  private productRepository = new ProductRepository();

  /**
   * ✅ ENRIQUECIMENTO: anexa os objetos dos produtos vinculados ao post.
   * Produtos com IDs não encontrados são simplesmente ignorados (validação suave).
   */
  private async attachProducts(
    post: BlogPost,
  ): Promise<BlogPost & { products: ProductListItem[] }> {
    const ids = Array.isArray((post as any).product_ids) ? (post as any).product_ids : [];
    const products = ids.length > 0 ? await this.productRepository.findByIds(ids) : [];
    return { ...post, products };
  }

  /**
   * ✅ AUTO-ENRIQUECIMENTO: Busca o nome da categoria se apenas categoria_id foi fornecido
   */
  private async enrichCategoryName(data: CreatePostDTO | UpdatePostDTO): Promise<void> {
    if (data.categoria_id && !data.category) {
      const { data: categoria, error } = await supabase
        .from('blog_categorias') // ✅ tabela correta (plural), igual ao BlogCategoriaRepository
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

    // ✅ PRODUCT_IDS: valida e normaliza (vazio se não enviado)
    // Aceita product_ids (snake_case) OU productIds (camelCase, vindo do frontend)
    const values = data as any;
    const rawProductIds = values.product_ids !== undefined ? values.product_ids : values.productIds;
    const product_ids = validateProductIds(rawProductIds);

    const slugInUse = await this.repository.slugExists(slug);
    if (slugInUse) {
      throw new ConflictError(`Já existe um post com o slug "${slug}"`);
    }

    return this.repository.create({ ...data, slug, product_ids });
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

  /**
   * ✅ Detalhe do post (por slug) com produtos vinculados inclusos.
   */
  async findBySlugWithProducts(slug: string): Promise<BlogPost & { products: ProductListItem[] }> {
    const post = await this.findBySlug(slug);
    return this.attachProducts(post);
  }

  /**
   * ✅ Detalhe do post (por id) com produtos vinculados inclusos.
   */
  async findByIdWithProducts(id: string): Promise<BlogPost & { products: ProductListItem[] }> {
    const post = await this.findById(id);
    return this.attachProducts(post);
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

    // ✅ PRODUCT_IDS (PATCH): só sobrescreve se vier no payload (vazio [] limpa)
    // Aceita product_ids OU productIds (camelCase do frontend) como fonte
    const values = data as any;
    const rawProductIds =
      values.product_ids !== undefined ? values.product_ids : values.productIds;

    const normalizedData: UpdatePostDTO & { product_ids?: string[] } = {
      ...data,
      ...(rawProductIds !== undefined
        ? { product_ids: validateProductIds(rawProductIds) }
        : {}),
    };

    const updated = await this.repository.update(id, normalizedData);
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