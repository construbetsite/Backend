# 📚 API de Blog – Guia Completo de Integração para Front-end

**Versão:** 1.0  
**Data:** 2026-08-15  
**Status:** ✅ Pronto para Produção  

---

## ⚠️ AVISO CRÍTICO

**PROBLEMA IDENTIFICADO:** A rota de upload está configurada como:
```
❌ POST /api/blog/posts/upload  (ATUAL - INCORRETO)
✅ Deveria ser: POST /api/blog/upload
```

**AÇÃO NECESSÁRIA:** O arquivo `src/index.ts` linha 24 precisa ser alterado de:
```typescript
app.use("/api/blog/posts/upload", blogUploadRoutes);
```
para:
```typescript
app.use("/api/blog/upload", blogUploadRoutes);
```

Isso eliminará a ambiguidade e seguirá o padrão de rotas RESTful.

---

## 🌐 Base URL

```
http://localhost:10000/api/blog
```

Para produção, substituir `localhost:10000` pela URL do servidor.

---

## 🔐 Autenticação

**Todas as operações de escrita (CREATE, UPDATE, DELETE, UPLOAD) exigem:**

- **Header:** `Authorization: Bearer {token}`
- **Role:** Admin (verificado pelo middleware `isAdminMiddleware`)
- **Token:** Obtido via endpoint `/api/auth/login`

**Operações de leitura (GET) podem ser públicas ou autenticadas:**

- `GET /posts` - **Público** (lista posts com `status: true`)
- `GET /posts/slug/:slug` - **Público**
- `GET /posts/id/:id` - **Admin apenas**
- `GET /categorias` - **Público**

---

## 📋 Endpoints Disponíveis

### 1. ⬆️ Upload de Imagem

**Endpoint:** `POST /upload`

> **⚠️ ATENÇÃO:** Atualmente em `/posts/upload`, deve ser movido para `/upload`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Parâmetros:**
- `image` (FormData) - Arquivo de imagem (OBRIGATÓRIO)
  - Máximo: 5 MB
  - Formatos aceitos: JPEG, PNG, WEBP

**Validações:**
| Erro | Código | Motivo |
|------|--------|--------|
| Campo ausente | 400 | Nenhum arquivo no campo "image" |
| Arquivo vazio | 400 | Buffer vazio |
| Arquivo > 5MB | 413 | Payload muito grande |
| Formato inválido | 415 | Não é JPEG, PNG ou WEBP |
| Não autenticado | 401 | Token faltando ou inválido |
| Sem permissão | 403 | Usuário não é admin |

**Resposta Sucesso (201):**
```json
{
  "success": true,
  "data": {
    "url": "https://storage.supabase.com/...",
    "path": "posts/unique-id/filename.jpg"
  }
}
```

**Resposta Erro (400):**
```json
{
  "success": false,
  "message": "Imagem maior que 5MB"
}
```

**Exemplo cURL:**
```bash
curl -X POST http://localhost:10000/api/blog/upload \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -F "image=@/path/to/image.jpg"
```

**Exemplo JavaScript/TypeScript:**
```typescript
const formData = new FormData();
formData.append('image', file); // file do input type="file"

const response = await fetch('http://localhost:10000/api/blog/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const { data } = await response.json();
console.log(data.url);   // URL pública da imagem
console.log(data.path);  // Caminho interno do storage
```

---

### 2. ➕ Criar Post

**Endpoint:** `POST /posts`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Campos do Payload:**

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|-------------|-----------|---------|
| `title` | string | ✅ Sim | Título do post | "Meu Primeiro Post" |
| `description` | string | ✅ Sim | Descrição curta | "Uma descrição interessante" |
| `content` | string | ❌ Não | Conteúdo completo (markdown ou HTML) | "# Título\n\nConteúdo..." |
| `slug` | string | ❌ Não | URL-friendly (auto-gerado se omitido) | "meu-primeiro-post" |
| `categoria_id` | UUID | ❌ Não | ID da categoria | "550e8400-e29b-41d4-a716-446655440000" |
| `category` | string | ❌ Não **NUNCA ENVIE** | Auto-preenchido pelo backend | - |
| `imageUrl` ou `image_url` | string (URI) | ❌ Não | URL pública da imagem (do upload) | "https://storage.../image.jpg" |
| `imagePath` ou `image_path` | string | ❌ Não | Caminho interno do storage (do upload) | "posts/123/image.jpg" |
| `imageFilename` ou `image_filename` | string | ❌ Não | Nome original do arquivo | "photo.jpg" |
| `imageSize` ou `image_size` | number | ❌ Não | Tamanho em bytes | 2048 |
| `imageMimeType` ou `image_mime_type` | string | ❌ Não | Tipo MIME | "image/jpeg" |
| `storageBucket` ou `storage_bucket` | string | ❌ Não | Nome do bucket | "blog-posts" |
| `readingTime` ou `reading_time` | string | ❌ Não | Tempo estimado de leitura | "5 min" |
| `type` | enum | ❌ Não | Tipo de conteúdo | "article", "video", "news" (padrão: "article") |
| `tags` | string[] | ❌ Não | Array de tags | ["typescript", "backend"] |
| `featured` | boolean | ❌ Não | Destacar no home | true, false |
| `status` | boolean | ❌ Não | Publicado (padrão: true) | true, false |
| `video1` ou `video_url1` | string (URI) | ❌ Não | URL do vídeo 1 | "https://youtube.com/..." |
| `video2` ou `video_url2` | string (URI) | ❌ Não | URL do vídeo 2 | "https://youtube.com/..." |
| `author` | string | ❌ Não | Nome do autor | "João Silva" |
| `authorImage` ou `author_image` | string (URI) | ❌ Não | URL da foto do autor | "https://.../avatar.jpg" |
| `publishedAt` ou `published_at` | ISO 8601 | ❌ Não | Data de publicação | "2026-08-15T10:30:00Z" |

**Regras Importantes:**

⚠️ **NÃO ENVIE:**
- `id` - Gerado automaticamente
- `created_at`, `updated_at` - Preenchidos pelo servidor
- `category` (string) - Será auto-preenchido a partir de `categoria_id`
- `image` (singular) - Campo não existe. Use `imageUrl`, `imagePath`, etc.

✅ **SEMPRE USE:**
- `categoria_id` em vez de `category` para referenciar uma categoria
- camelCase OU snake_case (será normalizado automaticamente)
- ISO 8601 para datas

**Validações:**
| Campo | Validação | Erro |
|-------|-----------|------|
| `title` | min 1 char | 400 - "title is required" |
| `description` | min 1 char | 400 - "description is required" |
| `categoria_id` | UUID válido ou null | 400 - "categoria_id must be a valid GUID" |
| `imageUrl` / `imagePath` / etc | URI válida ou null | 400 - "imageUrl must be a valid uri" |
| `status` | boolean | 400 - "status must be a boolean" |

**Resposta Sucesso (201):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "slug": "meu-primeiro-post",
    "title": "Meu Primeiro Post",
    "description": "Uma descrição interessante",
    "content": "# Título\n\nConteúdo...",
    "category": "Technology",
    "categoria_id": "550e8400-e29b-41d4-a716-446655440000",
    "image_url": "https://storage.../image.jpg",
    "image_path": "posts/123/image.jpg",
    "image_filename": "photo.jpg",
    "image_size": 2048,
    "image_mime_type": "image/jpeg",
    "storage_bucket": "blog-posts",
    "reading_time": "5 min",
    "type": "article",
    "tags": ["typescript", "backend"],
    "featured": false,
    "status": true,
    "video1": null,
    "video2": null,
    "author": "João Silva",
    "author_image": "https://.../avatar.jpg",
    "created_at": "2026-08-15T10:30:00Z",
    "updated_at": "2026-08-15T10:30:00Z",
    "published_at": "2026-08-15T10:30:00Z"
  }
}
```

**Resposta Erro (400):**
```json
{
  "success": false,
  "message": "Dados inválidos",
  "errors": [
    "title is required",
    "description is required"
  ]
}
```

**Exemplo cURL:**
```bash
curl -X POST http://localhost:10000/api/blog/posts \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Meu Primeiro Post",
    "description": "Uma descrição interessante",
    "content": "Conteúdo completo...",
    "categoriaId": "550e8400-e29b-41d4-a716-446655440000",
    "imageUrl": "https://storage.../image.jpg",
    "imagePath": "posts/123/image.jpg",
    "status": true
  }'
```

**Exemplo TypeScript:**
```typescript
const post = await fetch('http://localhost:10000/api/blog/posts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Meu Primeiro Post',
    description: 'Uma descrição interessante',
    content: 'Conteúdo completo...',
    categoriaId: '550e8400-e29b-41d4-a716-446655440000',
    imageUrl: 'https://storage.../image.jpg',
    imagePath: 'posts/123/image.jpg',
    status: true
  })
}).then(r => r.json());

console.log(post.data.id); // UUID do novo post
```

---

### 3. 📄 Listar Posts

**Endpoint:** `GET /posts`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token} (opcional, admin vê posts privados)
```

**Query Parameters:**

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | number | 1 | Número da página (começa em 1) |
| `limit` | number | 10 | Itens por página (máx: 100) |
| `category` | string | - | Filtrar por nome de categoria |
| `tag` | string | - | Filtrar por tag |
| `featured` | boolean | - | Apenas posts destacados (true/false) |
| `status` | boolean | - | Filtrar por status publicado (true/false) |

**Exemplos de URL:**
```
GET /posts?page=1&limit=10
GET /posts?page=2&limit=20&category=Technology
GET /posts?featured=true&status=true
GET /posts?tag=typescript&limit=5
```

**Resposta Sucesso (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "slug": "meu-primeiro-post",
      "title": "Meu Primeiro Post",
      "description": "Uma descrição interessante",
      "content": "Conteúdo...",
      "category": "Technology",
      "categoria_id": "550e8400-e29b-41d4-a716-446655440000",
      "image_url": "https://storage.../image.jpg",
      "status": true,
      "created_at": "2026-08-15T10:30:00Z",
      "updated_at": "2026-08-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

**Exemplo cURL:**
```bash
curl "http://localhost:10000/api/blog/posts?page=1&limit=10&status=true"
```

**Exemplo TypeScript:**
```typescript
const response = await fetch(
  'http://localhost:10000/api/blog/posts?page=1&limit=10&status=true'
);
const { data, pagination } = await response.json();
console.log(`Total de posts: ${pagination.total}`);
data.forEach(post => console.log(post.title));
```

---

### 4. 🔗 Buscar Post por Slug

**Endpoint:** `GET /posts/slug/:slug`

**Headers:**
```
Content-Type: application/json
```

**Parâmetros de Rota:**
- `slug` (string) - Slug do post (ex: "meu-primeiro-post")

**Resposta Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "slug": "meu-primeiro-post",
    "title": "Meu Primeiro Post",
    "description": "Uma descrição interessante",
    "content": "Conteúdo completo...",
    "category": "Technology",
    "categoria_id": "550e8400-e29b-41d4-a716-446655440000",
    "image_url": "https://storage.../image.jpg",
    "status": true,
    "created_at": "2026-08-15T10:30:00Z",
    "updated_at": "2026-08-15T10:30:00Z"
  }
}
```

**Resposta Erro (404):**
```json
{
  "success": false,
  "message": "Post com slug 'slug-invalido' não encontrado"
}
```

**Exemplo cURL:**
```bash
curl "http://localhost:10000/api/blog/posts/slug/meu-primeiro-post"
```

**Exemplo TypeScript:**
```typescript
const post = await fetch(
  'http://localhost:10000/api/blog/posts/slug/meu-primeiro-post'
).then(r => r.json());

console.log(post.data.title);
```

---

### 5. 🆔 Buscar Post por ID

**Endpoint:** `GET /posts/id/:id`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Parâmetros de Rota:**
- `id` (UUID) - ID único do post

**Validações:**
- Requer autenticação e role admin
- ID deve ser UUID válido

**Resposta Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "slug": "meu-primeiro-post",
    "title": "Meu Primeiro Post",
    ...
  }
}
```

**Resposta Erro (400):**
```json
{
  "success": false,
  "message": "ID inválido: deve ser um UUID válido"
}
```

**Resposta Erro (401/403):**
```json
{
  "success": false,
  "message": "Acesso negado"
}
```

**Exemplo cURL:**
```bash
curl -X GET http://localhost:10000/api/blog/posts/id/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

### 6. ✏️ Atualizar Post

**Endpoint:** `PUT /posts/:id`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Parâmetros de Rota:**
- `id` (UUID) - ID do post a atualizar

**Payload:**
- Todos os campos são **opcionais**
- Envie apenas os campos que quer atualizar
- Mínimo de 1 campo obrigatório

**Validações:**
- Requer autenticação e role admin
- ID deve ser UUID válido
- Pelo menos 1 campo deve ser enviado

**Campos Aceitos:** Mesmos de CREATE (veja tabela acima)

**Resposta Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "slug": "meu-primeiro-post",
    "title": "Título Atualizado",
    ...
  }
}
```

**Resposta Erro (400):**
```json
{
  "success": false,
  "message": "Envie ao menos um campo para atualizar"
}
```

**Exemplo cURL:**
```bash
curl -X PUT http://localhost:10000/api/blog/posts/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Título Atualizado",
    "imageUrl": "https://storage.../new-image.jpg"
  }'
```

**Exemplo TypeScript:**
```typescript
const updated = await fetch(
  'http://localhost:10000/api/blog/posts/550e8400-e29b-41d4-a716-446655440001',
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Título Atualizado',
      status: false // Despublicar
    })
  }
).then(r => r.json());

console.log(updated.data.title);
```

---

### 7. 🗑️ Deletar Post

**Endpoint:** `DELETE /posts/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Parâmetros de Rota:**
- `id` (UUID) - ID do post a deletar

**Validações:**
- Requer autenticação e role admin
- ID deve ser UUID válido

**Resposta Sucesso (204):**
```
(sem corpo)
```

**Resposta Erro (401/403):**
```json
{
  "success": false,
  "message": "Acesso negado"
}
```

**Exemplo cURL:**
```bash
curl -X DELETE http://localhost:10000/api/blog/posts/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Exemplo TypeScript:**
```typescript
await fetch(
  'http://localhost:10000/api/blog/posts/550e8400-e29b-41d4-a716-446655440001',
  {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

console.log('Post deletado com sucesso!');
```

---

### 8. 📂 Listar Categorias

**Endpoint:** `GET /categorias`

**Headers:**
```
Content-Type: application/json
```

**Parâmetros:** Nenhum

**Resposta Sucesso (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nome": "Technology",
      "descricao": "Posts sobre tecnologia"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "nome": "Business",
      "descricao": "Posts sobre negócios"
    }
  ]
}
```

**Exemplo TypeScript:**
```typescript
const categories = await fetch(
  'http://localhost:10000/api/blog/categorias'
).then(r => r.json());

console.log(categories.data); // Array de categorias
```

---

## 🔄 Fluxo Completo: Upload + Criação de Post

Aqui está o fluxo recomendado para criar um post com imagem:

### Passo 1: Upload da Imagem

```typescript
const file = document.querySelector('input[type="file"]').files[0];
const formData = new FormData();
formData.append('image', file);

const uploadRes = await fetch('http://localhost:10000/api/blog/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`
  },
  body: formData
});

const uploadData = await uploadRes.json();
const { url, path } = uploadData.data;

console.log('✅ Imagem enviada!');
console.log('URL pública:', url);
console.log('Caminho interno:', path);
```

### Passo 2: Criar Post com Dados da Imagem

```typescript
const postPayload = {
  title: 'Meu Post com Imagem',
  description: 'Uma descrição',
  content: 'Conteúdo...',
  categoriaId: '550e8400-e29b-41d4-a716-446655440000', // UUID da categoria
  imageUrl: url,  // ← Retornado do upload
  imagePath: path, // ← Retornado do upload
  status: true
};

const createRes = await fetch('http://localhost:10000/api/blog/posts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(postPayload)
});

const newPost = await createRes.json();
console.log('✅ Post criado com ID:', newPost.data.id);
```

### Passo 3: Verificar Resultado

```typescript
// Campo `category` foi auto-preenchido pelo backend
console.log('Categoria auto-preenchida:', newPost.data.category);
// Resultado: "Technology"
```

---

## 🚨 Tratamento de Erros Comuns

### Erro 400 - Bad Request

**Causas Comuns:**
- Campo obrigatório faltando (title, description)
- UUID inválido em `categoria_id`
- URL inválida em `imageUrl`
- Nenhum arquivo no upload (campo "image")
- Arquivo vazio

**Solução:**
1. Verifique a mensagem de erro retornada
2. Valide os dados antes de enviar
3. Garanta que `categoria_id` é um UUID válido (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

```typescript
// Validação de UUID
const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

if (!isValidUUID(categoriaId)) {
  console.error('categoria_id inválido');
}
```

### Erro 401 - Unauthorized

**Causas:**
- Token faltando no header `Authorization`
- Token expirado
- Token inválido

**Solução:**
```typescript
const headers = {
  'Authorization': `Bearer ${token}`, // Inclua o "Bearer " prefix
  'Content-Type': 'application/json'
};
```

### Erro 403 - Forbidden

**Causas:**
- Usuário não é admin (role)
- Tentando acessar recurso privado sem permissão

**Solução:**
- Verifique se o usuário tem role "admin" no banco de dados
- Operações de escrita exigem admin

### Erro 413 - Payload Too Large

**Causas:**
- Arquivo de imagem > 5 MB

**Solução:**
```typescript
const file = document.querySelector('input[type="file"]').files[0];
if (file.size > 5 * 1024 * 1024) {
  alert('Arquivo muito grande! Máximo: 5 MB');
  return;
}
```

### Erro 415 - Unsupported Media Type

**Causas:**
- Formato de imagem não permitido (não é JPEG, PNG ou WEBP)

**Solução:**
```typescript
const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
if (!allowedMimes.includes(file.type)) {
  alert('Formato não permitido. Use JPEG, PNG ou WEBP');
  return;
}
```

### Erro 500 - Internal Server Error

**Causas:**
- Erro no servidor
- Falha ao conectar com o storage (Supabase)
- Erro na query ao banco de dados

**Solução:**
- Verifique os logs do servidor
- Garanta que o Supabase está conectado
- Verifique se a tabela `blog_posts` existe e tem as colunas corretas

---

## ✅ Checklist de Integração

- [ ] Obter token de autenticação (`/api/auth/login`)
- [ ] Implementar seleção de arquivo (input type="file")
- [ ] Upload de imagem para `/upload` (ou `/posts/upload` se não corrigido)
- [ ] Capturar `url` e `path` da resposta de upload
- [ ] Buscar lista de categorias em `/categorias`
- [ ] Implementar validação de campos antes de enviar
- [ ] Criar POST com payload correto
- [ ] Testar listagem de posts
- [ ] Testar busca por slug (público)
- [ ] Testar atualização de post (admin)
- [ ] Testar deleção de post (admin)
- [ ] Implementar tratamento de erros para cada endpoint
- [ ] Validar que `category` é auto-preenchido (não enviar)
- [ ] Confirmar que `image` (singular) não existe (usar `imageUrl`, etc.)

---

## 📝 Resumo das Regras de Ouro

### ✅ FAÇA ISSO:

```typescript
// 1. Sempre inclua o token nos headers de escrita
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}

// 2. Use categoriaId (UUID) em vez de category
{
  "title": "Post",
  "categoriaId": "550e8400-e29b-41d4-a716-446655440000"
}

// 3. Envie imageUrl e imagePath do upload
{
  "title": "Post",
  "imageUrl": "https://...",
  "imagePath": "posts/123/file.jpg"
}

// 4. Valide UUIDs antes de enviar
if (!isValidUUID(id)) throw Error('UUID inválido');

// 5. Trate os erros corretamente
if (!response.ok) {
  const error = await response.json();
  console.error(error.message);
}
```

### ❌ NÃO FAÇA ISSO:

```typescript
// 1. Não envie category (string)
// ❌ ERRADO
{ "category": "Technology" }
// ✅ CERTO
{ "categoriaId": "550e..." }

// 2. Não use image (singular)
// ❌ ERRADO
{ "image": "https://..." }
// ✅ CERTO
{ "imageUrl": "https://...", "imagePath": "..." }

// 3. Não omita o "Bearer " no token
// ❌ ERRADO
{ "Authorization": "eyJhbGciOi..." }
// ✅ CERTO
{ "Authorization": "Bearer eyJhbGciOi..." }

// 4. Não envie campos gerados automaticamente
// ❌ ERRADO
{ "id": "550e...", "created_at": "2026-08-15T..." }
// ✅ CERTO
{ "title": "Post", "description": "..." }

// 5. Não confunda /api/blog/posts/upload com /api/blog/upload
// ❌ ERRADO (rota atual - será corrigida)
POST /api/blog/posts/upload
// ✅ CERTO (após correção)
POST /api/blog/upload
```

---

## 🔧 Ambientes

### Desenvolvimento
```
Base URL: http://localhost:10000/api/blog
```

### Produção
```
Base URL: https://api.producao.com/api/blog
```

Substituir `localhost:10000` conforme o ambiente.

---

## 📞 Suporte

Para dúvidas ou problemas na integração:

1. Verifique a mensagem de erro retornada
2. Consulte a seção "Tratamento de Erros Comuns"
3. Revise o checklist de integração
4. Verifique os logs do servidor backend

---

## 📅 Histórico de Versões

| Versão | Data | Alterações |
|--------|------|-----------|
| 1.0 | 2026-08-15 | Versão inicial – Documentação completa |

---

**Última atualização:** 2026-08-15  
**Status:** ✅ Pronto para Produção  
**Responsável:** Backend Team
