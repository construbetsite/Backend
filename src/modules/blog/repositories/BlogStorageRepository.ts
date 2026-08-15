import { supabase } from '../../../config/supabase';

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Repositório de Storage para o módulo do blog.
 * Encapsula o acesso ao Supabase Storage e retorna URLs públicas
 * a partir do bucket configurado em BLOG_STORAGE_BUCKET.
 */
export class BlogStorageRepository {
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.BLOG_STORAGE_BUCKET || 'posts-images';
  }

  /**
   * Faz upload de um arquivo (Buffer) para o bucket e retorna a URL pública.
   * O caminho é gerado com timestamp + nome sanitizado para evitar colisões.
   */
  async uploadImage(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<UploadResult> {
    const ext = this.getExtension(originalName, mimeType);
    const safeBase = this.sanitizeName(originalName.replace(/\.[^.]+$/, ''));
    const fileName = `${Date.now()}-${safeBase || 'image'}.${ext}`;
    const path = `posts/${fileName}`;

    const { error } = await supabase.storage
      .from(this.bucket)
      .upload(path, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: mimeType,
      });

    if (error) {
      console.error('❌ Erro ao enviar imagem para o Storage:', error);
      throw new Error(error.message || 'Falha no upload da imagem');
    }

    const { data: publicData } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(path);

    return {
      url: publicData.publicUrl,
      path,
    };
  }

  /** Remove um arquivo do bucket (best-effort, ignora erros). */
  async deleteByPath(path: string): Promise<void> {
    try {
      await supabase.storage.from(this.bucket).remove([path]);
    } catch (err) {
      console.warn('[BlogStorageRepository] Falha ao remover arquivo:', err);
    }
  }

  private getExtension(originalName: string, mimeType: string): string {
    const fromName = originalName.split('.').pop()?.toLowerCase();
    if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
    if (mimeType === 'image/jpeg') return 'jpg';
    if (mimeType === 'image/png') return 'png';
    if (mimeType === 'image/webp') return 'webp';
    return 'bin';
  }

  private sanitizeName(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }
}
