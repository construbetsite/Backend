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
    const { page, limit, category, tag, featured, status } = params;
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

    // ✅ FILTRO POR STATUS (boolean)
    if (status !== undefined) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

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
        // Campos básicos
        slug: data.slug,
        title: data.title,
        description: data.description,
        content: data.content,
        category: data.category,
        categoria_id: data.categoria_id,
        reading_time: data.reading_time || '5 min',
        type: data.type || 'article',
        featured: data.featured || false,
        author: data.author || null,
        author_image: data.author_image || null,
        tags: data.tags || null,

        // ✅ CAMPOS DE IMAGEM
        image_url: data.image_url || null,
        image_path: data.image_path || null,
        image_filename: data.image_filename || null,
        image_size: data.image_size || null,
        image_mime_type: data.image_mime_type || null,
        storage_bucket: data.storage_bucket || null,

        // ✅ STATUS (boolean)
        status: data.status ?? true,

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

  async update(id: string, data: any): Promise<BlogPost | null> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Campos básicos (só adicionar se existirem)
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.categoria_id !== undefined) updateData.categoria_id = data.categoria_id;
    if (data.reading_time !== undefined) updateData.reading_time = data.reading_time;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.featured !== undefined) updateData.featured = data.featured;
    if (data.author !== undefined) updateData.author = data.author;
    if (data.author_image !== undefined) updateData.author_image = data.author_image;
    if (data.tags !== undefined) updateData.tags = data.tags;

    // ✅ CAMPOS DE IMAGEM
    if (data.image_url !== undefined) updateData.image_url = data.image_url;
    if (data.image_path !== undefined) updateData.image_path = data.image_path;
    if (data.image_filename !== undefined) updateData.image_filename = data.image_filename;
    if (data.image_size !== undefined) updateData.image_size = data.image_size;
    if (data.image_mime_type !== undefined) updateData.image_mime_type = data.image_mime_type;
    if (data.storage_bucket !== undefined) updateData.storage_bucket = data.storage_bucket;

    // ✅ STATUS (boolean)
    if (data.status !== undefined) updateData.status = data.status;

    const { data: post, error } = await supabase
      .from('blog_posts')
      .update(updateData)
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

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);

    if (error) {
      console.error('❌ Erro ao deletar post:', error);
      throw error;
    }
  }

  // ✅ MAPEAMENTO: converte snake_case do banco para camelCase do frontend
  private mapRowToPost(row: BlogPostRow): BlogPost {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      content: row.content || '',

      // ✅ CAMPOS DE IMAGEM
      image_url: row.image_url || null,
      image_path: row.image_path || null,
      image_filename: row.image_filename || null,
      image_size: row.image_size || null,
      image_mime_type: row.image_mime_type || null,
      storage_bucket: row.storage_bucket || null,

      category: row.category,
      categoria_id: row.categoria_id || '',
      reading_time: row.reading_time || '5 min',
      type: row.type || 'article',
      featured: row.featured || false,

      // ✅ STATUS (boolean)
      status: row.status ?? true,

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