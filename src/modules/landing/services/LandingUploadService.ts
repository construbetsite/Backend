import { LandingStorageRepository } from '../repositories/LandingStorageRepository';
import { AppError } from '../errors/AppError';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// ✅ Extensões permitidas (incluindo GIF, conforme especificação)
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export class LandingUploadService {
  private repository = new LandingStorageRepository();

  async uploadImage(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string
  ) {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new AppError('Arquivo de imagem vazio', 400);
    }
    if (fileBuffer.length > MAX_SIZE) {
      throw new AppError('Imagem maior que 5MB', 413);
    }
    if (!ALLOWED_MIME.has(mimeType)) {
      throw new AppError(
        'Formato inválido. Use JPEG, PNG, WEBP ou GIF',
        415
      );
    }

    return this.repository.uploadImage(fileBuffer, originalName, mimeType);
  }
}
