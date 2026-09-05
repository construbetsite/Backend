// scripts/vitrine-demo.ts
// ============================================================
// Demonstração prática da ROTA VITRINE + testes do scanner.
//
// Uso:  npm run vitrine
//
// O que este script faz:
//   1. Imprime os comandos curl/PowerShell para testar a rota.
//   2. (Opcional) Se o servidor estiver na porta env.PORT, faz
//      chamadas reais e compara tamanhos.
// ============================================================

import { formatSizeKB } from '../src/lib/payloadStats';
import { DEFAULT_LIMIT } from '../src/lib/pagination';

const BASE = `http://localhost:${process.env.PORT ?? 10000}`;

const vitrineCmd = `${BASE}/api/product/vitrine?page=1&limit=${DEFAULT_LIMIT}`;
const fullCmd = `${BASE}/api/product?limit=${DEFAULT_LIMIT}`;
const detailCmd = `${BASE}/api/product/slug/exemplo-slug`;

console.log('\n════════════════════════════════════════════════════════');
console.log('  🏪 ROTA VITRINE + SCANNER DE PAYLOAD — demo');
console.log('════════════════════════════════\n');

console.log('1️⃣  Suba o servidor em outro terminal:');
console.log('     npm run dev');
console.log('   (o scanner de payload fica ligado por padrão em dev)\n');

console.log('2️⃣  Teste a ROTA VITRINE (leve, cacheada, paginada):');
console.log(`     GET ${vitrineCmd}\n`);
console.log('   PowerShell:');
console.log(`     curl.exe -i ${vitrineCmd}`);
console.log('');
console.log('   Compare com a listagem COMPLETA (payload pesado):');
console.log(`     curl.exe -i ${fullCmd}`);
console.log('');
console.log('   E com o detalhe (select *):');
console.log(`     curl.exe -i ${detailCmd}`);
console.log('');

console.log('3️⃣  Teste o cache/ETag (segunda chamada deve dar 304):');
console.log('     curl.exe -i -H "If-None-Match: <etag-da-primeira>" ' + vitrineCmd);
console.log('');

console.log('4️⃣  Leia o relatório gerado pelo scanner:');
console.log('     npm run report:rotas');
console.log('     → agrupa por rota e aponta as 3 mais pesadas.');
console.log('');

console.log('5️⃣  Varredura estrutural (mapeia rotas → entidades):');
console.log('     npm run scan:rotas');
console.log('');

// Demonstra o tamanho teórico (estimativa) de uma página da vitrine
const itemSample = {
  id: 'uuid-exemplo',
  name: 'Produto Exemplo',
  slug: 'produto-exemplo',
  commercialType: 'PICKUP',
  price: 1299.9,
  redirectUrl: null,
  imageUrl: 'https://cdn.exemplo.com/img/1.jpg',
  featured: true,
  displayOrder: 1,
  active: true,
};
const bytesPerItem = Buffer.byteLength(JSON.stringify(itemSample), 'utf-8');
console.log('   📏 Estimativa: cada item da vitrine ≈ ' + formatSizeKB(bytesPerItem));
console.log(`   📏 Página com ${DEFAULT_LIMIT} itens ≈ ${formatSizeKB(bytesPerItem * DEFAULT_LIMIT)}`);

async function main(): Promise<void> {
  try {
    const res = await fetch(vitrineCmd);
    const body: any = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(body));
    const realKB = Buffer.byteLength(JSON.stringify(body), 'utf-8') / 1024;
    console.log(`\n   ✅ Resposta real da vitrine: ${res.status} | ${formatSizeKB(realKB)} (sem compactação)`);
    console.log(
      `   ✅ Cache-Control: ${res.headers.get('cache-control')} | ETag: ${res.headers.get('etag')}`
    );
  } catch {
    console.log(
      '\n   ⚠️  Servidor offline ainda. Rode `npm run dev` e execute novamente.'
    );
  }
}

void main();