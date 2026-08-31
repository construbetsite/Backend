// ============================================================
// TIPOS DO MÓDULO DE LEADS (Newsletter)
// ============================================================

/**
 * Lead: entidade completa (contrato da API / retorno do backend)
 */
export interface Lead {
  id: string;
  nome: string;
  email: string;
  whatsapp: string | null;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadDTO {
  nome: string;
  email: string;
  whatsapp?: string | null;
}

// LeadRow já está ok (sem ip/user_agent)

/**
 * LeadRow: mesma estrutura usada para mapear a linha do banco.
 */
export interface LeadRow {
  id: string;
  nome: string;
  email: string;
  whatsapp: string | null;
  status: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * CreateLeadDTO: payload aceito pelo endpoint POST /api/leads
 */
export interface CreateLeadDTO {
  nome: string;
  email: string;
  whatsapp?: string | null;
  ip?: string | null;
  user_agent?: string | null;
}

/**
 * ListLeadsParams: parâmetros aceitos pelo GET /api/leads
 * (filtros, busca, paginação e ordenação — todos opcionais).
 */
export interface ListLeadsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * ListLeadsResult: retorno da listagem paginada.
 */
export interface ListLeadsResult {
  data: Lead[];
  total: number;
}
