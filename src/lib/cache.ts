import NodeCache from 'node-cache';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// TTLs padrão (em segundos) – definidos diretamente no código
export const DEFAULT_TTL = 300; // 5 minutos
export const TTL_PRODUCTS = 600; // 10 minutos
export const TTL_CATEGORIES = 3600; // 1 hora
export const TTL_BLOG_POSTS = 600; // 10 minutos
export const TTL_PRODUCT_DETAIL = 300; // 5 minutos
export const TTL_SITE_CONFIG = 86400; // 1 dia

// 🔥 CORREÇÃO (R1): useClones desativado.
// Os payloads em cache são APENAS serializados para JSON (nunca mutados),
// então o deep-clone que o NodeCache fazia a cada get() era custo puro de CPU.
// 🔥 CORREÇÃO (R4): logs de HIT/MISS apenas em desenvolvimento (console.log
// síncrono bloqueia o event loop em produção).
const IS_DEV = process.env.NODE_ENV !== 'production';

export const cache = new NodeCache({
  stdTTL: DEFAULT_TTL,
  checkperiod: 120, // Verifica expirações a cada 2 minutos
  maxKeys: 5000,    // Limite máximo de chaves para evitar estouro de memória
  useClones: false, // 🔥 R1: sem deep-clone (payloads imutáveis no uso atual)
});

// Wrapper para obter valor do cache com logs de HIT/MISS (apenas em dev — R4)
export function getCache<T>(key: string): T | undefined {
  const data = cache.get<T>(key);
  if (IS_DEV) {
    console.log(`[CACHE ${data !== undefined ? 'HIT' : 'MISS'}] ${key}`);
  }
  return data;
}

// Wrapper para definir valor no cache
export function setCache(key: string, value: any, ttl: number = DEFAULT_TTL): boolean {
  return cache.set(key, value, ttl);
}

// Wrapper para deletar uma chave específica
export function deleteCache(key: string): number {
  return cache.del(key);
}

// Wrapper para limpar todo o cache
export function flushCache(): void {
  if (IS_DEV) console.log('[CACHE FLUSH] Todo o cache foi limpo'); // 🔥 R4
  cache.flushAll();
}

// Utilitário para gerar chaves determinísticas
export function generateKey(prefix: string, params?: any): string {
  // ✅ Trata apenas null/undefined como ausentes (preserva false, 0 e "")
  if (params === undefined || params === null) {
    return prefix;
  }
  if (typeof params === 'object' && Object.keys(params).length === 0) {
    return prefix;
  }
  if (typeof params === 'object' && !Array.isArray(params)) {
    const sortedKeys = Object.keys(params).sort();
    const cleanParams: Record<string, any> = {};
    for (const k of sortedKeys) {
      if (params[k] !== undefined && params[k] !== null) {
        cleanParams[k] = params[k];
      }
    }
    return `${prefix}:${JSON.stringify(cleanParams)}`;
  }
  return `${prefix}:${JSON.stringify(params)}`;
}

// Invalidação em massa por prefixo de chave
export function invalidatePrefix(prefix: string): number {
  const keys = cache.keys();
  const matchedKeys = keys.filter((k) => k.startsWith(prefix));
  if (matchedKeys.length > 0) {
    const deletedCount = cache.del(matchedKeys);
    if (IS_DEV) console.log(`[CACHE INVALIDATED] Prefixo "${prefix}": ${deletedCount} chave(s) removida(s)`); // 🔥 R4
    return deletedCount;
  }
  return 0;
}

// ============================================================
// ETag / Revalidação condicional (304) ULTRALEVE
// → O hash é calculado a partir do payload JÁ em cache (sem
//   consultar o banco), tornando o 304 < 50ms.
// ============================================================
export function computeEtag(payload: any): string {
  return `"${crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex')}"`;
}

// 🔥 CORREÇÃO (R1): entradas de cache com ETag pré-calculado.
// O ETag era recalculado (JSON.stringify + SHA-1) a CADA request com HIT —
// em listas grandes isso custava mais que o handler em si. Agora o ETag é
// computado UMA vez quando o payload entra no cache.
interface CachedWithEtag<T> {
  __etag: string;   // marca a entrada (permite detectar sem quebrar outros módulos)
  __body: T;
}

/** Grava payload no cache já com o ETag pré-computado (usar em GETs cacheáveis). */
export function setCacheWithEtag<T>(key: string, payload: T, ttl: number): void {
  setCache(key, { __etag: computeEtag(payload), __body: payload } as CachedWithEtag<T>, ttl);
}

function isCachedWithEtag(entry: any): entry is CachedWithEtag<unknown> {
  return !!entry && typeof entry === 'object' && typeof entry.__etag === 'string' && '__body' in entry;
}

/**
 * Aplica ETag + Cache-Control e responde 304 quando If-None-Match casa.
 * Retorna true se a resposta 304 já foi enviada (chamador deve retornar).
 */
export function sendWithConditionalCache(
  req: Request,
  res: Response,
  payload: any,
  cacheControl: string,
  status: 200 | 201 = 200
): boolean {
  res.setHeader('Cache-Control', cacheControl);

  // 🔥 R1: se veio de setCacheWithEtag, reutiliza o ETag já calculado (sem re-serializar).
  // Payloads "cruos" (chamadores antigos) continuam funcionando: ETag calculado na hora.
  const etag = isCachedWithEtag(payload) ? payload.__etag : computeEtag(payload);
  const body = isCachedWithEtag(payload) ? payload.__body : payload;
  res.setHeader('ETag', etag);

  const ifNoneMatch = req.headers['if-none-match'];
  if (ifNoneMatch && ifNoneMatch.split(',').map((t) => t.trim()).includes(etag)) {
    res.status(304).end();
    return true;
  }

  res.status(status).json(body); // 🔥 R1: envia o body original (contrato inalterado)
  return false;
}

// Política de cache HTTP para endpoints dinâmicos (produtos/posts)
export const CACHE_CONTROL_DYNAMIC =
  'public, max-age=60, stale-while-revalidate=3600';
export const CACHE_CONTROL_DETAIL =
  'public, max-age=60, s-maxage=300, stale-while-revalidate=3600';

// Middleware opcional para rotas GET Express
export function cacheResponse(ttl: number = DEFAULT_TTL) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `route:${req.originalUrl || req.url}`;
    const cached = getCache(key);
    if (cached !== undefined) {
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = function (data: any): Response {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(key, data, ttl);
      }
      return originalJson(data);
    };

    next();
  };
}

// ============================================================
// Tarefa 4 — Cache da VITRINE (stale-while-revalidate no servidor)
//
// Estratégia de duas camadas com NodeCache:
//   1. Entrada "fresca" (TTL curto): servida enquanto válida.
//   2. Cópia "stale" (TTL longo): quando a fresca expira, a requisição
//      recebe IMEDIATAMENTE o dado antigo (latência ~0) enquanto uma
//      revalidação roda em background — sem esperar o banco.
//
// Single-flight: se 50 requisições chegam ao mesmo tempo com a chave
// vazia, apenas UMA consulta ao banco é feita; as demais aguardam a
// mesma promise (evita cache stampede / thundering herd).
// ============================================================
export const TTL_VITRINE = 60; // frescor: 1 minuto
// stale permanece disponível por até 1h (fallback se o banco cair)
export const TTL_VITRINE_STALE = 3600;

// 💾 Detalhe de produto (slug/id): mesma política de stale-while-revalidate
// da vitrine. Frescor = TTL_PRODUCT_DETAIL (5min); stale fica disponível
// por até 1h como fallback caso o banco caia.
export const TTL_PRODUCT_DETAIL_STALE = 3600;

// Política HTTP para a vitrine: navegador revalida a cada 60s e o
// CDN/proxy guarda por 5min; stale-while-revalidate=3600 permite
// servir dado antigo imediatamente após expirar.
export const CACHE_CONTROL_VITRINE =
  'public, max-age=60, s-maxage=300, stale-while-revalidate=3600';

// Promises em voo por chave — evita o stampede em cold start.
const inflight = new Map<string, Promise<unknown>>();

/**
 * Lê da camada fresca; se ausente, serve a stale e dispara revalidação
 * em background; se não houver nada, carrega do banco (single-flight).
 * Sempre retorna a entrada envelopada `{ __etag, __body }`, pronta para
 * o `sendWithConditionalCache` responder 304 sem recomputar hash.
 */
export async function serveFromCache<T>(
  key: string,
  freshTtl: number,
  staleTtl: number,
  loader: () => Promise<T>,
  onError?: (err: unknown) => void
): Promise<CachedWithEtag<T>> {
  const fresh = cache.get<CachedWithEtag<T>>(key);
  if (fresh !== undefined) return fresh;

  const staleKey = `${key}:stale`;
  const stale = cache.get<CachedWithEtag<T>>(staleKey);

  const load = (): Promise<CachedWithEtag<T>> => {
    const existing = inflight.get(key);
    if (existing) return existing as Promise<CachedWithEtag<T>>;

    const p = loader()
      .then((value) => {
        const entry = {
          __etag: computeEtag(value),
          __body: value,
        } as CachedWithEtag<T>;
        cache.set(key, entry, freshTtl);
        cache.set(staleKey, entry, staleTtl);
        return entry;
      })
      .finally(() => {
        inflight.delete(key);
      });

    inflight.set(key, p);
    return p;
  };

  if (stale !== undefined) {
    // Serve o dado antigo na hora; a revalidação corre em background.
    load().catch((err) => {
      if (onError) onError(err);
      else console.error('[CACHE-SWR] Revalidação falhou:', err);
    });
    return stale;
  }

  return load();
}
