import { Router } from 'express';
import { LeadController } from '../controllers/LeadController';
import {
  createLeadSchema,
  validateBody,
  listLeadsQuerySchema,
  validateQuery,
} from '../validations/lead.validation';

const leadRoutes = Router();
const controller = new LeadController();

// ============================================================
// POST /api/leads — PÚBLICO (sem autenticação)
// Cria um lead da newsletter. O frontend envia nome, e-mail e
// whatsapp (opcional). IP e User-Agent são capturados pelo backend.
// ============================================================
leadRoutes.post('/', validateBody(createLeadSchema), controller.create);

// ============================================================
// GET /api/leads — LISTAGEM paginada e filtrada (dashboard)
// Query params: page, limit, search, status, startDate, endDate,
//               sortBy, sortOrder (validados via Joi)
// ============================================================
leadRoutes.get('/', validateQuery(listLeadsQuerySchema), controller.list);

// ============================================================
// GET /api/leads/:id — DETALHE de um lead
// ============================================================
leadRoutes.get('/:id', controller.findById);

export default leadRoutes;
