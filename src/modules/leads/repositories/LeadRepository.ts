import { supabase } from '../../../config/supabase';
import { Lead, LeadRow, CreateLeadDTO, ListLeadsParams } from '../types/lead.types';
import { env } from '../../../config/env';

/**
 * Dados que o repositório aceita para criação:
 * payload da API (CreateLeadDTO) — sem campos de rastreamento.
 */
export type CreateLeadRepositoryData = CreateLeadDTO;

// ============================================================
// DETECÇÃO DINÂMICA DE COLUNAS DA TABELA `leads`
// ------------------------------------------------------------
// Consultamos o schema via OpenAPI do PostgREST (cache em memória)
// e inserimos apenas as colunas existentes.
// ============================================================

let leadsColumnsCache: Set<string> | null = null;

async function getLeadsColumns(): Promise<Set<string>> {
  if (leadsColumnsCache) return leadsColumnsCache;

  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    const schema = await res.json();
    const properties =
      schema?.definitions?.leads?.properties ??
      schema?.components?.schemas?.leads?.properties ??
      {};

    leadsColumnsCache = new Set<string>(Object.keys(properties));
    console.log(
      '🗄️ Colunas detectadas na tabela leads:',
      Array.from(leadsColumnsCache).join(', ')
    );
  } catch (err) {
    console.error('⚠️ Não foi possível detectar o schema da tabela leads:', err);
    // Fallback com colunas essenciais
    leadsColumnsCache = new Set([
      'id', 'nome', 'name', 'email', 'whatsapp', 'created_at', 'updated_at'
    ]);
  }

  return leadsColumnsCache;
}

export class LeadRepository {
  /**
   * Insere um novo lead na tabela `leads`.
   * Só envia colunas que existem de fato no banco.
   */
  async create(data: CreateLeadRepositoryData): Promise<Lead> {
    const columns = await getLeadsColumns();

    // Constrói o objeto com os campos recebidos (sem ip/user_agent)
    const insertData: Record<string, unknown> = {
      nome: data.nome,
      email: data.email,
      whatsapp: data.whatsapp || null,
    };

    // Compatibilidade: schema com `name` (legado) em vez de `nome`
    if (!columns.has('nome') && columns.has('name')) {
      insertData.name = data.nome;
      delete insertData.nome;
    }

    // Remove colunas que não existem na tabela (ex: status, se não existir)
    for (const key of Object.keys(insertData)) {
      if (!columns.has(key)) {
        console.warn(`⚠️ Coluna '${key}' não existe na tabela leads — inserção pulada.`);
        delete insertData[key];
      }
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar lead:', error);
      throw error;
    }

    return this.mapRowToLead(lead);
  }

  /**
   * Busca um lead pelo e-mail (para verificação de duplicatas).
   */
  async findByEmail(email: string): Promise<Lead | null> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('❌ Erro ao buscar lead por e-mail:', error);
      throw error;
    }

    if (!data) return null;

    return this.mapRowToLead(data);
  }

  /**
   * Lista leads com paginação, busca, filtros e ordenação.
   * Ordenação padrão: created_at DESC.
   */
  async findAll(params: ListLeadsParams): Promise<{ data: Lead[]; count: number }> {
    const columns = await getLeadsColumns();

    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' });

    // Busca por nome/email/whatsapp (contains, case-insensitive)
    if (params.search) {
      const term = this.escapeLike(params.search.trim());
      const nameColumn = columns.has('nome') ? 'nome' : 'name';
      const searchClauses: string[] = [];

      if (columns.has(nameColumn)) {
        searchClauses.push(`${nameColumn}.ilike.%${term}%`);
      }
      if (columns.has('email')) {
        searchClauses.push(`email.ilike.%${term}%`);
      }
      if (columns.has('whatsapp')) {
        searchClauses.push(`whatsapp.ilike.%${term}%`);
      }

      if (searchClauses.length > 0) {
        query = query.or(searchClauses.join(','));
      }
    }

    // Filtro por status (se existir)
    if (params.status !== undefined && columns.has('status')) {
      query = query.eq('status', params.status);
    }

    // Filtro por data de criação
    if (params.startDate && columns.has('created_at')) {
      query = query.gte('created_at', params.startDate);
    }

    if (params.endDate && columns.has('created_at')) {
      query = query.lte('created_at', this.normalizeEndDate(params.endDate));
    }

    // Ordenação adaptativa
    const sortBy = this.safeSortBy(params.sortBy, columns);
    const ascending = (params.sortOrder ?? 'DESC') === 'ASC';
    query = query.order(sortBy, { ascending });

    // Paginação
    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Erro ao listar leads:', error);
      throw error;
    }

    return {
      data: (data ?? []).map((row: any) =>
        this.mapRowToLead(row as LeadRow & { name?: string | null })
      ),
      count: count || 0,
    };
  }

  /**
   * Busca um lead pelo ID (uuid). Retorna null se não existir.
   */
  async findById(id: string): Promise<Lead | null> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('❌ Erro ao buscar lead por ID:', error);
      throw error;
    }

    return data ? this.mapRowToLead(data as LeadRow & { name?: string | null }) : null;
  }

  // ✅ MAPEAMENTO: linha do banco → contrato da API
  private escapeLike(term: string): string {
    return term.replace(/[%_]/g, (m) => '\\' + m);
  }

  private normalizeEndDate(value: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return `${value}T23:59:59.999Z`;
    }
    return value;
  }

  private safeSortBy(value: string | undefined, columns: Set<string>): string {
    // Colunas permitidas para ordenação (sem ip/user_agent)
    const allowed = [
      'id', 'nome', 'email', 'whatsapp',
      'status', 'created_at', 'updated_at',
    ];

    let field = value && allowed.includes(value) ? value : 'created_at';

    // Schema legado usa `name` em vez de `nome`
    if (field === 'nome' && !columns.has('nome') && columns.has('name')) {
      field = 'name';
    }

    // Fallback final: coluna que com certeza existe
    if (!columns.has(field)) {
      field = columns.has('created_at') ? 'created_at' : 'id';
    }

    return field;
  }

  private mapRowToLead(row: LeadRow & { name?: string | null }): Lead {
    return {
      id: row.id,
      nome: row.nome ?? row.name ?? '',
      email: row.email,
      whatsapp: row.whatsapp || null,
      status: row.status ?? true,   // se status não existir no banco, retorna true (mas não será enviado)
      created_at: row.created_at,
      updated_at: row.updated_at || row.created_at,
    };
  }
}