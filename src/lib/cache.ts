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
