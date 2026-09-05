// scripts/route-scan.ts
// ============================================================
// Tarefa 3 — Varredura Estrutural de Rotas (análise estática)
//
// Escaneia o código-fonte (sem executar a aplicação) e reconstrói:
//   1. Quais montagens existem (app.use) e seus prefixos.
//   2. Quais rotas cada router define (método + path + handler).
//   3. A CADEIA completa do handler: controller.method → service.method
//      → repository.method → tabela (entidade) → projeção SELECT.
//   4. Heurística de peso/payload por rota.
//   5. Plano de redução com as 3 rotas mais "pesadas".
//
// Saída: console + reports/route-analysis.json
// Uso:  npm run scan:rotas
// ============================================================

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'reports');
const OUT_FILE = path.join(OUT_DIR, 'route-analysis.json');

// ------------------------------------------------------------
// Utilidades de leitura
// ------------------------------------------------------------
const readCache = new Map<string, string>();
function read(file: string): string {
  if (readCache.has(file)) return readCache.get(file)!;
  const content = fs.readFileSync(file, 'utf-8');
  readCache.set(file, content);
  return content;
}

function walkDir(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full, acc);
    else if (entry.name.endsWith('.ts')) acc.push(full);
  }
  return acc;
}
void walkDir;

// Resolve import relativo: "import X from './y'" | "{ X }" | "{ Y as X }"
function resolveImport(fromFile: string, name: string): string | null {
  const content = read(fromFile);
  const re =
    /import\s+(?:(?:(\w[\w$]*)\s*,)?\s*\{([^}]*)\}\s*|(\w[\w$]*)\s*)from\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const [, defaultName, namedList, onlyDefault, rawPath] = m;
    const cleanPath = rawPath!;
    if (!cleanPath || cleanPath.startsWith('@')) continue;

    let matched = false;
    if (defaultName === name) matched = true;
    if (namedList) {
      for (const part of namedList.split(',')) {
        const spec = part.trim();
        if (spec === name) matched = true;
        if (spec.endsWith(` as ${name}`)) matched = true;
      }
    }
    if (onlyDefault === name) matched = true;
    if (!matched) continue;

    const candidates = [
      cleanPath,
      cleanPath.endsWith('.ts') ? cleanPath : `${cleanPath}.ts`,
      path.join(cleanPath, 'index.ts'),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
      const abs = path.resolve(path.dirname(fromFile), c);
      if (fs.existsSync(abs)) return abs;
    }
  }
  return null;
}

// Divide args de `f(` em índice dado, respeitando strings e parênteses.
function splitArgs(src: string, openParenIdx: number): string[] {
  const args: string[] = [];
  let depth = 0;
  let start = openParenIdx + 1;
  let quote: string | null = null;
  for (let i = openParenIdx; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === '\\') { i += 1; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '(') depth += 1;
    else if (ch === ')') {
      depth -= 1;
      if (depth === 0) {
        args.push(src.slice(start, i).trim());
        return args;
      }
    } else if (ch === ',' && depth === 1) {
      args.push(src.slice(start, i).trim());
      start = i + 1;
    }
  }
  return args;
}

// Corpo { } balanceado após `from`.
function bodyAfter(src: string, from: number): string {
  const open = src.indexOf('{', from);
  if (open === -1) return '';
  let depth = 0;
  let quote: string | null = null;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === '\\') { i += 1; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return src.slice(open + 1, i);
    }
  }
  return '';
}

// ------------------------------------------------------------
// Etapa 1 — montagens (app.use) e conteúdo do index.ts
// ------------------------------------------------------------
interface Mount {
  prefix: string;
  routerImportName: string;
  routerFile: string | null;
}

function findMounts(): Mount[] {
  const indexFile = path.join(SRC, 'index.ts');
  const content = read(indexFile);
  const mounts: Mount[] = [];
  const re = /app\.use\s*\(\s*['"]([^'"]+)['"]\s*,\s*(\w[\w$]*)\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    mounts.push({
      prefix: m[1],
      routerImportName: m[2],
      routerFile: resolveImport(indexFile, m[2]),
    });
  }
  return mounts;
}// ------------------------------------------------------------
// Etapa 2 — rotas declaradas em cada router
// ------------------------------------------------------------
interface RouteDecl {
  method: string;
  path: string;
  handlerToken: string | null;
  controllerVar: string | null;
}

interface ServiceCall {
  method: string;
  args: string[];
}

interface RepoCall {
  method: string;
  args: string[];
}

interface TypeInfo {
  table: string | null;
  select: string | null;
}

// Encontra "const controller = new X(" no arquivo de rotas
// Prefere classes *Controller (handlers), depois *Service.
function findControllerVar(routerContent: string): string | null {
  const re = /const\s+(\w[\w$]*)\s*=\s*new\s+(\w[\w$]*)\s*\(/g;
  let m: RegExpExecArray | null;
  let fallback: string | null = null;
  while ((m = re.exec(routerContent)) !== null) {
    if (/Controller$/.test(m[2])) return m[1];
    if (/Service$/.test(m[2]) && !fallback) fallback = m[1];
  }
  return fallback;
}

// Varre imports do arquivo e retorna o primeiro símbolo cujo nome
// termina com o sufixo dado (ex.: "ProductService" → sufixo "Service").
// Suporta default (import X from) e named ({ X } / { X as Y }).
function findImportedClass(
  file: string,
  suffix: 'Service' | 'Repository' | 'Controller'
): { name: string; rawPath: string } | null {
  const content = read(file);
  const re =
    /import\s+(?:(?:(\w[\w$]*)\s*,)?\s*\{([^}]*)\}\s*|(\w[\w$]*)\s*)from\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const [, defaultName, namedList, onlyDefault, rawPath] = m;
    const names: string[] = [];
    if (defaultName) names.push(defaultName);
    if (namedList) {
      for (const part of namedList.split(',')) {
        const spec = part.trim();
        if (!spec) continue;
        // "Y as X" ou "X"
        const mm = spec.match(/^(?:\w[\w$]*\s+as\s+)?(\w[\w$]*)$/);
        if (mm) names.push(mm[1]);
      }
    }
    if (onlyDefault) names.push(onlyDefault);
    for (const name of names) {
      if (name.endsWith(suffix)) return { name, rawPath };
    }
  }
  return null;
}

function parseRoutes(routerFile: string): RouteDecl[] {
  const content = read(routerFile);
  const results: RouteDecl[] = [];
  const controllerVar = findControllerVar(routerContentRef(content));

  const re = /\.(get|post|put|delete|patch)\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const method = m[1];
    // m[0] termina no '(' — splitArgs espera o índice do parêntese
    const openParenIdx = m.index + m[0].length - 1;
    const args = splitArgs(content, openParenIdx);
    if (args.length < 2) continue;
    const p = args[0].replace(/^['"`]|['"`]$/g, '') || '/';

    // handler = último arg que parece "objeto.metodo" do controller
    let handlerToken: string | null = null;
    let matchedVar: string | null = null;
    for (let i = args.length - 1; i >= 1; i--) {
      const arg = args[i];
      const mm = arg.match(/^([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)\s*$/);
      if (mm && mm[1] === controllerVar) {
        handlerToken = `${mm[1]}.${mm[2]}`;
        matchedVar = mm[1];
        break;
      }
    }

    results.push({
      method: method.toUpperCase(),
      path: p,
      handlerToken,
      controllerVar: matchedVar || controllerVar,
    });
  }
  return results;
}

// Pega o conteúdo do router (para o findControllerVar sem re-ler)
function routerContentRef(content: string): string {
  return content;
}

// ------------------------------------------------------------
// Scanner de corpo de método (robusto a tipos com { } aninhado)
//
// Encontra o corpo { ... } de um método lidando com:
//   - Promise<{ items: T }> → o { do tipo NÃO é o corpo
//   - arrow (name = async (...) : Promise<X> => {)
//   - método (async name (...) : Promise<X> {)
// ------------------------------------------------------------
function findMethodBody(
  content: string,
  methodName: string,
  arrowStyle: boolean
): string | null {
  const re = arrowStyle
    ? new RegExp(`\\b${methodName}\\s*=\\s*async\\s*\\(`)
    : new RegExp(`\\basync\\s+${methodName}\\s*\\(`);

  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const start = m.index + m[0].length - 1; // índice do '('

    // ---- Fase 1: percorre os parâmetros até o ')' final ----
    let parenDepth = 1;
    let angleDepth = 0;
    let quote: string | null = null;
    let i = start + 1;
    for (; i < content.length; i++) {
      const ch = content[i];
      const prev = content[i - 1];
      if (quote) {
        if (ch === '\\') { i += 1; continue; }
        if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
      if (ch === '/' && content[i + 1] === '/') { while (i < content.length && content[i] !== '\n') i += 1; continue; }
      if (ch === '/' && content[i + 1] === '*') { i += 2; while (i + 1 < content.length && !(content[i] === '*' && content[i + 1] === '/')) i += 1; i += 1; continue; }
      if (ch === '<') { angleDepth += 1; continue; }
      if (ch === '>' && prev !== '=') { angleDepth = Math.max(0, angleDepth - 1); continue; }
      if (ch === '(') { parenDepth += 1; continue; }
      if (ch === ')') {
        parenDepth -= 1;
        if (parenDepth === 0) break;
      }
    }

    // ---- Fase 2: varre o tipo de retorno até o '{' do corpo ----
    angleDepth = 0;
    quote = null;
    for (i += 1; i < content.length; i++) {
      const ch = content[i];
      const prev = content[i - 1];
      if (quote) {
        if (ch === '\\') { i += 1; continue; }
        if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
      if (ch === '/' && content[i + 1] === '/') { while (i < content.length && content[i] !== '\n') i += 1; continue; }
      if (ch === '/' && content[i + 1] === '*') { i += 2; while (i + 1 < content.length && !(content[i] === '*' && content[i + 1] === '/')) i += 1; i += 1; continue; }
      if (ch === '<') { angleDepth += 1; continue; }
      if (ch === '>' && prev !== '=') { angleDepth = Math.max(0, angleDepth - 1); continue; }
      if (ch === '{' && angleDepth === 0) {
        // retorna o conteúdo do corpo (balanceado)
        return bodyAfter(content, i);
      }
    }
  }
  return null;
}

// Extrai chamadas a métodos do service dentro de um método do controller
function extractServiceCalls(
  controllerFile: string,
  methodName: string
): ServiceCall[] {
  const content = read(controllerFile);
  const body = findMethodBody(content, methodName, true);
  const calls: ServiceCall[] = [];
  if (body === null) return calls;
  const callRe = /this\.service\.(\w+)\s*\(/g;
  let cm: RegExpExecArray | null;
  while ((cm = callRe.exec(body)) !== null) {
    calls.push({ method: cm[1], args: [] });
  }
  return calls;
}

// Extrai chamadas ao repository dentro de um método do service
function extractRepoCalls(
  serviceFile: string,
  methodName: string
): RepoCall[] {
  const content = read(serviceFile);
  const body = findMethodBody(content, methodName, false);
  const calls: RepoCall[] = [];
  if (body === null) return calls;
  const callRe = /this\.repository\.(\w+)\s*\(/g;
  let cm: RegExpExecArray | null;
  while ((cm = callRe.exec(body)) !== null) {
    calls.push({ method: cm[1], args: [] });
  }
  return calls;
}

// Pega tabela + projeção SELECT do método do repository.
// Resolve também constantes de nível de arquivo:
//   private readonly table = 'products'
//   const LIST_COLUMNS = 'id, name, ...'
//   .select(LIST_COLUMNS, { count: 'exact' })
function repoTypeInfo(repoFile: string, methodName: string): TypeInfo {
  const content = read(repoFile);

  // 1) Coleta constantes de topo: NOME = 'valor'
  const constMap = new Map<string, string>();
  const constRe = /(?:const|readonly|private\s+readonly)\s+(\w+)\s*=\s*['"]([^'"]+)['"]/g;
  let cm: RegExpExecArray | null;
  while ((cm = constRe.exec(content)) !== null) {
    constMap.set(cm[1], cm[2]);
  }

  const body = findMethodBody(content, methodName, false);
  if (body === null) return { table: null, select: null };

  // Tabela: .from('x') ou .from(this.table) → resolve constante
  const tableRe = /\.from\s*\(\s*([\w.'"]+)\s*\)/;
  const tableMatch = body.match(tableRe);
  let table: string | null = null;
  if (tableMatch) {
    const raw = tableMatch[1].replace(/['"]/g, '');
    table = constMap.get(raw) ?? (raw === 'this.table' ? constMap.get('table') ?? null : raw);
  }

  // Projeção: .select('...') | .select(VAR, {...}) | .select(VAR)
  const selectRe = /\.select\s*\(\s*([^,)]+)/;
  const selectMatch = body.match(selectRe);
  let select: string | null = null;
  if (selectMatch) {
    const raw = selectMatch[1].replace(/['"`]/g, '').trim();
    if (constMap.has(raw)) {
      select = constMap.get(raw)!;
    } else {
      select = raw;
    }
    select = select.replace(/\/\/.*$/gm, '').trim();
    if (!select) select = null;
  }
  return { table, select };
}// ------------------------------------------------------------
// Etapa 3 — heurística de peso (falta de projeção = suspeito)
// ------------------------------------------------------------
interface AnalyzedRoute {
  fullPath: string;
  method: string;
  handler: string;
  controller: {
    file: string;
    method: string;
  } | null;
  service: {
    file: string;
    method: string;
  } | null;
  repository: {
    file: string;
    method: string;
    table: string | null;
  } | null;
  projection: string | null;
  weight: number;
  classification: 'leve' | 'medio' | 'pesado';
  redFlags: string[];
  suggestion: string;
}

const HEAVY_TOKEN_RE =
  /description|content|html|meta_|base64|data:image|image_path|image_filename|\.select\(\s*['"]\*['"]/;

function computeWeight(select: string | null): number {
  let w = 40;
  if (select === null || select === '*') w += 80; // sem projeção → puxa todas as colunas
  else {
    if (HEAVY_TOKEN_RE.test(select)) w += 60;
    if (select.split(',').length > 10) w += 30;
    if (/\(\*\)/.test(select)) w += 90; // embed/relacionamento
    if (/\bselect.*\.\*/.test(select)) w += 50;
    // projeção lean (sem textos longos)
    if (!/(description|content|html|base64|image_path)/.test(select)) w -= 25;
  }
  return Math.max(10, w);
}

function classifyWeight(w: number): 'leve' | 'medio' | 'pesado' {
  if (w < 70) return 'leve';
  if (w < 120) return 'medio';
  return 'pesado';
}

function buildSuggestion(r: AnalyzedRoute): string {
  const table = r.repository?.table ? `"${r.repository.table}"` : 'entidade';
  if (r.projection === null || r.projection === '*') {
    return `Criar projeção explícita (select com colunas) na tabela ${table}; remover campos não usados (descrições longas, base64, metas).`;
  }
  if (r.projection && HEAVY_TOKEN_RE.test(r.projection)) {
    return `Projeção '${r.projection}' ainda carrega campos pesados (descrições/content/base64); trocar por colunas enxutas.`;
  }
  return 'Projeção já enxuta ✅ — apenas garantir paginação e cache.';
}

// ------------------------------------------------------------
// Etapa 4 — montagem do relatório e plano
// ------------------------------------------------------------
function buildAnalysis(): AnalyzedRoute[] {
  const mounts = findMounts();
  const routes: AnalyzedRoute[] = [];

  for (const mount of mounts) {
    if (!mount.routerFile) {
      routes.push({
        fullPath: `${mount.prefix} ???`,
        method: '?',
        handler: mount.routerImportName,
        controller: null,
        service: null,
        repository: null,
        projection: null,
        weight: 10,
        classification: 'leve',
        redFlags: ['Router não resolvido'],
        suggestion: 'Verificar import no index.ts',
      });
      continue;
    }
    const decls = parseRoutes(mount.routerFile);
    for (const d of decls) {
      const suffix = d.path === '/' ? '' : d.path === '*' ? '/*' : d.path;
      const fullPath = `${mount.prefix}${suffix}`;
      const handler = d.handlerToken
        ? d.handlerToken.split('.')[1]
        : '?';

      // Controller file
      let controllerMethod: string | null = null;
      let controllerFile: string | null = null;
      let serviceChain: string | null = null;
      let serviceFile: string | null = null;
      let repoChain: string | null = null;
      let repoFile: string | null = null;
      let table: string | null = null;
      let projection: string | null = null;

      if (d.handlerToken && d.controllerVar) {
        const ctrlVar = d.controllerVar;
        // achar import do controller usado no router
        const routerContent = read(mount.routerFile);
        const classRe = new RegExp(
          `const\\s+${ctrlVar}\\s*=\\s*new\\s+(\\w+)\\s*\\(`
        );
        const classMatch = routerContent.match(classRe);
        if (classMatch) {
          controllerFile = resolveImport(mount.routerFile, classMatch[1]);
          controllerMethod = handler;
        }

        if (controllerFile && controllerMethod) {
          const serviceCalls = extractServiceCalls(
            controllerFile,
            controllerMethod
          );
          if (serviceCalls.length > 0) {
            // primeiro service.xxx (heurística: método "principal")
            const svcName = serviceCalls[0].method;
            const svcImport = findImportedClass(
              controllerFile,
              'Service'
            );
            if (svcImport) {
              serviceFile = resolveImport(
                controllerFile,
                svcImport.name
              );
              serviceChain = svcName;
            }
          }
        }
      }

      if (serviceFile && serviceChain) {
        const repoCalls = extractRepoCalls(serviceFile, serviceChain);
        if (repoCalls.length > 0) {
          const repoName = repoCalls[0].method;
          const repoImport = findImportedClass(
            serviceFile,
            'Repository'
          );
          if (repoImport) {
            repoFile = resolveImport(
              serviceFile,
              repoImport.name
            );
            repoChain = repoName;
          }
        }
        if (repoFile && repoChain) {
          const info = repoTypeInfo(repoFile, repoChain);
          table = info.table;
          projection = info.select;
        }
      }

      const weight = computeWeight(projection);
      const classification = classifyWeight(weight);
      const redFlags: string[] = [];
      if (!projection || projection === '*') {
        redFlags.push('SELECT * (todas as colunas)');
      }
      if (table === null) redFlags.push('Tabela não detectada');
      if (HEAVY_TOKEN_RE.test(projection ?? '')) {
        redFlags.push('Campos pesados (description/html/base64/meta)');
      }

      const r: AnalyzedRoute = {
        fullPath,
        method: d.method,
        handler,
        controller: controllerFile
          ? { file: controllerFile, method: controllerMethod! }
          : null,
        service: serviceFile
          ? { file: serviceFile, method: serviceChain! }
          : null,
        repository: repoFile
          ? { file: repoFile, method: repoChain!, table }
          : null,
        projection,
        weight,
        classification,
        redFlags,
        suggestion: '',
      };
      r.suggestion = buildSuggestion(r);
      routes.push(r);
    }
  }
  return routes;
}

// ------------------------------------------------------------
// Saída
// ------------------------------------------------------------
function printReport(routes: AnalyzedRoute[]): void {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  🔍 VARRE-DURA ESTRUTURAL DE ROTAS (Tarefa 3)');
  console.log('════════════════════════════════════════════════════════\n');

  const byClass = {
    leve: routes.filter((r) => r.classification === 'leve'),
    medio: routes.filter((r) => r.classification === 'medio'),
    pesado: routes.filter((r) => r.classification === 'pesado'),
  };

  console.log(
    `Total de rotas: ${routes.length}  |  Leves: ${byClass.leve.length}  |  Médias: ${byClass.medio.length}  |  Pesadas: ${byClass.pesado.length}`
  );
  console.log('\n── ROTAS SUSPEITAS (peso ≥ médio) ──────────────────────');
  [...byClass.pesado, ...byClass.medio]
    .sort((a, b) => b.weight - a.weight)
    .forEach((r) => {
      const chain = [
        r.controller?.method && `ctrl:${r.controller.method}`,
        r.service?.method && `svc:${r.service.method}`,
        r.repository?.method && `repo:${r.repository.method}`,
        r.repository?.table && `tabela:${r.repository.table}`,
      ]
        .filter(Boolean)
        .join(' → ');
      console.log(`\n${r.method} ${r.fullPath}  [${r.classification} ${r.weight}pts]`);
      console.log(`   Handler: ${r.handler}   |   ${chain || 'cadeia não resolvida'}`);
      if (r.projection) console.log(`   Projeção: ${r.projection}`);
      if (r.redFlags.length) console.log(`   ⚠️  ${r.redFlags.join(' | ')}`);
      console.log(`   💡 ${r.suggestion}`);
    });

  console.log('\n── PLANO DE AÇÃO (3 rotas prioritárias) ────────────────');
  const top3 = [...routes].sort((a, b) => b.weight - a.weight).slice(0, 3);
  top3.forEach((r, i) => {
    console.log(
      `\n${i + 1}. ${r.method} ${r.fullPath} (peso ${r.weight})\n   ${r.suggestion}`
    );
  });
  console.log('\n');
}

const routes = buildAnalysis();
printReport(routes);

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(
  OUT_FILE,
  JSON.stringify({ generatedAt: new Date().toISOString(), routes }, null, 2),
  'utf-8'
);
console.log(`📄 Relatório completo salvo em: ${OUT_FILE}\n`);