import { PostType } from '../types/blogPost.types';

export type CreateBlogPostDTO = {
  slug?: string;
  title: string;
  description: string;
  content?: string;
  
  // ✅ Categoria: opcional, será auto-preenchida pelo backend se apenas categoria_id for fornecido
  category?: string | null;
  categoria_id?: string | null;
  
  readingTime?: string;
  reading_time?: string;
  type?: PostType;
  tags?: string[];
  featured?: boolean;
  status?: boolean;
  
  video1?: string | null;
  video2?: string | null;
  
  author?: string | null;
  authorImage?: string | null;
  author_image?: string | null;
  
  // ✅ CAMPOS DE IMAGEM REAIS (todos opcionais)
  image_url?: string | null;
  imageUrl?: string | null;
  
  image_path?: string | null;
  imagePath?: string | null;
  
  image_filename?: string | null;
  imageFilename?: string | null;
  
  image_size?: number | null;
  imageSize?: number | null;
  
  image_mime_type?: string | null;
  imageMimeType?: string | null;
  
  storage_bucket?: string | null;
  storageBucket?: string | null;
  
  published_at?: string | null;
  publishedAt?: string | null;
};
