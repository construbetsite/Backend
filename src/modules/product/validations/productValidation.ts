import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// ============================================================
// VALORES PERMITIDOS
// ============================================================

const COMMERCIAL_TYPES = [
  'PICKUP',
  'ECOMMERCE',
] as const;


// ============================================================
// SCHEMA DE CRIAÇÃO DE PRODUTO
// ============================================================

export const createProductSchema = Joi.object({

  // ----------------------------------------------------------
  // IDENTIFICAÇÃO
  // ----------------------------------------------------------

  name: Joi.string()
    .min(1)
    .max(255)
    .required(),

  slug: Joi.string()
    .min(1)
    .max(255)
    .optional(),

  sku: Joi.string()
    .max(100)
    .allow(null, '')
    .optional(),

  // ----------------------------------------------------------
  // CATEGORIA
  // ----------------------------------------------------------

  category_id: Joi.string()
    .uuid()
    .allow(null)
    .optional(),

  categoryId: Joi.string()
    .uuid()
    .allow(null)
    .optional(),

  // ----------------------------------------------------------
  // INFORMAÇÕES DO PRODUTO
  // ----------------------------------------------------------

  brand: Joi.string()
    .max(150)
    .allow(null, '')
    .optional(),

  short_description: Joi.string()
    .max(500)
    .allow(null, '')
    .optional(),

  shortDescription: Joi.string()
    .max(500)
    .allow(null, '')
    .optional(),

  description: Joi.string()
    .allow('')
    .optional(),

  // ----------------------------------------------------------
  // MODALIDADE COMERCIAL
  // ----------------------------------------------------------

  commercial_type: Joi.string()
    .valid(...COMMERCIAL_TYPES)
    .required(),

  commercialType: Joi.string()
    .valid(...COMMERCIAL_TYPES)
    .optional(),

  // ----------------------------------------------------------
  // PREÇO
  //
  // PICKUP:
  //   obrigatório
  //
  // ECOMMERCE:
  //   não permitido
  // ----------------------------------------------------------

  price: Joi.number()
    .min(0)
    .precision(2)
    .allow(null)
    .optional(),

  // ----------------------------------------------------------
  // URL DO E-COMMERCE
  //
  // ECOMMERCE:
  //   obrigatória
  //
  // PICKUP:
  //   não necessária
  // ----------------------------------------------------------

  redirect_url: Joi.string()
    .uri()
    .allow(null, '')
    .optional(),

  redirectUrl: Joi.string()
    .uri()
    .allow(null, '')
    .optional(),

  // ----------------------------------------------------------
  // IMAGEM
  // ----------------------------------------------------------

  image_url: Joi.string()
    .uri()
    .allow(null, '')
    .optional(),

  imageUrl: Joi.string()
    .uri()
    .allow(null, '')
    .optional(),

  image_path: Joi.string()
    .allow(null, '')
    .optional(),

  imagePath: Joi.string()
    .allow(null, '')
    .optional(),

  image_filename: Joi.string()
    .allow(null, '')
    .optional(),

  imageFilename: Joi.string()
    .allow(null, '')
    .optional(),

  image_size: Joi.number()
    .integer()
    .min(0)
    .max(5242880)
    .allow(null)
    .optional(),

  imageSize: Joi.number()
    .integer()
    .min(0)
    .max(5242880)
    .allow(null)
    .optional(),

  image_mime_type: Joi.string()
    .valid(
      'image/jpeg',
      'image/png',
      'image/webp'
    )
    .allow(null, '')
    .optional(),

  imageMimeType: Joi.string()
    .valid(
      'image/jpeg',
      'image/png',
      'image/webp'
    )
    .allow(null, '')
    .optional(),

  storage_bucket: Joi.string()
    .allow(null, '')
    .optional(),

  storageBucket: Joi.string()
    .allow(null, '')
    .optional(),

  // ----------------------------------------------------------
  // CONTROLE
  // ----------------------------------------------------------

  featured: Joi.boolean()
    .default(false)
    .optional(),

  display_order: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .optional(),

  displayOrder: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .optional(),

  active: Joi.boolean()
    .default(true)
    .optional(),

  // ----------------------------------------------------------
  // SEO
  // ----------------------------------------------------------

  meta_title: Joi.string()
    .max(255)
    .allow(null, '')
    .optional(),

  metaTitle: Joi.string()
    .max(255)
    .allow(null, '')
    .optional(),

  meta_description: Joi.string()
    .max(500)
    .allow(null, '')
    .optional(),

  metaDescription: Joi.string()
    .max(500)
    .allow(null, '')
    .optional(),

}).custom((value, helpers) => {

  // ==========================================================
  // NORMALIZAÇÃO
  // ==========================================================

  if (
    value.categoryId &&
    !value.category_id
  ) {
    value.category_id = value.categoryId;
  }

  if (
    value.category_id &&
    !value.categoryId
  ) {
    value.categoryId = value.category_id;
  }


  if (
    value.commercialType &&
    !value.commercial_type
  ) {
    value.commercial_type =
      value.commercialType;
  }

  if (
    value.commercial_type &&
    !value.commercialType
  ) {
    value.commercialType =
      value.commercial_type;
  }


  if (
    value.shortDescription &&
    !value.short_description
  ) {
    value.short_description =
      value.shortDescription;
  }

  if (
    value.short_description &&
    !value.shortDescription
  ) {
    value.shortDescription =
      value.short_description;
  }


  if (
    value.redirectUrl &&
    !value.redirect_url
  ) {
    value.redirect_url =
      value.redirectUrl;
  }

  if (
    value.redirect_url &&
    !value.redirectUrl
  ) {
    value.redirectUrl =
      value.redirect_url;
  }


  if (
    value.imageUrl &&
    !value.image_url
  ) {
    value.image_url = value.imageUrl;
  }

  if (
    value.imagePath &&
    !value.image_path
  ) {
    value.image_path = value.imagePath;
  }

  if (
    value.imageFilename &&
    !value.image_filename
  ) {
    value.image_filename =
      value.imageFilename;
  }

  if (
    value.imageSize !== undefined &&
    value.image_size === undefined
  ) {
    value.image_size = value.imageSize;
  }

  if (
    value.imageMimeType &&
    !value.image_mime_type
  ) {
    value.image_mime_type =
      value.imageMimeType;
  }

  if (
    value.storageBucket &&
    !value.storage_bucket
  ) {
    value.storage_bucket =
      value.storageBucket;
  }


  if (
    value.displayOrder !== undefined &&
    value.display_order === undefined
  ) {
    value.display_order =
      value.displayOrder;
  }


  if (
    value.metaTitle &&
    !value.meta_title
  ) {
    value.meta_title =
      value.metaTitle;
  }

  if (
    value.metaDescription &&
    !value.meta_description
  ) {
    value.meta_description =
      value.metaDescription;
  }


  // ==========================================================
  // REGRAS COMERCIAIS
  // ==========================================================

  const commercialType =
    value.commercial_type;

  const price = value.price;

  const redirectUrl =
    value.redirect_url;


  // ----------------------------------------------------------
  // PICKUP
  // ----------------------------------------------------------

  if (commercialType === 'PICKUP') {

    if (
      price === null ||
      price === undefined
    ) {
      return helpers.error(
        'any.custom',
        {
          message:
            'Produtos de retirada (PICKUP) devem possuir preço.',
        }
      );
    }

    if (
      redirectUrl !== null &&
      redirectUrl !== undefined &&
      redirectUrl !== ''
    ) {
      return helpers.error(
        'any.custom',
        {
          message:
            'Produtos de retirada (PICKUP) não devem possuir URL de e-commerce.',
        }
      );
    }
  }


  // ----------------------------------------------------------
  // ECOMMERCE
  // ----------------------------------------------------------

  if (commercialType === 'ECOMMERCE') {

    if (
      !redirectUrl ||
      redirectUrl.trim() === ''
    ) {
      return helpers.error(
        'any.custom',
        {
          message:
            'Produtos de e-commerce devem possuir URL de encaminhamento.',
        }
      );
    }

    if (
      price !== null &&
      price !== undefined
    ) {
      return helpers.error(
        'any.custom',
        {
          message:
            'Produtos de e-commerce não devem possuir preço.',
        }
      );
    }
  }


  return value;

});


// ============================================================
// SCHEMA DE ATUALIZAÇÃO
// ============================================================

export const updateProductSchema = Joi.object({

  name: Joi.string()
    .min(1)
    .max(255)
    .optional(),

  slug: Joi.string()
    .min(1)
    .max(255)
    .optional(),

  sku: Joi.string()
    .max(100)
    .allow(null, '')
    .optional(),

  category_id: Joi.string()
    .uuid()
    .allow(null)
    .optional(),

  categoryId: Joi.string()
    .uuid()
    .allow(null)
    .optional(),

  brand: Joi.string()
    .max(150)
    .allow(null, '')
    .optional(),

  short_description: Joi.string()
    .max(500)
    .allow(null, '')
    .optional(),

  shortDescription: Joi.string()
    .max(500)
    .allow(null, '')
    .optional(),

  description: Joi.string()
    .allow('')
    .optional(),

  commercial_type: Joi.string()
    .valid(...COMMERCIAL_TYPES)
    .optional(),

  commercialType: Joi.string()
    .valid(...COMMERCIAL_TYPES)
    .optional(),

  price: Joi.number()
    .min(0)
    .precision(2)
    .allow(null)
    .optional(),

  redirect_url: Joi.string()
    .uri()
    .allow(null, '')
    .optional(),

  redirectUrl: Joi.string()
    .uri()
    .allow(null, '')
    .optional(),

  image_url: Joi.string()
    .uri()
    .allow(null, '')
    .optional(),

  imageUrl: Joi.string()
    .uri()
    .allow(null, '')
    .optional(),

  image_path: Joi.string()
    .allow(null, '')
    .optional(),

  imagePath: Joi.string()
    .allow(null, '')
    .optional(),

  image_filename: Joi.string()
    .allow(null, '')
    .optional(),

  imageFilename: Joi.string()
    .allow(null, '')
    .optional(),

  image_size: Joi.number()
    .integer()
    .min(0)
    .max(5242880)
    .allow(null)
    .optional(),

  imageSize: Joi.number()
    .integer()
    .min(0)
    .max(5242880)
    .allow(null)
    .optional(),

  image_mime_type: Joi.string()
    .valid(
      'image/jpeg',
      'image/png',
      'image/webp'
    )
    .allow(null, '')
    .optional(),

  imageMimeType: Joi.string()
    .valid(
      'image/jpeg',
      'image/png',
      'image/webp'
    )
    .allow(null, '')
    .optional(),

  storage_bucket: Joi.string()
    .allow(null, '')
    .optional(),

  storageBucket: Joi.string()
    .allow(null, '')
    .optional(),

  featured: Joi.boolean()
    .optional(),

  display_order: Joi.number()
    .integer()
    .min(0)
    .optional(),

  displayOrder: Joi.number()
    .integer()
    .min(0)
    .optional(),

  active: Joi.boolean()
    .optional(),

  meta_title: Joi.string()
    .max(255)
    .allow(null, '')
    .optional(),

  metaTitle: Joi.string()
    .max(255)
    .allow(null, '')
    .optional(),

  meta_description: Joi.string()
    .max(500)
    .allow(null, '')
    .optional(),

  metaDescription: Joi.string()
    .max(500)
    .allow(null, '')
    .optional(),

})
.min(1)
.custom((value, helpers) => {

  // ==========================================================
  // NORMALIZAÇÃO
  // ==========================================================

  if (
    value.categoryId &&
    !value.category_id
  ) {
    value.category_id = value.categoryId;
  }

  if (
    value.commercialType &&
    !value.commercial_type
  ) {
    value.commercial_type =
      value.commercialType;
  }

  if (
    value.shortDescription &&
    !value.short_description
  ) {
    value.short_description =
      value.shortDescription;
  }

  if (
    value.redirectUrl &&
    !value.redirect_url
  ) {
    value.redirect_url =
      value.redirectUrl;
  }

  if (
    value.imageUrl &&
    !value.image_url
  ) {
    value.image_url =
      value.imageUrl;
  }

  if (
    value.imagePath &&
    !value.image_path
  ) {
    value.image_path =
      value.imagePath;
  }

  if (
    value.imageFilename &&
    !value.image_filename
  ) {
    value.image_filename =
      value.imageFilename;
  }

  if (
    value.imageSize !== undefined &&
    value.image_size === undefined
  ) {
    value.image_size =
      value.imageSize;
  }

  if (
    value.imageMimeType &&
    !value.image_mime_type
  ) {
    value.image_mime_type =
      value.imageMimeType;
  }

  if (
    value.storageBucket &&
    !value.storage_bucket
  ) {
    value.storage_bucket =
      value.storageBucket;
  }

  if (
    value.displayOrder !== undefined &&
    value.display_order === undefined
  ) {
    value.display_order =
      value.displayOrder;
  }

  if (
    value.metaTitle &&
    !value.meta_title
  ) {
    value.meta_title =
      value.metaTitle;
  }

  if (
    value.metaDescription &&
    !value.meta_description
  ) {
    value.meta_description =
      value.metaDescription;
  }


  // ==========================================================
  // VALIDAÇÃO DAS REGRAS COMERCIAIS
  // ==========================================================

  const commercialType =
    value.commercial_type;

  const price =
    value.price;

  const redirectUrl =
    value.redirect_url;


  if (commercialType === 'PICKUP') {

    if (
      price === null ||
      price === undefined
    ) {
      return helpers.error(
        'any.custom',
        {
          message:
            'Produtos de retirada (PICKUP) devem possuir preço.',
        }
      );
    }

    if (
      redirectUrl !== null &&
      redirectUrl !== undefined &&
      redirectUrl !== ''
    ) {
      return helpers.error(
        'any.custom',
        {
          message:
            'Produtos de retirada (PICKUP) não devem possuir URL de e-commerce.',
        }
      );
    }
  }


  if (commercialType === 'ECOMMERCE') {

    if (
      !redirectUrl ||
      redirectUrl.trim() === ''
    ) {
      return helpers.error(
        'any.custom',
        {
          message:
            'Produtos de e-commerce devem possuir URL de encaminhamento.',
        }
      );
    }

    if (
      price !== null &&
      price !== undefined
    ) {
      return helpers.error(
        'any.custom',
        {
          message:
            'Produtos de e-commerce não devem possuir preço.',
        }
      );
    }
  }


  return value;

})
.messages({
  'object.min':
    'Envie ao menos um campo para atualizar',
});


// ============================================================
// MIDDLEWARE DE VALIDAÇÃO
// ============================================================

export const validateBody = (
  schema: Joi.ObjectSchema
) => {

  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    const {
      error,
      value
    } = schema.validate(
      req.body,
      {
        abortEarly: false,
        stripUnknown: true,
      }
    );

    if (error) {

      console.error(
        '❌ Erro de validação:',
        error.details.map(
          (detail) => detail.message
        )
      );

      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.details.map(
          (detail) => detail.message
        ),
      });
    }

    req.body = value;

    return next();
  };
};