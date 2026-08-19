import { Request, Response } from 'express';

import { ProductUploadService }
  from '../services/ProductUploadService';

import { AppError }
  from '../error/AppError';

export class ProductUploadController {

  private service =
    new ProductUploadService();

  upload = async (
    req: Request,
    res: Response
  ) => {

    try {

      const file = req.file;

      if (!file) {

        return res.status(400).json({
          success: false,
          message:
            'Nenhum arquivo enviado (campo "image")',
        });
      }

      const result =
        await this.service.uploadImage(
          file.buffer,
          file.originalname,
          file.mimetype
        );

      return res.status(201).json({

        success: true,

        data: {
          url: result.url,
          path: result.path,
          filename: result.filename,
          size: result.size,
          mimeType: result.mimeType,
          bucket: result.bucket,
        },

      });

    } catch (error) {

      console.error(
        '[ProductUploadController.upload]',
        error
      );

      if (
        error instanceof AppError
      ) {

        return res
          .status(error.statusCode)
          .json({
            success: false,
            message: error.message,
          });
      }

      return res.status(500).json({
        success: false,
        message:
          'Erro ao enviar imagem do produto',
      });
    }
  };
}