import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// ============================================================
// VALORES PERMITIDOS
// ============================================================

const COMMERCIAL_TYPES = ['PICKUP', 'ECOMMERCE'] as const;

// ============================================================
// FUNÇÃO AUXILIAR PARA NORMALIZAÇÃO (DRY)
// ============================================================

function normalizeField(value: Record<string, any>, camelKey: string, snakeKey: string): void {
  if (value[camelKey] !== undefined && !value[snakeKey]) {
    value[snakeKey] = value[camelKey];
  }
  if (value[snakeKey] !== undefined && !value[camelKey]) {
    value[camelKey] = value[snakeKey];
  }
}

// ============================================================
// SCHEMA DE CRIAÇÃO DE PRODUTO
// ============================================================

export const createProductSchema = Joi.object({
  // IDENTIFICAÇÃO
  name: Joi.string().min(1).max(255).required(),
  slug: Joi.string().min(1).max(255).optional(),
  sku: Joi.string().max(100).allow(null, '').optional(),

  // CATEGORIA
  category_id: Joi.string().uuid().allow(null).optional(),
  categoryId: Joi.string().uuid().allow(null).optional(),

  // INFORMAÇÕES DO PRODUTO
  brand: Joi.string().max(150).allow(null, '').optional(),
  short_description: Joi.string().max(500).allow(null, '').optional(),
  shortDescription: Joi.string().max(500).allow(null, '').optional(),
  description: Joi.string().allow('').optional(),

  // MODALIDADE COMERCIAL – ambos opcionais na definição,
  // obrigatoriedade é validada no .custom após normalização
  commercial_type: Joi.string()
    .valid(...COMMERCIAL_TYPES)
    .optional(),
  commercialType: Joi.string()
    .valid(...COMMERCIAL_TYPES)
    .optional(),

  // PREÇO
  price: Joi.number().min(0).precision(2).allow(null).optional(),

  // URL DO E-COMMERCE
  redirect_url: Joi.string().uri().allow(null, '').optional(),
  redirectUrl: Joi.string().uri().allow(null, '').optional(),

  // IMAGEM
  image_url: Joi.string().uri().allow(null, '').optional(),
  imageUrl: Joi.string().uri().allow(null, '').optional(),
  image_path: Joi.string().allow(null, '').optional(),
  imagePath: Joi.string().allow(null, '').optional(),
  image_filename: Joi.string().allow(null, '').optional(),
  imageFilename: Joi.string().allow(null, '').optional(),
  image_size: Joi.number().integer().min(0).max(5242880).allow(null).optional(),
  imageSize: Joi.number().integer().min(0).max(5242880).allow(null).optional(),
  image_mime_type: Joi.string()
    .valid('image/jpeg', 'image/png', 'image/webp')
    .allow(null, '')
    .optional(),
  imageMimeType: Joi.string()
    .valid('image/jpeg', 'image/png', 'image/webp')
    .allow(null, '')
    .optional(),
  storage_bucket: Joi.string().allow(null, '').optional(),
  storageBucket: Joi.string().allow(null, '').optional(),

  // CONTROLE
  featured: Joi.boolean().default(false).optional(),
  display_order: Joi.number().integer().min(0).default(0).optional(),
  displayOrder: Joi.number().integer().min(0).default(0).optional(),
  active: Joi.boolean().default(true).optional(),

  // SEO
  meta_title: Joi.string().max(255).allow(null, '').optional(),
  metaTitle: Joi.string().max(255).allow(null, '').optional(),
  meta_description: Joi.string().max(500).allow(null, '').optional(),
  metaDescription: Joi.string().max(500).allow(null, '').optional(),
})
  .custom((value, helpers) => {
    // ==========================================================
    // NORMALIZAÇÃO (camelCase ↔ snake_case)
    // ==========================================================

    normalizeField(value, 'categoryId', 'category_id');
    normalizeField(value, 'commercialType', 'commercial_type');
    normalizeField(value, 'shortDescription', 'short_description');
    normalizeField(value, 'redirectUrl', 'redirect_url');
    normalizeField(value, 'imageUrl', 'image_url');
    normalizeField(value, 'imagePath', 'image_path');
    normalizeField(value, 'imageFilename', 'image_filename');
    normalizeField(value, 'imageSize', 'image_size');
    normalizeField(value, 'imageMimeType', 'image_mime_type');
    normalizeField(value, 'storageBucket', 'storage_bucket');
    normalizeField(value, 'displayOrder', 'display_order');
    normalizeField(value, 'metaTitle', 'meta_title');
    normalizeField(value, 'metaDescription', 'meta_description');

    // ==========================================================
    // VALIDAÇÃO DE OBRIGATORIEDADE (comercial_type)
    // ==========================================================

    if (!value.commercial_type) {
      return helpers.error('any.custom', {
        message: 'Tipo comercial é obrigatório.',
      });
    }

    // ==========================================================
    // REGRAS COMERCIAIS (PICKUP / ECOMMERCE)
    // ==========================================================

    const commercialType = value.commercial_type;
    const price = value.price;
    const redirectUrl = value.redirect_url;

    if (commercialType === 'PICKUP') {
      if (price === null || price === undefined) {
        return helpers.error('any.custom', {
          message: 'Produtos de retirada (PICKUP) devem possuir preço.',
        });
      }
      if (redirectUrl !== null && redirectUrl !== undefined && redirectUrl !== '') {
        return helpers.error('any.custom', {
          message: 'Produtos de retirada (PICKUP) não devem possuir URL de e-commerce.',
        });
      }
    }

    if (commercialType === 'ECOMMERCE') {
      if (!redirectUrl || redirectUrl.trim() === '') {
        return helpers.error('any.custom', {
          message: 'Produtos de e-commerce devem possuir URL de encaminhamento.',
        });
      }
      if (price !== null && price !== undefined) {
        return helpers.error('any.custom', {
          message: 'Produtos de e-commerce não devem possuir preço.',
        });
      }
    }

    return value;
  });

// ============================================================
// SCHEMA DE ATUALIZAÇÃO
// ============================================================

export const updateProductSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  slug: Joi.string().min(1).max(255).optional(),
  sku: Joi.string().max(100).allow(null, '').optional(),

  category_id: Joi.string().uuid().allow(null).optional(),
  categoryId: Joi.string().uuid().allow(null).optional(),

  brand: Joi.string().max(150).allow(null, '').optional(),
  short_description: Joi.string().max(500).allow(null, '').optional(),
  shortDescription: Joi.string().max(500).allow(null, '').optional(),
  description: Joi.string().allow('').optional(),

  commercial_type: Joi.string().valid(...COMMERCIAL_TYPES).optional(),
  commercialType: Joi.string().valid(...COMMERCIAL_TYPES).optional(),

  price: Joi.number().min(0).precision(2).allow(null).optional(),
  redirect_url: Joi.string().uri().allow(null, '').optional(),
  redirectUrl: Joi.string().uri().allow(null, '').optional(),

  image_url: Joi.string().uri().allow(null, '').optional(),
  imageUrl: Joi.string().uri().allow(null, '').optional(),
  image_path: Joi.string().allow(null, '').optional(),
  imagePath: Joi.string().allow(null, '').optional(),
  image_filename: Joi.string().allow(null, '').optional(),
  imageFilename: Joi.string().allow(null, '').optional(),
  image_size: Joi.number().integer().min(0).max(5242880).allow(null).optional(),
  imageSize: Joi.number().integer().min(0).max(5242880).allow(null).optional(),
  image_mime_type: Joi.string()
    .valid('image/jpeg', 'image/png', 'image/webp')
    .allow(null, '')
    .optional(),
  imageMimeType: Joi.string()
    .valid('image/jpeg', 'image/png', 'image/webp')
    .allow(null, '')
    .optional(),
  storage_bucket: Joi.string().allow(null, '').optional(),
  storageBucket: Joi.string().allow(null, '').optional(),

  featured: Joi.boolean().optional(),
  display_order: Joi.number().integer().min(0).optional(),
  displayOrder: Joi.number().integer().min(0).optional(),
  active: Joi.boolean().optional(),

  meta_title: Joi.string().max(255).allow(null, '').optional(),
  metaTitle: Joi.string().max(255).allow(null, '').optional(),
  meta_description: Joi.string().max(500).allow(null, '').optional(),
  metaDescription: Joi.string().max(500).allow(null, '').optional(),
})
  .min(1)
  .custom((value, helpers) => {
    // Normalização (mesma lógica)
    normalizeField(value, 'categoryId', 'category_id');
    normalizeField(value, 'commercialType', 'commercial_type');
    normalizeField(value, 'shortDescription', 'short_description');
    normalizeField(value, 'redirectUrl', 'redirect_url');
    normalizeField(value, 'imageUrl', 'image_url');
    normalizeField(value, 'imagePath', 'image_path');
    normalizeField(value, 'imageFilename', 'image_filename');
    normalizeField(value, 'imageSize', 'image_size');
    normalizeField(value, 'imageMimeType', 'image_mime_type');
    normalizeField(value, 'storageBucket', 'storage_bucket');
    normalizeField(value, 'displayOrder', 'display_order');
    normalizeField(value, 'metaTitle', 'meta_title');
    normalizeField(value, 'metaDescription', 'meta_description');

    // Regras comerciais (apenas se commercial_type estiver presente)
    const commercialType = value.commercial_type;
    if (commercialType) {
      const price = value.price;
      const redirectUrl = value.redirect_url;

      if (commercialType === 'PICKUP') {
        if (price === null || price === undefined) {
          return helpers.error('any.custom', {
            message: 'Produtos de retirada (PICKUP) devem possuir preço.',
          });
        }
        if (redirectUrl !== null && redirectUrl !== undefined && redirectUrl !== '') {
          return helpers.error('any.custom', {
            message: 'Produtos de retirada (PICKUP) não devem possuir URL de e-commerce.',
          });
        }
      }

      if (commercialType === 'ECOMMERCE') {
        if (!redirectUrl || redirectUrl.trim() === '') {
          return helpers.error('any.custom', {
            message: 'Produtos de e-commerce devem possuir URL de encaminhamento.',
          });
        }
        if (price !== null && price !== undefined) {
          return helpers.error('any.custom', {
            message: 'Produtos de e-commerce não devem possuir preço.',
          });
        }
      }
    }

    return value;
  })
  .messages({
    'object.min': 'Envie ao menos um campo para atualizar',
  });

// ============================================================
// MIDDLEWARE DE VALIDAÇÃO
// ============================================================

export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      console.error(
        '❌ Erro de validação:',
        error.details.map((detail) => detail.message)
      );

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