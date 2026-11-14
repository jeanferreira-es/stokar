# Changelog — stokar-api

Segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/): `MAIOR.MENOR.CORREÇÃO`.
A versão fica em `package.json` e em `src/config/version.ts` (exibida em `/` e no Swagger).

## 1.1.1 — 2026-11-13

### Alterado
- `POST /chat/conversations/:id/read` também marca como lidas as notificações de "nova mensagem" daquela conversa.

## 1.1.0 — 2026-11-12

### Adicionado
- **Oficina:** clientes (pessoa física e empresa), veículos/equipamentos, tipos de serviço, catálogo de serviços com valores
  e contratos com tabela de preços negociados e desconto percentual.
- **Solicitações de serviço** agora aceitam cliente, contrato, veículo, serviços (mão de obra) com valor, valor das peças e desconto;
  a resposta traz os totais.
- **Notas de serviço** (documento não fiscal) com numeração própria e PDF: `POST /invoices`, `GET /invoices/:id/pdf`.
- **Perfil `CLIENT`** para o aplicativo: cadastro próprio (`POST /auth/register-client`), `GET/PATCH /customers/me`
  e exclusão de conta (`DELETE /auth/me`).
- **Chat** entre clientes e a equipe (`/chat`).
- **Dados da oficina** (`/settings/company`), usados no cabeçalho das notas.
- **Swagger UI** em `/api/docs` e OpenAPI em `/api/docs.json`.
- Produto: `salePrice` (preço de venda sugerido). Usuário: `phone` e `customerId`.
- Variáveis `ALLOW_CLIENT_REGISTRATION`, `APP_TIMEZONE` e `SEED_SAMPLE_CATALOG`.

### Alterado
- A equipe pode editar a solicitação até a conclusão (antes, só enquanto aberta), para lançar serviços e peças durante o atendimento.
- Estoque, cadastros internos e relatórios não são acessíveis ao perfil `CLIENT`.

### Banco de dados
- Migration `WorkshopModule1794541594276` (aplicada automaticamente com `DB_MIGRATIONS_RUN=true`).

## 1.0.0

- Estoque, solicitações de serviço e notificações.
