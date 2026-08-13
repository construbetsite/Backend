import { PostType } from '../types/blogPost.types';

export type CreateBlogPostDTO = {
  slug?: string;
  title: string;
  description: string;
  image: string;
  // Categoria é texto (coluna `category`), sem FK para blog_categorias
  category: string;
  readingTime: string;
  content?: string;
  type?: PostType;
  tags?: string[];
  featured?: boolean;
  video1?: string;
  video2?: string;
  author?: string;
  authorImage?: string;
};
