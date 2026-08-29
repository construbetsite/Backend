// ============================================================
// DTO DE CRIAÇÃO DE LEAD
// ============================================================

/**
 * CreateLeadDTO: payload aceito pelo endpoint POST /api/leads.
 * O frontend envia apenas nome, email e whatsapp (opcional).
 * ip e user_agent são preenchidos pelo backend automaticamente.
 */
export interface CreateLeadDTO {
  nome: string;
  email: string;
  whatsapp?: string | null;
  ip?: string | null;
  user_agent?: string | null;
}
