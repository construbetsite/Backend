import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const createBlogPostSchema = Joi.object({
  // ✅ Aceitar tanto snake_case quanto camelCase
  slug: Joi.string().min(1).optional(),
  title: Joi.string().min(1).required(),
  description: Joi.string().min(1).required(),
  content: Joi.string().allow('').optional(),
  image: Joi.string().uri().required(),
  
  // ✅ Campos de categoria
  category: Joi.string().min(1).required(),
  categoria_id: Joi.string().uuid().allow(null).optional(),  // ✅ ADICIONADO
  
  // ✅ Aceitar reading_time (snake_case) como alternativa
  reading_time: Joi.string().min(1).optional(),
  readingTime: Joi.string().min(1).optional(),
  
  type: Joi.string().valid('article', 'video', 'news').default('article'),
  tags: Joi.array().items(Joi.string().min(1)).optional(),
  featured: Joi.boolean().optional(),
  
  video1: Joi.string().uri().allow('').optional(),
  video2: Joi.string().uri().allow('').optional(),
  
  author: Joi.string().allow('').optional(),
  author_image: Joi.string().uri().allow('').optional(),  // ✅ ADICIONADO
  authorImage: Joi.string().uri().allow('').optional(),
  
  published_at: Joi.string().isoDate().allow(null).optional(),  // ✅ ADICIONADO
}).custom((value, helpers) => {
  // ✅ Normalizar: se tiver reading_time, copiar para readingTime
  if (value.reading_time && !value.readingTime) {
    value.readingTime = value.reading_time;
  }
  
  // ✅ Normalizar: se tiver author_image, copiar para authorImage
  if (value.author_image && !value.authorImage) {
    value.authorImage = value.author_image;
  }
  
  return value;
});

export const updateBlogPostSchema = Joi.object({
  slug: Joi.string().min(1).optional(),
  title: Joi.string().min(1).optional(),
  description: Joi.string().min(1).optional(),
  content: Joi.string().allow('').optional(),
  image: Joi.string().uri().optional(),
  category: Joi.string().min(1).optional(),
  categoria_id: Joi.string().uuid().allow(null).optional(),  // ✅ ADICIONADO
  reading_time: Joi.string().min(1).optional(),
  readingTime: Joi.string().min(1).optional(),
  type: Joi.string().valid('article', 'video', 'news').optional(),
  tags: Joi.array().items(Joi.string().min(1)).optional(),
  featured: Joi.boolean().optional(),
  video1: Joi.string().uri().allow('').optional(),
  video2: Joi.string().uri().allow('').optional(),
  author: Joi.string().allow('').optional(),
  author_image: Joi.string().uri().allow('').optional(),
  authorImage: Joi.string().uri().allow('').optional(),
  published_at: Joi.string().isoDate().allow(null).optional(),
}).min(1).messages({
  'object.min': 'Envie ao menos um campo para atualizar',
}).custom((value, helpers) => {
  // ✅ Normalizar campos
  if (value.reading_time && !value.readingTime) {
    value.readingTime = value.reading_time;
  }
  if (value.author_image && !value.authorImage) {
    value.authorImage = value.author_image;
  }
  return value;
});

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