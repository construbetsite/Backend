-- ============================================================
-- Otimização de performance — Módulo Blog (Supabase / PostgreSQL)
-- Execute este script no SQL Editor do Supabase.
-- Índices são transparentes: não alteram schema nem payload.
-- ============================================================

-- 1. Listagem principal: filtro por status + ordenação por data
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_created
  ON blog_posts (status, created_at DESC);

-- 2. Filtro por categoria + status
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_status
  ON blog_posts (category, status);

-- 3. Busca rápida por slug (detalhe do post)
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_posts_slug
  ON blog_posts (slug);

-- 4. Filtro por tags (array) — acelera query.contains('tags', [tag])
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags
  ON blog_posts USING GIN (tags);

-- 5. Filtro por destaque
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured
  ON blog_posts (featured)
  WHERE featured = true;

-- 6. Verificação rápida de slug duplicado (usado em slugExists)
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug_id
  ON blog_posts (slug, id);

-- ============================================================
-- 🔥 CORREÇÃO (R2) — Índices do MÓDULO PRODUCT (tabela products)
-- Executar no SQL Editor do Supabase. Sem estes índices, os filtros
-- de listagem e as buscas por slug fazem Seq Scan (degrada com o
-- crescimento da tabela).
-- ============================================================

-- 7. Busca por slug (detalhe do produto) — único também garante unicidade no banco
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug
  ON products (slug);

-- 8. Listagem: filtros de igualdade primeiro + ordenação por display_order/created_at
--    (cobre findAll / findAllPaginated e o COUNT com count: 'exact')
CREATE INDEX IF NOT EXISTS idx_products_list
  ON products (active, commercial_type, category_id, display_order, created_at DESC);

-- 9. Verificação de slug/SKU duplicado (slugExists/skuExists com neq id)
CREATE INDEX IF NOT EXISTS idx_products_slug_id
  ON products (slug, id);
CREATE INDEX IF NOT EXISTS idx_products_sku_id
  ON products (sku, id);
