import { supabase } from '../../../config/supabase';

export interface ProductUploadResult {
  url: string;
  path: string;
  filename: string;
  size: number;
  mimeType: string;
  bucket: string;
}

export class ProductStorageRepository {

  private readonly bucket: string;

  constructor() {
    this.bucket =
      process.env.PRODUCT_STORAGE_BUCKET ||
      'products-images';
  }

  async uploadImage(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<ProductUploadResult> {

    const ext =
      this.getExtension(
        originalName,
        mimeType
      );

    const safeBase =
      this.sanitizeName(
        originalName.replace(
          /\.[^.]+$/,
          ''
        )
      );

    const fileName =
      `${Date.now()}-${safeBase || 'product'}.${ext}`;

    const path =
      `products/${fileName}`;

    const { error } =
      await supabase.storage
        .from(this.bucket)
        .upload(
          path,
          fileBuffer,
          {
            cacheControl: '3600',
            upsert: false,
            contentType: mimeType,
          }
        );

    if (error) {

      console.error(
        '[ProductStorageRepository.uploadImage]',
        error
      );

      throw new Error(
        error.message ||
        'Falha no upload da imagem'
      );
    }

    const {
      data: publicData
    } =
      supabase.storage
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

  async deleteByPath(
    path: string
  ): Promise<void> {

    try {

      const { error } =
        await supabase.storage
          .from(this.bucket)
          .remove([path]);

      if (error) {

        console.warn(
          '[ProductStorageRepository.deleteByPath]',
          error.message
        );
      }

    } catch (error) {

      console.warn(
        '[ProductStorageRepository.deleteByPath]',
        error
      );
    }
  }

  private getExtension(
    originalName: string,
    mimeType: string
  ): string {

    const fromName =
      originalName
        .split('.')
        .pop()
        ?.toLowerCase();

    if (
      fromName &&
      /^[a-z0-9]+$/.test(fromName)
    ) {
      return fromName;
    }

    switch (mimeType) {

      case 'image/jpeg':
        return 'jpg';

      case 'image/png':
        return 'png';

      case 'image/webp':
        return 'webp';

      default:
        return 'bin';
    }
  }

  private sanitizeName(
    name: string
  ): string {

    return name
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        '-'
      )
      .replace(
        /^-+|-+$/g,
        ''
      )
      .slice(0, 60);
  }
}