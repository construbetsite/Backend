import { supabase } from '../../../config/supabase';
import { BlogPost, BlogPostRow, ListBlogPostsParams } from '../types/blogPost.types';

export class BlogPostRepository {
  // ✅ Buscar por UUID
  async findById(id: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Não encontrado
      console.error('❌ Erro ao buscar post por ID:', error);
      throw error;
    }

    return this.mapRowToPost(data);
  }

  async findBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('❌ Erro ao buscar post por slug:', error);
      throw error;
    }

    return this.mapRowToPost(data);
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.limit(1);

    if (error) {
      console.error('❌ Erro ao verificar slug:', error);
      throw error;
    }

    return data && data.length > 0;
  }

  async findAll(params: ListBlogPostsParams): Promise<{ data: BlogPost[]; count: number }> {
    const { page, limit, category, tag, featured } = params;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    if (featured !== undefined) {
      query = query.eq('featured', featured);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Erro ao listar posts:', error);
      throw error;
    }

    const mappedData = (data || []).map((row: BlogPostRow) => this.mapRowToPost(row));

    return { data: mappedData, count: count || 0 };
  }

  async create(data: any): Promise<BlogPost> {
    const { data: post, error } = await supabase
      .from('blog_posts')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar post:', error);
      throw error;
    }

    return this.mapRowToPost(post);
  }

  // ✅ Atualizar por UUID
  async update(id: string, data: any): Promise<BlogPost | null> {
    const { data: post, error } = await supabase
      .from('blog_posts')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('❌ Erro ao atualizar post:', error);
      throw error;
    }

    return this.mapRowToPost(post);
  }

  // ✅ Deletar por UUID
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Erro ao deletar post:', error);
      throw error;
    }
  }

  // ✅ Mapper: converte snake_case do banco para camelCase do frontend
  private mapRowToPost(row: BlogPostRow): BlogPost {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      content: row.content || '',
      image: row.image,
      category: row.category,
      categoria_id: row.categoria_id || '', // Adicionei categoria_id para manter consistência
      reading_time: row.reading_time || '5 min',
      type: row.type || 'article',
      featured: row.featured || false,
      video1: row.video1 || '',
      video2: row.video2 || '',
      author: row.author || '',
      author_image: row.author_image || '',
      tags: row.tags || [],
      created_at: row.created_at,
      updated_at: row.updated_at || row.created_at,
      published_at: row.published_at || null,
    };
  }
}