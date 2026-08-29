import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// ============================================================
// SCHEMA DE CRIAÇÃO DE LEAD (Newsletter)
// ============================================================

export const createLeadSchema = Joi.object({
  // ✅ Nome: obrigatório, 2 a 100 caracteres
  nome: Joi.string().trim().min(2).max(100).required(),

  // ✅ E-mail: obrigatório, formato válido
  email: Joi.string().trim().email().lowercase().required(),

  // ✅ WhatsApp: opcional, apenas números, mínimo 10 dígitos (DDD + número)
  whatsapp: Joi.string()
    .trim()
    .pattern(/^[0-9]{10,13}$/)
    .optional()
    .allow(''),
}).options({ stripUnknown: true });

// ============================================================
// MIDDLEWARE DE VALIDAÇÃO (padrão do projeto)
// ============================================================

/**
 * Middleware que valida o corpo da requisição com o schema Joi.
 * Retorna 400 com os detalhes caso a validação falhe.
 */
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      console.error('❌ Erro de validação (leads):', error.details.map((d) => d.message));
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.details.map((detail) =>
          detail.message.replace(/"/g, "'")
        ),
      });
    }

    // Normaliza whatsapp vazio → null (mesmo contrato do banco)
    if (value.whatsapp === '') {
      value.whatsapp = null;
    }

    req.body = value;
    return next();
  };
};

// ============================================================
// SCHEMA DE LISTAGEM (QUERY PARAMS) — GET /api/leads
// ============================================================

// ✅ Campos de ordenação permitidos (whitelist contra SQL injection)
const SORT_FIELDS = [
  'id',
  'nome',
  'email',
  'whatsapp',
  'status',
  'created_at',
  'updated_at',
] as const;

export const listLeadsQuerySchema = Joi.object({
  // ✅ Paginação: page 1-based, limit 1–100
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),

  // ✅ Busca por nome/email/whatsapp (contains, case-insensitive)
  search: Joi.string().trim().max(255).optional(),

  // ✅ Status como booleano (aceita "true"/"false" ou booleano)
  status: Joi.boolean().optional(),

  // ✅ Filtro por data de criação (ISO date)
  startDate: Joi.date().iso().raw().optional(),
  endDate: Joi.date().iso().raw().optional(),

  // ✅ Ordenação: campo (whitelist) + direção ASC/DESC
  sortBy: Joi.string()
    .valid(...SORT_FIELDS)
    .default('created_at'),
  sortOrder: Joi.string()
    .valid('ASC', 'DESC')
    .default('DESC'),
});

/**
 * Middleware que valida QUERY PARAMS com schema Joi (padrão do projeto).
 * Aplica defaults (page=1, limit=10, sortBy=created_at, sortOrder=DESC)
 * e retorna 400 com detalhes em caso de erro.
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      console.error('❌ Erro de validação (leads/query):', error.details.map((d) => d.message));
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.details.map((detail) =>
          detail.message.replace(/"/g, "'")
        ),
      });
    }

    req.query = value;
    return next();
  };
};
