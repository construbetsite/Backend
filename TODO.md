# TODO - Otimizações do Módulo do Blog

## Upload de imagens
- [ ] Criar bucket no Supabase Storage (`blog-images`, público para leitura).
- [ ] Implementar `POST /api/blog/posts/upload` com `multer` (memória, 5MB, JPEG/PNG/WEBP).
- [ ] Enviar arquivo para o Storage e retornar `{ success: true, url }`.
- [ ] Restringir rota a admins autenticados (`authMiddleware` + `isAdminMiddleware`).
- [ ] Tratar erros: `{ success: false, message }` com HTTP 400/413/500 conforme o caso.

## Campo `status` nos posts
- [ ] Adicionar coluna `status` (`rascunho` | `publicado` | `arquivado`) na tabela `blog_posts`.
- [ ] Atualizar `BlogPostRow`/`BlogPost` em `types/blogPost.types.ts`.
- [ ] Validar valor via Joi (`createBlogPostSchema` e `updateBlogPostSchema`).
- [ ] Mapear para a coluna snake_case no `BlogPostRepository` (default `rascunho`).
- [ ] Permitir filtro `?status=` no `list`.
- [ ] Garantir consistência de erros: `{ success: false, message }` com códigos HTTP.

## Integração e validação
- [ ] Integrar rotas no `src/index.ts`.
- [ ] Rodar `npm run build`.
- [ ] Testar endpoints via Postman.

