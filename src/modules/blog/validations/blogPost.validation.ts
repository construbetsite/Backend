import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// ============================================================
// SCHEMA DE CRIAÇÃO
// ============================================================

export const createBlogPostSchema = Joi.object({
  slug: Joi.string().min(1).optional(),
  title: Joi.string().min(1).required(),
  description: Joi.string().min(1).required(),
  content: Joi.string().allow('').optional(),

  category: Joi.string().min(1).optional().allow(null),
  categoria_id: Joi.string().uuid().allow(null).optional(),
  categoriaId: Joi.string().uuid().allow(null).optional(),

  reading_time: Joi.string().min(1).optional(),
  readingTime: Joi.string().min(1).optional(),

  type: Joi.string().valid('article', 'video', 'news').default('article'),
  tags: Joi.array().items(Joi.string().min(1)).optional(),
  product_ids: Joi.array().items(Joi.string().uuid()).optional(),
  productIds: Joi.array().items(Joi.string().uuid()).optional(),
  featured: Joi.boolean().optional(),

  // ✅ Campos de vídeo (aceitando todas as variações)
  video1: Joi.string().uri().allow('').optional(),
  video2: Joi.string().uri().allow('').optional(),
  video_url1: Joi.string().uri().allow('').optional(),
  video_url2: Joi.string().uri().allow('').optional(),
  videoUrl1: Joi.string().uri().allow('').optional(),
  videoUrl2: Joi.string().uri().allow('').optional(),

  author: Joi.string().allow('').optional(),
  author_image: Joi.string().uri().allow('').optional(),
  authorImage: Joi.string().uri().allow('').optional(),

  published_at: Joi.string().isoDate().allow(null).optional(),
  publishedAt: Joi.string().isoDate().allow(null).optional(),

  // Campos de imagem (camelCase)
  imageUrl: Joi.string().uri().allow(null).optional(),
  imagePath: Joi.string().allow(null).optional(),
  imageFilename: Joi.string().allow(null).optional(),
  imageSize: Joi.number().integer().min(0).allow(null).optional(),
  imageMimeType: Joi.string().allow(null).optional(),
  storageBucket: Joi.string().allow(null).optional(),

  // Campos de imagem (snake_case)
  image_url: Joi.string().uri().allow(null).optional(),
  image_path: Joi.string().allow(null).optional(),
  image_filename: Joi.string().allow(null).optional(),
  image_size: Joi.number().integer().min(0).allow(null).optional(),
  image_mime_type: Joi.string().allow(null).optional(),
  storage_bucket: Joi.string().allow(null).optional(),
}).custom((value, helpers) => {
  // Normalizar reading_time / readingTime
  if (value.reading_time && !value.readingTime) value.readingTime = value.reading_time;
  if (value.readingTime && !value.reading_time) value.reading_time = value.readingTime;

  // Normalizar author_image / authorImage
  if (value.author_image && !value.authorImage) value.authorImage = value.author_image;
  if (value.authorImage && !value.author_image) value.author_image = value.authorImage;

  // Normalizar campos de imagem camelCase → snake_case
  if (value.imageUrl && !value.image_url) value.image_url = value.imageUrl;
  if (value.imagePath && !value.image_path) value.image_path = value.imagePath;
  if (value.imageFilename && !value.image_filename) value.image_filename = value.imageFilename;
  if (value.imageSize && !value.image_size) value.image_size = value.imageSize;
  if (value.imageMimeType && !value.image_mime_type) value.image_mime_type = value.imageMimeType;
  if (value.storageBucket && !value.storage_bucket) value.storage_bucket = value.storageBucket;

  // Normalizar categoriaId ↔ categoria_id
  if (value.categoriaId && !value.categoria_id) value.categoria_id = value.categoriaId;
  if (value.categoria_id && !value.categoriaId) value.categoriaId = value.categoria_id;

  // Normalizar productIds → product_ids (frontend envia camelCase)
  if (value.productIds !== undefined) value.product_ids = value.productIds;

  // Normalizar publishedAt / published_at
  if (value.publishedAt && !value.published_at) value.published_at = value.publishedAt;
  if (value.published_at && !value.publishedAt) value.publishedAt = value.published_at;

  // ✅ Normalizar campos de vídeo para video1 / video2
  // video1
  if (value.video_url1 && !value.video1) value.video1 = value.video_url1;
  if (value.videoUrl1 && !value.video1) value.video1 = value.videoUrl1;
  if (value.video1 && !value.video_url1) value.video_url1 = value.video1;
  if (value.video1 && !value.videoUrl1) value.videoUrl1 = value.video1;

  // video2
  if (value.video_url2 && !value.video2) value.video2 = value.video_url2;
  if (value.videoUrl2 && !value.video2) value.video2 = value.videoUrl2;
  if (value.video2 && !value.video_url2) value.video_url2 = value.video2;
  if (value.video2 && !value.videoUrl2) value.videoUrl2 = value.video2;

  return value;
});

// ============================================================
// SCHEMA DE ATUALIZAÇÃO
// ============================================================

export const updateBlogPostSchema = Joi.object({
  slug: Joi.string().min(1).optional(),
  title: Joi.string().min(1).optional(),
  description: Joi.string().min(1).optional(),
  content: Joi.string().allow('').optional(),

  category: Joi.string().min(1).optional().allow(null),
  categoria_id: Joi.string().uuid().allow(null).optional(),
  categoriaId: Joi.string().uuid().allow(null).optional(),

  reading_time: Joi.string().min(1).optional(),
  readingTime: Joi.string().min(1).optional(),

  type: Joi.string().valid('article', 'video', 'news').optional(),
  tags: Joi.array().items(Joi.string().min(1)).optional(),
  product_ids: Joi.array().items(Joi.string().uuid()).optional(),
  productIds: Joi.array().items(Joi.string().uuid()).optional(),
  featured: Joi.boolean().optional(),
  status: Joi.boolean().optional(),

  video1: Joi.string().uri().allow('').optional(),
  video2: Joi.string().uri().allow('').optional(),
  video_url1: Joi.string().uri().allow('').optional(),
  video_url2: Joi.string().uri().allow('').optional(),
  videoUrl1: Joi.string().uri().allow('').optional(),
  videoUrl2: Joi.string().uri().allow('').optional(),

  author: Joi.string().allow('').optional(),
  author_image: Joi.string().uri().allow('').optional(),
  authorImage: Joi.string().uri().allow('').optional(),

  published_at: Joi.string().isoDate().allow(null).optional(),
  publishedAt: Joi.string().isoDate().allow(null).optional(),

  imageUrl: Joi.string().uri().allow(null).optional(),
  imagePath: Joi.string().allow(null).optional(),
  imageFilename: Joi.string().allow(null).optional(),
  imageSize: Joi.number().integer().min(0).allow(null).optional(),
  imageMimeType: Joi.string().allow(null).optional(),
  storageBucket: Joi.string().allow(null).optional(),

  image_url: Joi.string().uri().allow(null).optional(),
  image_path: Joi.string().allow(null).optional(),
  image_filename: Joi.string().allow(null).optional(),
  image_size: Joi.number().integer().min(0).allow(null).optional(),
  image_mime_type: Joi.string().allow(null).optional(),
  storage_bucket: Joi.string().allow(null).optional(),
}).min(1).messages({
  'object.min': 'Envie ao menos um campo para atualizar',
}).custom((value, helpers) => {
  // Mesmas normalizações do create
  if (value.reading_time && !value.readingTime) value.readingTime = value.reading_time;
  if (value.readingTime && !value.reading_time) value.reading_time = value.readingTime;

  if (value.author_image && !value.authorImage) value.authorImage = value.author_image;
  if (value.authorImage && !value.author_image) value.author_image = value.authorImage;

  if (value.imageUrl && !value.image_url) value.image_url = value.imageUrl;
  if (value.imagePath && !value.image_path) value.image_path = value.imagePath;
  if (value.imageFilename && !value.image_filename) value.image_filename = value.imageFilename;
  if (value.imageSize && !value.image_size) value.image_size = value.imageSize;
  if (value.imageMimeType && !value.image_mime_type) value.image_mime_type = value.imageMimeType;
  if (value.storageBucket && !value.storage_bucket) value.storage_bucket = value.storageBucket;

  if (value.categoriaId && !value.categoria_id) value.categoria_id = value.categoriaId;
  if (value.categoria_id && !value.categoriaId) value.categoriaId = value.categoria_id;

  if (value.productIds !== undefined) value.product_ids = value.productIds;

  if (value.publishedAt && !value.published_at) value.published_at = value.publishedAt;
  if (value.published_at && !value.publishedAt) value.publishedAt = value.published_at;

  if (value.video_url1 && !value.video1) value.video1 = value.video_url1;
  if (value.videoUrl1 && !value.video1) value.video1 = value.videoUrl1;
  if (value.video1 && !value.video_url1) value.video_url1 = value.video1;
  if (value.video1 && !value.videoUrl1) value.videoUrl1 = value.video1;

  if (value.video_url2 && !value.video2) value.video2 = value.video_url2;
  if (value.videoUrl2 && !value.video2) value.video2 = value.videoUrl2;
  if (value.video2 && !value.video_url2) value.video_url2 = value.video2;
  if (value.video2 && !value.videoUrl2) value.videoUrl2 = value.video2;

  return value;
});

// ============================================================
// MIDDLEWARE DE VALIDAÇÃO
// ============================================================

/**
 * Middleware que valida o corpo da requisição com o schema Joi.
 */
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      console.error('❌ Erro de validação:', error.details.map((d) => d.message));
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.details.map((detail) => detail.message),
      });
    }

    req.body = value;
    return next();
  };
};