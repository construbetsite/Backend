import NodeCache from 'node-cache';
import { Request, Response, NextFunction } from 'express';

// TTLs padrão (em segundos) – definidos diretamente no código
export const DEFAULT_TTL = 300; // 5 minutos
export const TTL_PRODUCTS = 600; // 10 minutos
export const TTL_CATEGORIES = 3600; // 1 hora
export const TTL_BLOG_POSTS = 600; // 10 minutos
export const TTL_PRODUCT_DETAIL = 300; // 5 minutos
export const TTL_SITE_CONFIG = 86400; // 1 dia

// Instância centralizada do NodeCache
export const cache = new NodeCache({
  stdTTL: DEFAULT_TTL,
  checkperiod: 120, // Verifica expirações a cada 2 minutos
  maxKeys: 5000,    // Limite máximo de chaves para evitar estouro de memória
  useClones: true,  // Retorna cópias para evitar mutação do cache por referência
});

// Wrapper para obter valor do cache com logs de HIT/MISS
export function getCache<T>(key: string): T | undefined {
  const data = cache.get<T>(key);
  if (data !== undefined) {
    console.log(`[CACHE HIT] ${key}`);
  } else {
    console.log(`[CACHE MISS] ${key}`);
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
  console.log('[CACHE FLUSH] Todo o cache foi limpo');
  cache.flushAll();
}

// Utilitário para gerar chaves determinísticas
export function generateKey(prefix: string, params?: any): string {
  if (!params || (typeof params === 'object' && Object.keys(params).length === 0)) {
    return prefix;
  }
  if (typeof params === 'object' && !Array.isArray(params)) {
    const sortedKeys = Object.keys(params).sort();
    const cleanParams: Record<string, any> = {};
    for (const k of sortedKeys) {
      if (params[k] !== undefined) {
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
    console.log(`[CACHE INVALIDATED] Prefixo "${prefix}": ${deletedCount} chave(s) removida(s)`);
    return deletedCount;
  }
  return 0;
}

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
