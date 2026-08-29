import { Request, Response } from 'express';
import { LeadService } from '../services/LeadService';
import { AppError } from '../errors/AppError';

// ✅ Validador de UUID (padrão do projeto — vide BlogPostController)
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// ✅ Extrai ID do req.params (pode chegar como string[])
function extractId(params: any): string {
  const id = params.id;
  return Array.isArray(id) ? id[0] : id;
}

export class LeadController {
  private service = new LeadService();

  /**
   * POST /api/leads — cria um lead (público).
   * O frontend envia apenas { nome, email, whatsapp? }.
   * O backend captura ip e user_agent automaticamente.
   */
  create = async (req: Request, res: Response) => {
    try {
      // ✅ Captura IP (req.ip com fallback para remoteAddress)
      const ip =
        req.ip ||
        (req.socket && req.socket.remoteAddress) ||
        (req as any).connection?.remoteAddress ||
        null;

      // ✅ Captura User-Agent
      const userAgent =
        (req.headers['user-agent'] as string) || null;

      console.log('📥 [LeadController] Nova tentativa de cadastro:', {
        body: req.body,
        ip,
        userAgent,
      });

      const lead = await this.service.createLead(req.body, ip, userAgent);

      console.log('✅ [LeadController] Lead criado:', {
        id: lead.id,
        nome: lead.nome,
        email: lead.email,
        whatsapp: lead.whatsapp,
        ip: lead.ip,
        status: lead.status,
      });

      // ✅ 201 Created
      return res.status(201).json({ success: true, data: lead });
    } catch (error) {
      console.error('[LeadController.create]', error);

      const statusCode =
        error instanceof AppError ? error.statusCode : 500;

      // 409 = Conflict (e-mail duplicado), 400 = validação (já tratada no middleware)
      return res.status(statusCode).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Erro interno ao salvar lead',
      });
    }
  };

  /**
   * GET /api/leads — listagem paginada/filtrada (dashboard).
   * Query params já validados pelo middleware validateQuery(listLeadsQuerySchema).
   * Resposta: { success, data: [...], meta: { total, page, limit, totalPages } }
   */
  list = async (req: Request, res: Response) => {
    try {
      const query = req.query as any;

      // ✅ status chega como boolean (Joi converte) ou string "true"/"false" (defensivo)
      const status =
        typeof query.status === 'string'
          ? query.status === 'true'
          : query.status;

      const { data, total } = await this.service.list({
        page: query.page,
        limit: query.limit,
        search: query.search,
        status,
        startDate: query.startDate,
        endDate: query.endDate,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      const totalPages = Math.ceil(total / query.limit);

      return res.status(200).json({
        success: true,
        data,
        meta: {
          total,
          page: query.page,
          limit: query.limit,
          totalPages,
        },
      });
    } catch (error) {
      console.error('[LeadController.list]', error);
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Erro ao listar leads',
      });
    }
  };

  /**
   * GET /api/leads/:id — detalhe de um lead.
   */
  findById = async (req: Request, res: Response) => {
    try {
      const id = extractId(req.params);

      if (!isValidUUID(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido: deve ser um UUID válido',
        });
      }

      const lead = await this.service.findById(id);

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead não encontrado',
        });
      }

      return res.status(200).json({ success: true, data: lead });
    } catch (error) {
      console.error('[LeadController.findById]', error);
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Erro ao buscar lead',
      });
    }
  };
}
