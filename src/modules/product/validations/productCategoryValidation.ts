import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';


// ============================================================
// SCHEMA DE CRIAÇÃO DE CATEGORIA
// ============================================================

export const createProductCategorySchema = Joi.object({

  // ----------------------------------------------------------
  // NOME
  // ----------------------------------------------------------

  name: Joi.string()
    .min(1)
    .max(150)
    .required(),

  // ----------------------------------------------------------
  // SLUG
  // ----------------------------------------------------------

  slug: Joi.string()
    .min(1)
    .max(150)
    .optional(),

  // ----------------------------------------------------------
  // DESCRIÇÃO
  // ----------------------------------------------------------

  description: Joi.string()
    .max(500)
    .allow(null, '')
    .optional(),

  // ----------------------------------------------------------
  // IMAGEM DA CATEGORIA
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

  // ----------------------------------------------------------
  // CONTROLE
  // ----------------------------------------------------------

  active: Joi.boolean()
    .default(true)
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

}).custom((value) => {

  // ==========================================================
  // NORMALIZAÇÃO
  // ==========================================================

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
    value.displayOrder !== undefined &&
    value.display_order === undefined
  ) {
    value.display_order =
      value.displayOrder;
  }

  return value;
});


// ============================================================
// SCHEMA DE ATUALIZAÇÃO
// ============================================================

export const updateProductCategorySchema = Joi.object({

  name: Joi.string()
    .min(1)
    .max(150)
    .optional(),

  slug: Joi.string()
    .min(1)
    .max(150)
    .optional(),

  description: Joi.string()
    .max(500)
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

  active: Joi.boolean()
    .optional(),

  display_order: Joi.number()
    .integer()
    .min(0)
    .optional(),

  displayOrder: Joi.number()
    .integer()
    .min(0)
    .optional(),

})
.min(1)
.custom((value) => {

  // ==========================================================
  // NORMALIZAÇÃO
  // ==========================================================

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
    value.displayOrder !== undefined &&
    value.display_order === undefined
  ) {
    value.display_order =
      value.displayOrder;
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

export const validateProductCategoryBody = (
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