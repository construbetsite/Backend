import { supabase } from '../../../config/supabase';

export interface LandingUploadResult {
  url: string;
  path: string;
  filename: string;
  size: number;
  mimeType: string;
  bucket: string;
}

/**
 * Repositório de Storage para o módulo de categorias da landing page.
 * Encapsula o acesso ao Supabase Storage e retorna URLs públicas
 * a partir do bucket configurado em LANDING_STORAGE_BUCKET
 * (default: landing-categories).
 */
export class LandingStorageRepository {
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.LANDING_STORAGE_BUCKET || 'landing-categories';
  }

  async uploadImage(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<LandingUploadResult> {
    const ext = this.getExtension(originalName, mimeType);
    const safeBase = this.sanitizeName(originalName.replace(/\.[^.]+$/, ''));
    const fileName = `${Date.now()}-${safeBase || 'category'}.${ext}`;
    const path = `landing/${fileName}`;

    const { error } = await supabase.storage
      .from(this.bucket)
      .upload(path, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: mimeType,
      });

    if (error) {
      console.error('[LandingStorageRepository.uploadImage]', error);
      throw new Error(error.message || 'Falha no upload da imagem');
    }

    const { data: publicData } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(path);

    return {
      url: publicData.publicUrl,
      path,
      filename: fileName,
      size: fileBuffer.length,
      mimeType,
      bucket: this.bucket,
    };
  }

  /** Remove um arquivo do bucket (best-effort, ignora erros). */
  async deleteByPath(path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.bucket)
        .remove([path]);

      if (error) {
        console.warn('[LandingStorageRepository.deleteByPath]', error.message);
      }
    } catch (error) {
      console.warn('[LandingStorageRepository.deleteByPath]', error);
    }
  }

  /**
   * Remove uma imagem a partir da URL pública (se a URL pertencer ao bucket).
   * Extrai o path da URL gerada pelo getPublicUrl e apaga o arquivo.
   */
  async deleteByPublicUrl(url: string): Promise<void> {
    const path = this.extractPathFromUrl(url);
    if (path) {
      await this.deleteByPath(path);
    }
  }

  /** Extrai o path interno do bucket a partir da URL pública. */
  extractPathFromUrl(url: string): string | null {
    if (!url) return null;

    const marker = `/landing-categories/`;
    const idx = url.indexOf(marker);

    if (idx === -1) return null;

    const path = url.slice(idx + marker.length).split('?')[0];
    return path || null;
  }

  private getExtension(originalName: string, mimeType: string): string {
    const fromName = originalName.split('.').pop()?.toLowerCase();
    if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;

    switch (mimeType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/gif':
        return 'gif';
      default:
        return 'bin';
    }
  }

  private sanitizeName(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }
}
