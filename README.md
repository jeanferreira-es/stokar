# Stokar

Sistema de gestão para **oficinas**: controle de estoque de peças, serviços para clientes (pessoas e empresas com contrato),
catálogo de serviços com valores, notas de serviço em PDF, chat com clientes e notificações.

## Finalidade

Organizar o dia a dia da oficina em um só sistema:

- a **equipe** controla estoque, clientes, contratos e o andamento de cada serviço pelo site;
- os **clientes** pedem serviços, acompanham o status, baixam as notas e falam com a oficina pelo aplicativo;
- o **dono** consegue registrar e tocar serviços pelo celular quando está longe do computador.

## Projetos

| Pasta | O que é | Stack |
|---|---|---|
| [`stokar-api`](./stokar-api) | API REST com as regras de negócio, banco de dados e documentação Swagger | Node.js · Express · TypeORM · PostgreSQL |
| [`stokar-web`](./stokar-web) | Site da equipe: painel, estoque, oficina, notas e atendimento | React · Vite · styled-components |
| [`stokar-app`](./stokar-app) | Aplicativo para clientes e "modo oficina" para a equipe | React Native · Expo |

Cada projeto tem seu próprio README, CHANGELOG e versão (SemVer).

## Como executar tudo localmente

Requisitos: Node.js 20+, npm e PostgreSQL (ou Docker).

```bash
# 1. API — http://localhost:3000/api  (Swagger em /api/docs)
cd stokar-api
cp .env.example .env
docker compose up -d        # opcional: Postgres local
npm install && npm run dev

# 2. Site — http://localhost:5173  (em outro terminal)
cd stokar-web
cp .env.example .env
npm install && npm run dev

# 3. Aplicativo  (em outro terminal)
cd stokar-app
cp .env.example .env        # ajuste EXPO_PUBLIC_API_URL para o seu aparelho/emulador
npm install && npm start
```

O primeiro usuário criado no site vira `ADMIN`. Detalhes de configuração, deploy e publicação estão no README de cada projeto.

## Política de privacidade

A política de privacidade do aplicativo está em [`stokar-app/POLITICA_DE_PRIVACIDADE.md`](./stokar-app/POLITICA_DE_PRIVACIDADE.md).
