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
