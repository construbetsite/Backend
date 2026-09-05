// lib/payloadStats.ts
// ============================================================
// Tarefa 1 — Scanner de Payload (diagnóstico de respostas pesadas)
//
// Importa métricas essenciais de cada resposta JSON da API:
//   - Tamanho exato do payload (bytes → KB/MB)
//   - Tempo de "serialização" (tempo entre a entrada no middleware
//     e o res.json() — inclui a consulta ao banco + mapeamento)
//   - Contagem de objetos aninhados (profundidade > 1)
//   - Campos que chegam null (candidatos a remoção do DTO)
//   - Classificação por peso: leve < 10KB | médio 10–100KB | pesado > 100KB
//
// Gera: relatório no console (dev) + arquivo JSON em ./reports/payload-report.json
// ============================================================

import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

export interface PayloadReportEntry {
  route: string;
  method: string;
  statusCode: number;
  sizeKB: number;
  sizeMB: number;
  serializationTimeMS: number;
  countOfNestedObjects: number;
  fieldsWithNulls: string[];
  classification: 'leve' | 'medio' | 'pesado';
  timestamp: string;
}

export type PayloadReport = PayloadReportEntry[];

function classify(sizeKB: number): PayloadReportEntry['classification'] {
  if (sizeKB < 10) return 'leve';
  if (sizeKB <= 100) return 'medio';
  return 'pesado';
}

export function bytesToKB(bytes: number): number {
  return Math.round((bytes / 1024) * 100) / 100;
}

/** Conta objetos aninhados (profundidade ≥ 2) dentro do payload. */
export function countNestedObjects(value: unknown): number {
  let count = 0;
  const seen = new WeakSet<object>();

  function walk(v: unknown, depth: number): void {
    if (v === null || v === undefined) return;
    if (typeof v !== 'object') return;
    if (seen.has(v)) return;
    seen.add(v);
    if (depth >= 2) count += 1;
    if (Array.isArray(v)) {
      for (const item of v) walk(item, depth + 1);
    } else {
      for (const key of Object.keys(v)) {
        walk((v as Record<string, unknown>)[key], depth + 1);
      }
    }
  }

  walk(value, 1);
  return count;
}

/** Coleta chaves (incluindo aninhadas) cujo valor é null/undefined. */
export function collectNullFields(value: unknown, prefix = ''): string[] {
  const nulls: string[] = [];

  function walk(v: unknown, base: string): void {
    if (v === null || v === undefined) {
      if (base) nulls.push(base);
      return;
    }
    if (typeof v !== 'object') return;
    if (Array.isArray(v)) {
      v.forEach((item, i) => walk(item, `${base}[${i}]`));
    } else {
      for (const key of Object.keys(v)) {
        const next = base ? `${base}.${key}` : key;
        walk((v as Record<string, unknown>)[key], next);
      }
    }
  }

  walk(value, prefix);
  // Deduplica mantendo a primeira ocorrência
  return [...new Set(nulls)];
}

function escapeSafeStringify(value: unknown): string {
  // Evita exceções de stringify circular / BigInt
  return JSON.stringify(value, (_key, val) => {
    if (typeof val === 'bigint') return val.toString();
    return val;
  });
}

let payloadLog: PayloadReportEntry[] = [];
const MAX_ENTRIES = 5000;

const OUTPUT_DIR = path.resolve(process.cwd(), 'reports');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'payload-report.json');

function pushEntry(entry: PayloadReportEntry): void {
  payloadLog.push(entry);
  if (payloadLog.length > MAX_ENTRIES) {
    payloadLog = payloadLog.slice(-MAX_ENTRIES);
  }
}

let timer: NodeJS.Timeout | null = null;
function scheduleFlush(): void {
  if (timer) return;
  // Debounce: grava no máximo 1x por segundo em execução com muitas requests
  timer = setTimeout(() => {
    timer = null;
    flushToFile();
  }, 1000);
}

function flushToFile(): void {
  if (payloadLog.length === 0) return;
  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payloadLog, null, 2), 'utf-8');
  } catch (err) {
    console.error('[PAYLOAD-SCAN] Erro ao gravar relatório:', (err as Error).message);
  }
}

export function getPayloadReport(): PayloadReportEntry[] {
  return payloadLog;
}

export function getPayloadReportSummary(): {
  total: number;
  byClassification: Record<string, number>;
  heaviest: PayloadReportEntry | null;
  slowest: PayloadReportEntry | null;
} {
  const byClassification = { leve: 0, medio: 0, pesado: 0 };
  let heaviest: PayloadReportEntry | null = null;
  let slowest: PayloadReportEntry | null = null;

  for (const e of payloadLog) {
    byClassification[e.classification] += 1;
    if (!heaviest || e.sizeKB > heaviest.sizeKB) heaviest = e;
    if (!slowest || e.serializationTimeMS > slowest.serializationTimeMS) {
      slowest = e;
    }
  }

  return { total: payloadLog.length, byClassification, heaviest, slowest };
}

export function flushPayloadReport(): void {
  flushToFile();
}

export function resetPayloadReport(): void {
  payloadLog = [];
  flushToFile();
}

export function formatSizeKB(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(2)} MB`;
  return `${kb.toFixed(2)} KB`;
}

/**
 * Middleware Express: intercepta TODAS as respostas.
 * Mede o tempo desde a entrada até o `res.json()` e analisa o body.
 * Pode ser usado em dev (console + arquivo) — recomenda-se produção apenas
 * com amostragem (sampleRate < 1) para evitar overhead do JSON.stringify
 * duplicado em respostas gigantes.
 */
export function payloadScanner(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = process.hrtime.bigint();

  const originalJson = res.json.bind(res);

  res.json = function (body: unknown): Response {
    const end = process.hrtime.bigint();
    const elapsedMS = Number(end - start) / 1e6;

    const statusCode = res.statusCode;

    const route = req.originalUrl || req.url || req.baseUrl || '';
    const method = req.method;

    const serialized = escapeSafeStringify(body);
    const sizeBytes = Buffer.byteLength(serialized, 'utf-8');
    const sizeKB = bytesToKB(sizeBytes);

    const countOfNestedObjects = countNestedObjects(body);
    const fieldsWithNulls = collectNullFields(body);
    const classification = classify(sizeKB);

    const entry: PayloadReportEntry = {
      route,
      method,
      statusCode,
      sizeKB,
      sizeMB: Math.round((sizeBytes / (1024 * 1024)) * 1000) / 1000,
      serializationTimeMS: Math.round(elapsedMS * 100) / 100,
      countOfNestedObjects,
      fieldsWithNulls: fieldsWithNulls.slice(0, 20),
      classification,
      timestamp: new Date().toISOString(),
    };

    pushEntry(entry);
    scheduleFlush();

    if (process.env.PAYLOAD_SCAN_LOG !== 'false') {
      console.log(
        `[PAYLOAD-SCAN] ${method} ${route} → ${statusCode} | ${formatSizeKB(sizeKB)} | ${entry.serializationTimeMS}ms | ${classification} | aninhados: ${countOfNestedObjects} | nulls: ${fieldsWithNulls.length}`
      );
    }

    return originalJson(body);
  };

  next();
}

/** Exemplo de uso como "decorator" manual para um handler específico. */
export async function withPayloadScan(
  route: string,
  method: string,
  fn: () => Promise<unknown>
): Promise<{ data: unknown; entry: PayloadReportEntry }> {
  const start = process.hrtime.bigint();
  const data = await fn();
  const elapsedMS = Number(process.hrtime.bigint() - start) / 1e6;

  const serialized = escapeSafeStringify(data);
  const sizeBytes = Buffer.byteLength(serialized, 'utf-8');
  const sizeKB = bytesToKB(sizeBytes);
  const countOfNestedObjects = countNestedObjects(data);
  const fieldsWithNulls = collectNullFields(data);
  const classification = classify(sizeKB);

  const entry: PayloadReportEntry = {
    route,
    method,
    statusCode: 200,
    sizeKB,
    sizeMB: Math.round((sizeBytes / (1024 * 1024)) * 1000) / 1000,
    serializationTimeMS: Math.round(elapsedMS * 100) / 100,
    countOfNestedObjects,
    fieldsWithNulls: fieldsWithNulls.slice(0, 20),
    classification,
    timestamp: new Date().toISOString(),
  };

  pushEntry(entry);
  scheduleFlush();
  return { data, entry };
}