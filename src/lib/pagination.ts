// lib/pagination.ts

/**
 * Utilitário de paginação por cursor (base64) com compatibilidade
 * com paginação page/limit (offset-based).
 *
 * O cursor codifica a posição (offset) da última página retornada,
 * permitindo que o cliente navegue sem depender de um page number.
 */

const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

/** Paginação já resolvida com defaults aplicados (page/limit sempre definidos). */
export interface ResolvedPagination {
  page: number;
  limit: number;
  cursor?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  nextCursor: string | null;
}

/** Normaliza e os limites de paginação. */
export function normalizePagination(query: any): ResolvedPagination {
  const rawPage = parseInt(String(query?.page ?? ''), 10);
  const rawLimit = parseInt(String(query?.limit ?? ''), 10);
  const cursor = typeof query?.cursor === 'string' ? query.cursor : undefined;

  // `page`/`limit` têm prioridade sobre `cursor` quando ambos chegam
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : undefined;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, MAX_LIMIT)
      : undefined;

  // Se vide, aplica os defaults
  const resolvedPage = page ?? DEFAULT_PAGE;
  const resolvedLimit = limit ?? DEFAULT_LIMIT;

  // Se um cursor foi informado, converte-o em offset (e ignora page)
  let offset = (resolvedPage - 1) * resolvedLimit;
  if (!page && cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded !== null && Number.isFinite(decoded)) {
      offset = Math.max(0, decoded);
    }
  }

  return {
    page: offset === 0 ? DEFAULT_PAGE : Math.floor(offset / resolvedLimit) + 1,
    limit: resolvedLimit,
    cursor,
  } as ResolvedPagination;
}

/** Gera o offset a partir dos parâmetros normalizados. */
export function offsetFrom(params: PaginationParams): number {
  const page = params.page ?? DEFAULT_PAGE;
  const limit = params.limit ?? DEFAULT_LIMIT;
  return (page - 1) * limit;
}

/** Codifica um offset em cursor base64url (opaco, sem informações sensíveis). */
export function encodeCursor(offset: number): string {
  const payload = JSON.stringify({ o: offset });
  return Buffer.from(payload, 'utf-8').toString('base64url');
}

/** Decodifica um cursor de volta ao offset (null se inválido). */
export function decodeCursor(cursor: string): number | null {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf-8');
    const parsed = JSON.parse(raw);
    return typeof parsed?.o === 'number' ? parsed.o : null;
  } catch {
    return null;
  }
}

/** Monta os metadados de paginação (total, hasMore, nextCursor...). */
export function buildPaginationMeta(
  total: number,
  offset: number,
  limit: number
): PaginationMeta {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;
  const hasMore = offset + limit < total;
  const nextCursor = hasMore ? encodeCursor(offset + limit) : null;

  return {
    total,
    page: Math.floor(offset / limit) + 1,
    limit,
    totalPages,
    hasMore,
    nextCursor,
  };
}
