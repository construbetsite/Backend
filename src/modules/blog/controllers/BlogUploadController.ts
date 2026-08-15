import { Request, Response } from 'express';
import { BlogUploadService } from '../services/BlogUploadService';
import { AppError } from '../errors/AppError';

export class BlogUploadController {
  private service = new BlogUploadService();

  upload = async (req: Request, res: Response) => {
    try {
      // multer (memoryStorage) deixa o arquivo em req.file
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo enviado (campo "image")',
        });
      }

      const result = await this.service.uploadImage(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      return res.status(201).json({
        success: true,
        data: {
          url: result.url,
          path: result.path,
        },
      });
    } catch (error) {
      console.error('[BlogUploadController.upload]', error);
      if (error instanceof AppError) {
        return res
          .status(error.statusCode)
          .json({ success: false, message: error.message });
      }
      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar imagem',
      });
    }
  };
}
