// ✅ CORRIGIDO: Tipos consistentes com UUID

export type PostType = 'article' | 'video' | 'news';

// Categoria do blog (relação com blog_categorias)
export interface BlogCategoria {
  id: string;  // UUID
  nome: string;
  descricao?: string | null;
}

// Formato resumido exposto na API (id e nome)
export interface BlogCategoriaResumida {
  id: string | null;  // UUID ou null
  nome: string;
}

// ✅ BlogPost principal (UUID como string)
export interface BlogPost {
  id: string;          // ✅ UUID (string)
  slug: string;
  title: string;
  description: string;
  content: string;
  image: string;
  category: string;
  categoria_id: string;  // UUID
  reading_time: string;
  type: string;
  featured: boolean;
  video1: string;
  video2: string;
  author: string;
  author_image: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

// ✅ Linha exatamente como armazenada no Supabase (snake_case)
export interface BlogPostRow {
  id: string;          // ✅ UUID (string) - CORRIGIDO
  slug: string;
  title: string;
  description: string;
  image: string;
  category: string;
  categoria_id: string | null;  // ✅ UUID (string) ou null
  reading_time: string;
  content: string | null;
  type: PostType | null;
  tags: string[] | null;
  featured: boolean | null;
  video1: string | null;
  video2: string | null;
  author: string | null;
  author_image: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

// Parâmetros para listar posts
export interface ListBlogPostsParams {
  page: number;
  limit: number;
  category?: string;
  tag?: string;
  featured?: boolean;
}