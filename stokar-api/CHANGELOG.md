# Changelog — stokar-api

Segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/): `MAIOR.MENOR.CORREÇÃO`.
A versão fica em `package.json` e em `src/config/version.ts` (exibida em `/` e no Swagger).

## 1.2.0 — 2026-11-14

### Adicionado
- Pagamento das solicitações: `payment` na resposta (`PAID`, `PENDING`, `NONE`), `POST/DELETE /service-requests/:id/payment`,
  filtro `payment` na lista e notificação `PAYMENT_CONFIRMED` para o cliente.
- `GET /service-requests/payments/pending`: o que falta pagar, com a chave PIX da oficina e o "PIX copia e cola"
  (BR Code com valor) de cada serviço.
- Configurações da oficina: chave PIX (tipo e chave, validada), cidade, instruções de pagamento e a regra opcional
  `requirePaymentToComplete` (só conclui depois do pagamento; desligada por padrão).
- Nota em PDF com a situação do pagamento.
- Sessão longa do aplicativo: login com `client: "app"` (e cadastro pelo app) emite refresh token de 180 dias
  (`JWT_APP_REFRESH_EXPIRES_IN`), renovado a cada uso.
- Migration `Payments1794700000000`.

## 1.1.2 — 2026-11-13

### Adicionado
- Deploy no Render: `render.yaml` (Blueprint) na raiz do repositório, `.node-version` e seção no README.
- Scripts de produção: `build`, `migration:run:prod`, `migration:revert:prod` e `seed:prod` (rodam a partir do `dist`, sem ts-node).

### Corrigido
- `migration:revert` da migration da oficina falhava ao voltar o tipo `user_role` (default da coluna e perfis `CLIENT`).

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
