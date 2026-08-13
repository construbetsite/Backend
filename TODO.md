# TODO - Módulo de Provas e Simulados (Back-end)

- [ ] Criar SQL `SQL_provas_simulados.sql` com tabelas: provas, questoes, tentativas, respostas + índices + triggers + RLS + tabela `administradores`.
- [ ] Criar middleware `isAdmin` consultando `public.administradores` com `req.user.id`.
- [ ] Implementar routes/controller/service de Admin (CRUD):
  - [ ] POST /api/provas
  - [ ] GET /api/provas/:id
  - [ ] PUT /api/provas/:id
  - [ ] DELETE /api/provas/:id
  - [ ] POST /api/provas/:id/questoes
  - [ ] PUT /api/questoes/:id
  - [ ] DELETE /api/questoes/:id
- [ ] Implementar routes/controller/service de Clientes:
  - [ ] GET /api/provas/disponiveis (listar ativas + status/progresso do usuário)
  - [ ] POST /api/tentativas (iniciar tentativa)
  - [ ] GET /api/tentativas/:id (detalhar tentativa + respostas salvas)
  - [ ] PUT /api/tentativas/:id (salvar resposta(s))
  - [ ] POST /api/tentativas/:id/finalizar (calcular pontuação + porcentagem)
  - [ ] GET /api/tentativas (histórico resumido)
  - [ ] GET /api/tentativas/:id/resultado (resultado detalhado acertos/erros)
- [ ] Integrar rotas no `src/index.ts`.
- [ ] Garantir consistência de erros: `{ success: false, message }` com códigos HTTP.
- [ ] Rodar `npm run build`.
- [ ] Testar endpoints via Postman (cenários admin + cliente).

