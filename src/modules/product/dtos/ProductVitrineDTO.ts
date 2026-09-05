// modules/product/dtos/ProductVitrineDTO.ts
// ============================================================
// Tarefa 2 — DTO "Vitrine" (listagem inicial do Frontend)
//
// ➜ Retorna APENAS campos essenciais para o card da landing page.
// ➜ Sem descrições longas, metas, storage paths ou relacionamentos.
// ➜ O banco já recebe projeção (SELECT com colunas explícitas) —
//   nada de JOIN desnecessário nem N+1.
//
// Nota de nomenclatura: mantivemos o contrato camelCase já usado
// pela API atual. Se quiser os nomes PT-BR do enunciado
// (nome, preco, imagem_principal_url...), basta renomear na chave
// do objeto retornado em `mapToVitrine` — o Frontend precisa
// acompanhar a mudança.
// ============================================================

import type { CommercialType } from '../types/Product';

/** Item exibido no card da vitrine (landing page). */
export interface ProductVitrineItem {
  id: string;
  name: string;
  slug: string;
  commercialType: CommercialType;
  price: number | null;
  redirectUrl: string | null;

  /** URL da imagem principal — NUNCA base64 (sempre storage/CDN). */
  imageUrl: string | null;

  featured: boolean;
  displayOrder: number;
  active: boolean;
}

/**
 * Mapeia uma linha crua do Supabase (com a projeção VITRINE_COLUMNS)
 * para a forma enxuta que vai na resposta.
 *
 * Este é o ÚNICO ponto onde os campos são "cortados": se o banco
 * devolver a mais, aqui é podado; se o banco já projeta só o
 * necessário, o mapper é puramente uma cópia.
 */
export function mapToVitrine(row: any): ProductVitrineItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    commercialType: row.commercial_type,
    price: row.price,
    redirectUrl: row.redirect_url,
    imageUrl: row.image_url,
    featured: row.featured,
    displayOrder: row.display_order,
    active: row.active,
  };
}