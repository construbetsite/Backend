export type PostType = 'article' | 'video' | 'news';

export interface BlogCategoria {
  id: string;
  nome: string;
  descricao?: string | null;
}

export interface BlogCategoriaResumida {
  id: string | null;
  nome: string;
}

export interface BlogPost {
  id: string;
  slug: string | null;
  title: string | null;
  description: string | null;
  content: string | null;

  // ✅ CAMPOS DE IMAGEM CORRETOS
  image_url: string | null;
  image_path: string | null;
  image_filename: string | null;
  image_size: number | null;
  image_mime_type: string | null;
  storage_bucket: string | null;

  category: string | null;
  categoria_id: string | null;
  reading_time: string;
  type: string;
  featured: boolean;
  video1: string | null;
  video2: string | null;
  author: string | null;
  author_image: string | null;
  tags: any;
  product_ids: string[];

  // ✅ STATUS
  status: boolean;

  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface BlogPostRow {
  id: string;
  slug: string | null;
  title: string | null;
  description: string | null;
  content: string | null;

  // ✅ CAMPOS DE IMAGEM CORRETOS
  image_url: string | null;
  image_path: string | null;
  image_filename: string | null;
  image_size: number | null;
  image_mime_type: string | null;
  storage_bucket: string | null;

  category: string | null;
  categoria_id: string | null;
  reading_time: string;

  type: PostType | null;
  tags: string[] | null;
  product_ids: string[] | null;
  featured: boolean | null;
  status: boolean | null;  // ✅ status (não ativo)
  video1: string | null;
  video2: string | null;
  author: string | null;
  author_image: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface ListBlogPostsParams {
  page: number;
  limit: number;
  category?: string;
  tag?: string;
  featured?: boolean;
  status?: boolean;  // ✅ status (não ativo)
}

// ✅ DTOs PARA CREATE/UPDATE
export interface CreatePostDTO {
  slug?: string;
  title: string;
  content: string;
  description?: string | null;
  category?: string | null;
  categoria_id?: string | null;
  reading_time?: string;
  type?: string;
  featured?: boolean;
  author?: string | null;
  author_image?: string | null;
  tags?: any;
  product_ids?: string[];
  productIds?: string[];
  image_url?: string | null;
  image_path?: string | null;
  image_filename?: string | null;
  image_size?: number | null;
  image_mime_type?: string | null;
  storage_bucket?: string | null;
  status?: boolean;
}

export interface UpdatePostDTO {
  slug?: string;
  title?: string;
  content?: string;
  description?: string | null;
  category?: string | null;
  categoria_id?: string | null;
  reading_time?: string;
  type?: string;
  featured?: boolean;
  author?: string | null;
  author_image?: string | null;
  tags?: any;
  product_ids?: string[];
  productIds?: string[];
  image_url?: string | null;
  image_path?: string | null;
  image_filename?: string | null;
  image_size?: number | null;
  image_mime_type?: string | null;
  storage_bucket?: string | null;
  status?: boolean;
}