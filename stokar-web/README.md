# Stokar Web

Site do **Stokar**, sistema de gestão para oficinas. É o painel usado pela equipe no computador (e também no celular,
pelo navegador), consumindo a [`stokar-api`](../stokar-api).

## Finalidade

Dar à equipe da oficina uma visão completa da operação:

- **Painel** com indicadores de estoque, solicitações e movimentações.
- **Estoque:** produtos, categorias, fornecedores, entradas, saídas e ajustes.
- **Oficina:** clientes, veículos, catálogo de serviços e valores, contratos com empresas, solicitações de serviço
  e emissão de notas de serviço em PDF.
- **Atendimento:** responder as mensagens que os clientes mandam pelo aplicativo.
- **Notificações** e gestão de usuários e perfis.

Clientes da oficina usam o aplicativo ([`stokar-app`](../stokar-app)); no site eles veem apenas um aviso.

- **Stack:** React 19 · TypeScript · Vite · styled-components · React Router · TanStack Query · react-hook-form · Radix UI · lucide-react
- **Temas:** claro e escuro (segue o sistema no primeiro acesso; a escolha fica salva)
- **Responsivo:** desktop (menu lateral com rótulos), tablet (menu só com ícones) e celular (barra inferior, tabelas viram cartões, diálogos viram folha inferior)

## Requisitos

- Node.js 20 ou superior e npm
- A [`stokar-api`](../stokar-api) rodando (local ou publicada)

## Como executar

```bash
cp .env.example .env      # aponte VITE_API_URL para a stokar-api (ex.: http://localhost:3000/api)
npm install
npm run dev               # http://localhost:5173
```

A API precisa aceitar a origem do front: deixe `CORS_ORIGIN=*` em desenvolvimento ou informe `http://localhost:5173`.
O primeiro usuário criado em **Criar conta** vira `ADMIN`.

| Script | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run typecheck` | checagem de tipos |
| `npm run build` | checagem de tipos + build de produção em `dist/` |
| `npm run preview` | serve o build |

Para publicar, rode `npm run build` e hospede a pasta `dist/` (Vercel, Netlify ou qualquer servidor estático),
com `VITE_API_URL` apontando para a API publicada.

## Arquitetura (MVC adaptado ao React)

```
src/
  models/                  M — dados e regras de acesso a eles
    types.ts               tipos que espelham as respostas da API
    labels.ts              rótulos e cores de status, prioridade, perfil...
    permissions.ts         grupos de perfis (iguais aos da API)
    services/
      tokenStorage.ts      guarda dos tokens JWT
      http.ts              axios + interceptors (Bearer, refresh, erros)
      api.ts               um serviço por domínio da API
  controllers/             C — estado e ações de cada tela (hooks)
    AuthController.tsx     sessão: login, cadastro, logout, restauração
    ThemeController.tsx    tema claro/escuro
    shared.ts              QueryClient, chaves de cache, useAction, opções de selects
    use*Controller.ts      um controller por tela
  views/                   V — só renderização
    layouts/               AppLayout (barra superior, menu, navegação inferior)
    components/ui/         componentes base (padrão shadcn/ui em styled-components)
    components/            Logo, gráficos, sininho, diálogos de domínio
    pages/                 telas
  styles/                  tokens, temas, GlobalStyle
  utils/format.ts          datas, moeda, quantidades
```

Regras que o código segue:

- **A view não fala com a API.** Ela chama um `use...Controller()` e recebe dados prontos e funções (`c.rows`, `c.save`, `c.openEdit`).
- **Estilo fora do `.tsx`.** Todo componente com estilo tem um `Nome.styles.ts` ao lado, importado como `import * as S from './Nome.styles'`.
- **Nada de cor ou medida solta.** Os estilos leem `theme.colors`, `theme.space()`, `theme.radius`... definidos em `styles/`.

## Autenticação (JWT)

Implementada em `models/services/http.ts` e `tokenStorage.ts`:

1. `login`/`register` devolvem `accessToken` (15 min) e `refreshToken` (7 dias).
2. O **access token fica só em memória**; o **refresh token vai para o `localStorage`** para restaurar a sessão ao recarregar.
3. Toda requisição leva `Authorization: Bearer <accessToken>`.
4. Um minuto antes de o access token vencer, o app chama `/auth/refresh` sozinho.
5. Se ainda assim vier um `401`, o interceptor renova e **repete a requisição uma vez**. Várias requisições simultâneas compartilham a mesma renovação.
6. Se a API recusar o refresh (logout, troca de senha, usuário desativado), a sessão local é encerrada e o usuário volta ao login. Falha de rede não desloga.
7. Sair em uma aba encerra as outras.

## Notificações

- `useNotificationWatcher` (montado no layout) consulta `GET /notifications/unread-count` a cada `VITE_NOTIFICATIONS_POLL_MS` (20 s por padrão), inclusive com a aba em segundo plano.
- Quando o contador sobe, busca as novas, mostra um **toast** com atalho "Abrir" e atualiza sininho, painel e solicitações.
- Em **Configurações → Notificações → Do sistema** o usuário pode ligar os avisos do navegador (aparecem quando o Stokar está em outra aba).
- O sininho lista as últimas; a tela **Notificações** tem filtro, marcar como lida e remover.

A API foi desenhada para consulta periódica (roda em serverless na Vercel, onde conexões abertas como SSE/WebSocket não se sustentam), por isso o app usa polling.

## Design system

**Paleta** (`styles/tokens.ts`)

| Papel | Cor | Uso |
|---|---|---|
| Laranja de segurança | `#F26A0F` | marca, ação principal, entradas no gráfico |
| Aço / grafite | `#101418` → `#F4F5F7` | fundos, superfícies, texto |
| Amarelo de sinalização | `#F2B705` | estoque baixo, faixa zebrada |
| Azul de planta técnica | `#2D7DB3` | saídas no gráfico, informação |
| Verde "liberado" | `#2F9E63` | concluído, em dia |
| Vermelho "parada" | `#D8402B` | sem estoque, rejeitado, ações destrutivas |

O texto sobre o laranja é grafite (`#1A0E03`), como em placas de segurança — contraste de 7:1, o que branco sobre laranja não alcança.

**Tipografia:** Barlow (texto) e Barlow Semi Condensed (títulos e números), famílias inspiradas em placas e sinalização. Instaladas via `@fontsource`, sem depender de CDN.

**Logo:** um "S" desenhado como o caminho de um item pelo almoxarifado — três prateleiras ligadas, com uma seta saindo no topo (saída) e outra entrando na base (entrada). Arquivos: `public/favicon.svg` e `views/components/Logo.tsx`.

**Componentes base** (`views/components/ui`): seguem a API do shadcn/ui (variantes, `asChild`, composição com Radix), reescritos em styled-components: `Button`, `Input`/`Textarea`/`Select`/`Field`, `Dialog`/`ConfirmDialog`, `DropdownMenu`, `Popover`, `Switch`, `Badge`, `Card`, `DataTable`, `Segmented`, `Skeleton`, `EmptyState`, `Avatar`.

## Telas e perfis

| Tela | Rota | Quem vê |
|---|---|---|
| Painel | `/` | todos (equipe vê estoque; solicitante vê as próprias solicitações) |
| Produtos | `/produtos` | todos; cadastro para ADMIN/MANAGER; lançar entrada/saída para a equipe |
| Movimentações | `/movimentacoes` | ADMIN, MANAGER, OPERATOR |
| Solicitações | `/solicitacoes`, `/solicitacoes/:id` | todos (solicitante só as suas) |
| Categorias | `/categorias` | todos; edição para ADMIN/MANAGER |
| Fornecedores | `/fornecedores` | equipe; edição para ADMIN/MANAGER |
| Usuários | `/usuarios` | ADMIN (edita) e MANAGER (consulta) |
| Atendimento (chat) | `/atendimento` | equipe: recebe e responde as mensagens enviadas pelo aplicativo |
| Clientes | `/clientes`, `/clientes/:id` | equipe; veículos, contratos, últimos serviços e acessos ao aplicativo (criar acesso: ADMIN/MANAGER) |
| Contratos | `/contratos` | equipe; edição para ADMIN/MANAGER |
| Serviços e valores | `/servicos` | equipe; catálogo e tipos de serviço, edição para ADMIN/MANAGER |
| Notas de serviço | `/notas` | equipe; cancelar para ADMIN/MANAGER |
| Notificações | `/notificacoes` | todos |
| Configurações | `/configuracoes` | todos; "Dados da oficina" (cabeçalho das notas) para ADMIN/MANAGER |

O perfil `CLIENT` (cliente da oficina) usa o **aplicativo** (`stokar-app`); ao entrar no site ele vê apenas um aviso.

## Oficina: do pedido à nota

1. **Serviços e valores**: cadastre os tipos (ex.: Pneus) e os serviços com valor (ex.: Trocar pneu).
2. **Clientes**: cadastre a empresa ou a pessoa, os veículos e, se quiser, um acesso ao aplicativo.
3. **Contratos**: para empresas, defina vigência, desconto e a tabela de preços negociados.
4. **Solicitações**: o cliente pede pelo aplicativo ou a equipe usa **Registrar serviço**. A equipe lança serviços, peças e desconto até a conclusão.
5. **Nota**: com a solicitação concluída, **Emitir nota** gera o PDF (documento sem valor fiscal) e avisa o cliente.

O **chat** não usa WebSocket (a API roda em serverless): a caixa de entrada é consultada a cada 15 s e a conversa aberta a cada 4 s
(`VITE_CHAT_INBOX_POLL_MS` e `VITE_CHAT_THREAD_POLL_MS`).

## Rotas novas na stokar-api

O painel precisava de três consultas que a API não tinha. Elas estão em `stokar-api/src/modules/reports.routes.ts`:

| Método | Rota | Perfil | Descrição |
|---|---|---|---|
| GET | `/reports/movements-series` | equipe | Entradas e saídas por período. Query: `granularity=day\|week\|month`, `points` (1–60), `tz` (fuso IANA) |
| GET | `/reports/top-products` | equipe | Produtos mais movimentados. Query: `days` (1–365), `limit` (1–20), `type=IN\|OUT` |
| GET | `/reports/my-requests` | todos | Solicitações do usuário autenticado por status (painel do solicitante) |

Exemplos de resposta:

```jsonc
// GET /api/reports/movements-series?granularity=month&points=3&tz=America/Manaus
{ "granularity": "month",
  "points": [ { "bucket": "2026-09-01", "in": 0, "out": 60, "adjustments": 1, "movements": 3 }, ... ] }

// GET /api/reports/top-products?days=30&limit=4&type=OUT
{ "items": [ { "product": { "id": "...", "sku": "CAB-25MM", "name": "Cabo 2,5 mm²", "unit": "M",
                            "quantity": 320, "minQuantity": 150 },
               "movements": 22, "quantity": 860 } ] }

// GET /api/reports/my-requests
{ "total": 9, "byStatus": { "OPEN": 1, "APPROVED": 1, "IN_PROGRESS": 1, "COMPLETED": 5, "REJECTED": 1, "CANCELLED": 0 } }
```
