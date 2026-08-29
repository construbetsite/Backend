import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// ============================================================
// VALIDAÇÃO DE URL (redirecionamento)
// Aceita URLs completas com protocolo http:// ou https://
// Ex.: "https://www.construbet.com.br/ferramentas"
// ============================================================


// ============================================================
// SCHEMA DE CRIAÇÃO
// ============================================================
export const createLandingCategorySchema = Joi.object({
  title: Joi.string().trim().min(1).required().messages({
    'string.empty': 'O título é obrigatório',
    'any.required': 'O título é obrigatório',
  }),

  image: Joi.string().uri({ scheme: ['http', 'https'] }).required().messages({
    'string.uri': 'A imagem deve ser uma URL válida',
    'string.empty': 'A imagem é obrigatória',
    'any.required': 'A imagem é obrigatória',
  }),

  url: Joi.string().trim().uri({ scheme: ['http', 'https'] }).required().messages({
    'string.uri':
      'A URL deve ser uma URL completa válida com http:// ou https:// (ex.: https://www.construbet.com.br/ferramentas)',
    'string.empty': 'A URL é obrigatória',
    'any.required': 'A URL é obrigatória',
  }),

  order: Joi.number().integer().min(0).default(0),

  status: Joi.boolean().default(true),
});

// ============================================================
// SCHEMA DE ATUALIZAÇÃO
// ============================================================
export const updateLandingCategorySchema = Joi.object({
  title: Joi.string().trim().min(1).optional(),
  image: Joi.string().uri({ scheme: ['http', 'https'] }).optional(),
  url: Joi.string().trim().uri({ scheme: ['http', 'https'] }).optional().messages({
    'string.uri':
      'A URL deve ser uma URL completa válida com http:// ou https:// (ex.: https://www.construbet.com.br/ferramentas)',
  }),
  order: Joi.number().integer().min(0).optional(),
  status: Joi.boolean().optional(),
})
  .min(1)
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
