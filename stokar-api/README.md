# Stokar API

Back-end do **Stokar**, sistema de gestão para oficinas: estoque de peças, serviços para clientes e empresas com contrato,
notas de serviço em PDF, chat com clientes e notificações. É a API consumida pelo site
([`stokar-web`](../stokar-web)) e pelo aplicativo ([`stokar-app`](../stokar-app)).

> **Documentação interativa (Swagger):** com a API rodando, abra **`/api/docs`** (ex.: http://localhost:3000/api/docs).
> O documento OpenAPI 3 fica em `/api/docs.json`. Versão atual: **1.1.1** (veja o [CHANGELOG](./CHANGELOG.md)).

## Finalidade

Concentrar as regras de negócio e os dados do Stokar em um só lugar:

- **Estoque:** produtos, categorias, fornecedores, entradas, saídas, ajustes e alerta de estoque mínimo.
- **Oficina:** clientes (pessoa física ou empresa), veículos, catálogo de serviços com valores, contratos com preços
  negociados ou desconto, solicitações de serviço (aprovar, iniciar, concluir) e notas de serviço em PDF.
- **Atendimento:** chat entre clientes e oficina e notificações (no sistema, por e-mail e por webhook).
- **Acesso:** login com JWT e permissões por perfil (ADMIN, MANAGER, OPERATOR, REQUESTER e CLIENT).

**Stack:** Node.js 20+ · Express 5 · TypeScript · TypeORM · PostgreSQL · Zod · pdfkit.
Roda como servidor Node comum ou como função serverless na **Vercel** (`api/index.ts`).

## Requisitos

- Node.js 20 ou superior e npm
- PostgreSQL 14+ — ou Docker, para subir o banco com o `docker-compose.yml` do projeto

## 1. Como executar

```bash
npm install
cp .env.example .env          # ajuste DATABASE_URL e os segredos JWT
docker compose up -d          # opcional: sobe um Postgres local (porta 5432, banco "estoque")
npm run dev                   # http://localhost:3000/api
```

Confira em http://localhost:3000/api/health e explore as rotas em http://localhost:3000/api/docs.

As tabelas são criadas automaticamente na primeira execução (`DB_MIGRATIONS_RUN=true`).
Se preferir rodar manualmente: `npm run migration:run`.

**Primeiro acesso:** o primeiro usuário cadastrado em `POST /api/auth/register` vira `ADMIN`.
Como alternativa, `npm run seed` cria o administrador a partir das variáveis `SEED_ADMIN_*`
(com `SEED_SAMPLE_CATALOG=true`, cria também um catálogo de serviços de exemplo).

Gere os segredos JWT com:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Para produção: `npm run build` e `npm start` (servidor Node), o deploy no Render ou o deploy na Vercel descritos abaixo.

## 2. Deploy no Render

O repositório tem um **Blueprint** (`render.yaml`, na raiz) que já configura o serviço.

1. Crie o banco: no Render, **New → Postgres** (ou use Neon/Supabase). Copie a connection string.
2. **New → Blueprint**, escolha o repositório e confirme. O Render pede os valores marcados no `render.yaml`:

   | Variável | Valor |
   |---|---|
   | `DATABASE_URL` | Postgres do Render: a **Internal Database URL**. Outro provedor: a URL dele |
   | `DB_SSL` | `false` com a Internal URL do Render; `true` com banco externo (Neon, Supabase) |
   | `CORS_ORIGIN` | domínio(s) do site, separados por vírgula (ex.: `https://stokar.vercel.app`) |

   `JWT_SECRET` e `JWT_REFRESH_SECRET` são gerados automaticamente. Para SMTP, webhook ou `ALLOW_*`,
   adicione as variáveis depois em **Environment** (lista completa no `.env.example`).
3. Aguarde o deploy e teste `https://SEU-SERVICO.onrender.com/api/health` e `/api/docs`.
4. Crie o administrador: cadastre-se pelo site (o primeiro usuário vira `ADMIN`) ou, no **Shell** do serviço,
   rode `SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run seed:prod`.
   Depois disso, considere `ALLOW_PUBLIC_REGISTRATION=false` para ninguém mais se cadastrar como equipe pelo site.

Sem o Blueprint, crie um **Web Service** com:

| Campo | Valor |
|---|---|
| Root Directory | `stokar-api` |
| Build Command | `npm ci --include=dev && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

**Migrations:** com `DB_MIGRATIONS_RUN=true` (padrão), a API aplica as pendentes ao iniciar. Para controlar isso no deploy,
use `DB_MIGRATIONS_RUN=false` e `npm run migration:run:prod` como *Pre-Deploy Command* (planos pagos).
Para desfazer a última: `npm run migration:revert:prod` (no Shell).

**Plano gratuito:** o serviço "dorme" depois de ~15 minutos sem acesso; a primeira requisição seguinte leva de 30 a 60 s.
A versão do Node vem do `.node-version` (22). O `PORT` é definido pelo Render — não configure.

## 3. Deploy na Vercel

1. Crie um banco PostgreSQL (Neon, Supabase, Vercel Postgres/Marketplace etc.) e copie a connection string.
   Em ambiente serverless prefira a URL **com pooling** (ex.: a URL "pooled" do Neon ou a porta 6543 do Supabase).
2. Suba o projeto para um repositório Git e importe na Vercel (ou rode `npx vercel`). Não é preciso configurar build.
3. Em **Settings → Environment Variables**, defina:

   | Variável | Valor |
   |---|---|
   | `DATABASE_URL` | connection string do Postgres |
   | `DB_SSL` | `true` |
   | `DB_MIGRATIONS_RUN` | `true` (cria/atualiza as tabelas no primeiro acesso) |
   | `JWT_SECRET` / `JWT_REFRESH_SECRET` | dois segredos longos e diferentes |
   | `NODE_ENV` | `production` |
   | `CORS_ORIGIN` | domínio(s) do seu front-end, separados por vírgula |

4. Faça o deploy e teste `https://SEU-PROJETO.vercel.app/api/health`.

O `vercel.json` redireciona todas as rotas para a função `api/index.ts`, que exporta o app Express.

## 4. Perfis de acesso

| Perfil | O que pode fazer |
|---|---|
| `ADMIN` | Tudo, inclusive gerenciar usuários |
| `MANAGER` | Cadastros (produtos, categorias, fornecedores), ajustes de inventário, aprovar/rejeitar/atribuir solicitações |
| `OPERATOR` | Lançar entradas e saídas, iniciar e concluir solicitações |
| `REQUESTER` | Consultar produtos, abrir e acompanhar **as próprias** solicitações |
| `CLIENT` | Cliente da oficina, pelo aplicativo: pede serviços, cadastra veículos, acompanha o andamento, baixa as notas e conversa com a oficina. Não acessa estoque nem cadastros internos |

## 5. Autenticação

Envie o access token em todas as rotas protegidas:

```
Authorization: Bearer <accessToken>
```

- O access token expira em 15 min (`JWT_EXPIRES_IN`); use `POST /api/auth/refresh` com o `refreshToken` (7 dias) para renovar.
- Logout, troca de senha, mudança de perfil ou desativação **invalidam imediatamente** todos os tokens do usuário.

## 6. Endpoints

Base: `/api`. Listagens aceitam `page` e `limit` (máx. 100) e devolvem `{ items, meta }`.
Erros seguem o formato `{ "error": { "status", "message", "details?" } }`.

### Autenticação — `/auth`

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` | Cadastro `{ name, email, password }` (1º usuário = ADMIN) |
| POST | `/auth/login` | Login `{ email, password }` → tokens |
| POST | `/auth/refresh` | `{ refreshToken }` → novo par de tokens |
| POST | `/auth/logout` | Encerra todas as sessões do usuário |
| GET | `/auth/me` | Dados do usuário autenticado |
| PATCH | `/auth/me` | Atualiza `{ name?, emailNotifications? }` |
| POST | `/auth/change-password` | `{ currentPassword, newPassword }` |

### Usuários — `/users`

| Método | Rota | Perfil | Descrição |
|---|---|---|---|
| GET | `/users` · `/users/:id` | ADMIN, MANAGER | Lista (`search`, `role`, `active`) / detalhe |
| POST | `/users` | ADMIN | Cria `{ name, email, password, role }` |
| PATCH | `/users/:id` | ADMIN | Altera `{ name?, role?, active?, password? }` |
| DELETE | `/users/:id` | ADMIN | Desativa o usuário |

### Cadastros — `/categories`, `/suppliers`, `/products`

| Método | Rota | Perfil | Descrição |
|---|---|---|---|
| GET | `/categories` · `/categories/:id` | todos | Lista / detalhe |
| POST · PATCH · DELETE | `/categories[/:id]` | ADMIN, MANAGER | `{ name, description? }` |
| GET | `/suppliers` · `/suppliers/:id` | ADMIN, MANAGER, OPERATOR | Lista (`search`, `active`) / detalhe |
| POST · PATCH · DELETE | `/suppliers[/:id]` | ADMIN, MANAGER | `{ name, document?, email?, phone? }` |
| GET | `/products` · `/products/:id` | todos | Filtros: `search`, `categoryId`, `active`, `lowStock=true` |
| POST · PATCH · DELETE | `/products[/:id]` | ADMIN, MANAGER | `{ sku, name, description?, unit?, minQuantity?, costPrice?, location?, categoryId? }` |

O saldo (`quantity`) de um produto **nunca** é editado diretamente: ele só muda por movimentações.

### Estoque — `/stock` (ADMIN, MANAGER, OPERATOR)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/stock/entries` | **Entrada** `{ productId, quantity, unitCost?, supplierId?, document?, reason? }` — recalcula o custo médio |
| POST | `/stock/exits` | **Saída** `{ productId, quantity, document?, reason? }` — retorna 409 se não houver saldo |
| POST | `/stock/adjustments` | **Ajuste de inventário** `{ productId, newQuantity, reason }` (ADMIN, MANAGER) |
| GET | `/stock/movements` | Histórico. Filtros: `productId`, `type`, `userId`, `serviceRequestId`, `from`, `to` |
| GET | `/stock/movements/:id` | Detalhe |

Cada movimentação guarda saldo anterior e posterior, é imutável e roda em transação com trava de linha
(`SELECT ... FOR UPDATE`), então saídas simultâneas não deixam o saldo negativo.

### Oficina: clientes, veículos, catálogo e contratos

| Rota | Quem | O que é |
|---|---|---|
| `/customers` | equipe | Clientes (pessoa física ou empresa). `GET /customers/:id` traz veículos, contratos e acessos ao aplicativo |
| `POST /customers/:id/users` | ADMIN, MANAGER | Cria um acesso ao aplicativo (perfil `CLIENT`) para o cliente |
| `/customers/me` | CLIENT | O cliente consulta e atualiza o próprio cadastro |
| `/vehicles` | equipe e CLIENT | Veículos/equipamentos; o cliente só enxerga os dele |
| `/service-types` | leitura: todos · escrita: ADMIN, MANAGER | Tipos de serviço (ex.: Pneus, Funilaria e pintura) |
| `/services` | leitura: todos · escrita: ADMIN, MANAGER | Serviços com valor (ex.: Trocar pneu). `?contractId=` devolve também `contractPrice` |
| `/contracts` | leitura: equipe e CLIENT · escrita: ADMIN, MANAGER | Contratos com empresas: vigência, mensalidade, desconto (%) e tabela de preços negociados |

**Preço de um serviço em um contrato:** o valor negociado na tabela do contrato; se o serviço não estiver na tabela,
o valor do catálogo com o desconto percentual do contrato.

### Solicitações de serviço — `/service-requests`

Fluxo: `OPEN → APPROVED → IN_PROGRESS → COMPLETED` (ou `REJECTED` / `CANCELLED`).

| Método | Rota | Perfil | Descrição |
|---|---|---|---|
| POST | `/service-requests` | todos | `{ title, description, priority?, dueDate?, customerId?, contractId?, vehicleId?, services?, items?, discount?, origin? }` |
| GET | `/service-requests` | todos | Filtros: `status`, `priority`, `requesterId`, `assigneeId`, `customerId`, `vehicleId`, `contractId`, `search` |
| GET | `/service-requests/:id` | dono ou equipe | Detalhe com serviços, peças, totais e a nota emitida |
| PATCH | `/service-requests/:id` | dono (enquanto `OPEN`) ou equipe (até concluir) | `services` e `items` substituem as listas |
| POST | `/service-requests/:id/approve` | ADMIN, MANAGER | `{ assigneeId? }` |
| POST | `/service-requests/:id/reject` | ADMIN, MANAGER | `{ reason }` |
| POST | `/service-requests/:id/assign` | ADMIN, MANAGER | `{ assigneeId }` |
| POST | `/service-requests/:id/start` | equipe | Inicia o atendimento |
| POST | `/service-requests/:id/complete` | equipe | `{ resolutionNotes? }` — **dá baixa no estoque dos itens** |
| POST | `/service-requests/:id/cancel` | dono ou gestor | `{ reason? }` — enquanto `OPEN` ou `APPROVED` |

- `services`: `[{ serviceId?, description?, quantity?, unitPrice? }]` — mão de obra. O valor vem do catálogo ou do contrato;
  só a equipe informa `unitPrice` ou lança um serviço avulso (sem `serviceId`).
- `items`: `[{ productId, quantity, unitPrice? }]` — peças do estoque (somente equipe). Sem `unitPrice`, usa o preço de venda do produto.
- O **cliente** (perfil `CLIENT`) abre a solicitação sempre para o próprio cadastro; a **equipe** registra para qualquer cliente
  (é assim que o dono lança um serviço pelo aplicativo quando está longe do site).

Ao concluir, as saídas de todos os itens são lançadas em uma única transação e ficam vinculadas à solicitação.
Se faltar saldo de qualquer item, nada é baixado e a API responde 409.

### Notas de serviço — `/invoices`

| Método | Rota | Perfil | Descrição |
|---|---|---|---|
| POST | `/invoices` | equipe | `{ serviceRequestId, notes? }` — emite a nota de uma solicitação **concluída** |
| GET | `/invoices` | equipe e CLIENT | Filtros: `status`, `customerId`, `serviceRequestId`, `from`, `to`, `search` |
| GET | `/invoices/:id` | equipe e CLIENT | Detalhe |
| GET | `/invoices/:id/pdf` | equipe e CLIENT | A nota em PDF |
| POST | `/invoices/:id/cancel` | ADMIN, MANAGER | `{ reason }` — depois disso a solicitação pode receber outra nota |

A nota é um **documento não fiscal** (não substitui a NFS-e). Ela guarda uma cópia dos dados da oficina, do cliente,
dos serviços, das peças e dos valores no momento da emissão. Os dados da oficina vêm de `PUT /settings/company`.

### Chat — `/chat`

Cada usuário de fora da equipe tem uma conversa com a oficina; qualquer pessoa da equipe responde.
Não há WebSocket (a API roda em serverless): o site e o aplicativo consultam `GET /chat/conversations/:id/messages?after=<ISO>`
em intervalos curtos. Veja todas as rotas em `/api/docs`.

### Notificações — `/notifications`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/notifications` | Lista do usuário (`unread=true`) + `unreadCount` |
| GET | `/notifications/unread-count` | Contador (leve, para polling do "sininho") |
| PATCH | `/notifications/:id/read` | Marca como lida |
| PATCH | `/notifications/read-all` | Marca todas como lidas |
| DELETE | `/notifications/:id` | Remove |

### Relatórios

| Método | Rota | Perfil | Descrição |
|---|---|---|---|
| GET | `/reports/summary` | equipe | Totais de estoque, solicitações por status e movimentações dos últimos 30 dias |
| GET | `/health` | público | Verifica API e banco |

## 7. Sistema de notificações

Toda notificação é gravada no banco para o destinatário (canal "in-app") e, se configurado, também enviada por:

- **E-mail (SMTP):** preencha `SMTP_HOST` e afins. Cada usuário pode desligar em `PATCH /auth/me` (`emailNotifications: false`).
- **Webhook:** preencha `NOTIFICATION_WEBHOOK_URL` para receber um POST JSON por evento (Slack, Discord, n8n...).

| Evento | Quem recebe |
|---|---|
| `LOW_STOCK` — saldo atingiu o estoque mínimo | ADMIN, MANAGER, OPERATOR |
| `OUT_OF_STOCK` — saldo zerou | ADMIN, MANAGER, OPERATOR |
| `REQUEST_CREATED` | ADMIN, MANAGER |
| `REQUEST_APPROVED` / `REJECTED` / `STARTED` / `COMPLETED` / `CANCELLED` | Solicitante e responsável |
| `REQUEST_ASSIGNED` | Novo responsável |

O alerta de estoque baixo só dispara quando o saldo **cruza** o mínimo, para não repetir a cada saída.
Falhas em e-mail/webhook são registradas no log e não interrompem a operação.

## 8. Estrutura

```
api/index.ts                 Entrada serverless (Vercel)
src/app.ts                   App Express (middlewares e rotas)
src/server.ts                Servidor local
src/config/env.ts            Validação das variáveis de ambiente
src/database/                DataSource, migrations e seed
src/entities/                Entidades TypeORM
src/middlewares/             Autenticação JWT, autorização e erros
src/docs/                    Swagger UI e documento OpenAPI (atualize ao mudar rotas)
src/modules/                 Rotas por domínio
src/services/                Regras de estoque, preços, notas em PDF e notificações
requests.http                Exemplos de chamadas (extensão REST Client)
```

## 9. Alterando o banco

1. Edite/crie a entidade em `src/entities` (e registre em `src/entities/index.ts`).
2. `npm run migration:generate -- src/database/migrations/NomeDaMudanca`
3. Registre a classe gerada em `src/database/migrations/index.ts`.

As listas de entidades e migrations são explícitas (sem glob) de propósito: é o que garante o funcionamento no bundle da Vercel.

## 10. Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor local com reload |
| `npm run typecheck` | Checagem de tipos |
| `npm run build` (ou `compile`) + `npm start` | Build em `dist/` e execução (Render ou qualquer servidor Node) |
| `npm run migration:run` / `migration:revert` / `migration:generate` | Migrations em desenvolvimento (via ts-node) |
| `npm run migration:run:prod` / `migration:revert:prod` | Migrations em produção, a partir do `dist` (rode depois do build) |
| `npm run seed` | Cria o administrador (com `SEED_SAMPLE_CATALOG=true`, também um catálogo de serviços de exemplo) |
| `npm run seed:prod` | O mesmo seed, a partir do `dist` (produção) |
