// scripts/payload-report-reader.ts
// ============================================================
// Leitor/agrupador do relatório gerado pelo Payload Scanner.
//
// Lê reports/payload-report.json (gerado pela Tarefa 1) e:
//   1. Agrupa por rota → soma de tamanho, contagem, médias.
//   2. Classifica: leve < 10KB | médio 10–100KB | pesado > 100KB.
//   3. Lista as 3 rotas mais lentas e mais pesadas.
//   4. Cruza com routes analysis (se existir) para sugerir plano.
//
// Uso:  npm run report:rotas
// ============================================================

import fs from 'fs';
import path from 'path';

const REPORTS_DIR = path.resolve(__dirname, '..', 'reports');
const PAYLOAD_FILE = path.join(REPORTS_DIR, 'payload-report.json');
const ROUTES_FILE = path.join(REPORTS_DIR, 'route-analysis.json');

interface ReportEntry {
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

interface Aggregated {
  route: string;
  method: string;
  count: number;
  avgSizeKB: number;
  maxSizeKB: number;
  avgTimeMS: number;
  maxTimeMS: number;
  avgNested: number;
  nullFields: string[];
  classification: 'leve' | 'medio' | 'pesado';
  suggestion: string;
}

function classify(sizeKB: number): 'leve' | 'medio' | 'pesado' {
  if (sizeKB < 10) return 'leve';
  if (sizeKB <= 100) return 'medio';
  return 'pesado';
}

function loadJSON<T>(file: string): T | null {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
  } catch {
    console.warn(`⚠️  Não foi possível ler ${file} (JSON inválido?)`);
    return null;
  }
}

function aggregate(entries: ReportEntry[]): Aggregated[] {
  const map = new Map<string, ReportEntry[]>();
  for (const e of entries) {
    const key = `${e.method} ${e.route}`;
    const list = map.get(key) ?? [];
    list.push(e);
    map.set(key, list);
  }

  const out: Aggregated[] = [];
  for (const [k, list] of map) {
    const [method, route] = [k.split(' ')[0], k.slice(k.indexOf(' ') + 1)];
    const sizes = list.map((e) => e.sizeKB);
    const times = list.map((e) => e.serializationTimeMS);
    const avgSizeKB = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const maxSizeKB = Math.max(...sizes);
    const avgTimeMS = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTimeMS = Math.max(...times);
    const avgNested =
      list.reduce((a, b) => a + b.countOfNestedObjects, 0) / list.length;

    const nullCount = new Map<string, number>();
    for (const e of list) {
      for (const f of e.fieldsWithNulls) {
        nullCount.set(f, (nullCount.get(f) ?? 0) + 1);
      }
    }
    const nullFields = [...nullCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([f, n]) => `${f} (${n}x)`);

    out.push({
      route,
      method,
      count: list.length,
      avgSizeKB: Math.round(avgSizeKB * 100) / 100,
      maxSizeKB: Math.round(maxSizeKB * 100) / 100,
      avgTimeMS: Math.round(avgTimeMS * 100) / 100,
      maxTimeMS: Math.round(maxTimeMS * 100) / 100,
      avgNested: Math.round(avgNested * 100) / 100,
      nullFields,
      classification: classify(avgSizeKB),
      suggestion: '',
    });
  }

  return out.sort((a, b) => b.avgSizeKB - a.avgSizeKB);
}

function loadRouteSuggestions(): Map<string, string> {
  const analysis = loadJSON<{ routes: { fullPath: string; suggestion: string }[] }>(
    ROUTES_FILE
  );
  const map = new Map<string, string>();
  if (analysis) {
    for (const r of analysis.routes) {
      map.set(r.fullPath, r.suggestion);
    }
  }
  return map;
}

function main(): void {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  📊 RELATÓRIO DE PAYLOADS (Tarefa 1 — Scanner)');
  console.log('════════════════════════════════\n');

  const entries = loadJSON<ReportEntry[]>(PAYLOAD_FILE);
  if (!entries || entries.length === 0) {
    console.log(
      'ℹ️  Nenhum dado em reports/payload-report.json ainda.\n   ➜ Suba o servidor com PAYLOAD_SCAN=1 e faça algumas requisições.\n   ➜ Ex: npm run dev (scanner liga por padrão em dev).\n'
    );
    return;
  }

  const suggestions = loadRouteSuggestions();
  const agg = aggregate(entries);

  const byClass = {
    leve: agg.filter((a) => a.classification === 'leve'),
    medio: agg.filter((a) => a.classification === 'medio'),
    pesado: agg.filter((a) => a.classification === 'pesado'),
  };

  console.log(
    `Rotas monitoradas: ${agg.length}  |  Leves: ${byClass.leve.length}  |  Médias: ${byClass.medio.length}  |  Pesadas: ${byClass.pesado.length}\n`
  );

  console.log('── TOP POR PESO MÉDIO (KB) ──────────────────────────────');
  agg.slice(0, 10).forEach((a, i) => {
    console.log(
      `${String(i + 1).padStart(2)}. ${a.method} ${a.route}\n` +
      `      média: ${a.avgSizeKB} KB | máx: ${a.maxSizeKB} KB | reqs: ${a.count}\n` +
      `      tempo: ${a.avgTimeMS}ms (máx ${a.maxTimeMS}ms) | aninhados: ${a.avgNested}`
    );
  });

  console.log('\n── ROTAS MÉDIAS E PESADAS (plano de redução) ──────────');
  const toReduce = [...byClass.pesado, ...byClass.medio];
  if (toReduce.length === 0) {
    console.log('Nenhuma rota pesada. 🎉');
  } else {
    toReduce.forEach((a, i) => {
      console.log(
        `${i + 1}. ${a.method} ${a.route} [${a.classification} ${a.avgSizeKB}KB médio]`
      );
      if (a.nullFields.length) {
        console.log(`   🔸 Campos sempre/sempre null: ${a.nullFields.join(', ')}`);
      }
      if (a.avgNested > 0) {
        console.log(`   🔸 Objetos aninhados por resposta: ${a.avgNested}`);
      }
      const sug = suggestions.get(a.route);
      if (sug) console.log(`   💡 ${sug}`);
      else console.log('   💡 Criar DTO resumido + projeção SELECT enxuta.');
    });

    console.log('\n── PLANO DE AÇÃO (3 rotas prioritárias) ────────────────');
    const top3 = toReduce.slice(0, 3);
    top3.forEach((a, i) => {
      const sug = suggestions.get(a.route);
      console.log(
        `\n${i + 1}. ${a.method} ${a.route}\n   ${sug ?? 'Criar DTO resumido + projeção SELECT enxuta.'}`
      );
    });
  }
  console.log('\n');
}

main();