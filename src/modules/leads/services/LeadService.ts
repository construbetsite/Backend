import { LeadRepository } from '../repositories/LeadRepository';
import { CreateLeadDTO } from '../dtos/CreateLeadDTO';
import { Lead, ListLeadsParams, ListLeadsResult } from '../types/lead.types';
import { ConflictError } from '../errors/AppError';

export class LeadService {
  private repository = new LeadRepository();

  /**
   * Cria um novo lead.
   *
   * @param data        payload validado (nome, email, whatsapp?)
   * @param ip          IP capturado pelo controller (req.ip)
   * @param userAgent   User-Agent capturado pelo controller (req.headers['user-agent'])
   *
   * @throws ConflictError (409) se o e-mail já estiver cadastrado.
   */
  async createLead(
    data: CreateLeadDTO,
    ip?: string | null,
    userAgent?: string | null
  ): Promise<Lead> {
    // ✅ Normaliza o e-mail (segurança + consistência para o único constraint)
    const email = data.email.trim().toLowerCase();

    // ✅ Regra de negócio: e-mail único → 409 Conflict se já existir
    const existing = await this.repository.findByEmail(email);
    if (existing) {
      throw new ConflictError(
        'Este e-mail já está cadastrado na nossa newsletter.'
      );
    }

    // ✅ Insere o lead com dados de rastreamento (ip + user_agent)
    const lead = await this.repository.create({
      nome: data.nome.trim(),
      email,
      whatsapp: data.whatsapp || null,
      ip: ip || null,
      user_agent: userAgent || null,
    });

    return lead;
  }

  /**
   * Lista leads com paginação, busca, filtros e ordenação.
   */
  async list(params: ListLeadsParams): Promise<ListLeadsResult> {
    const { data, count } = await this.repository.findAll(params);
    return { data, total: count };
  }

  /**
   * Busca um lead pelo ID.
   * @returns Lead ou null se não encontrado.
   */
  async findById(id: string): Promise<Lead | null> {
    return this.repository.findById(id);
  }
}
