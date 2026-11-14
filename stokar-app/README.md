# Stokar App

Aplicativo do **Stokar** (React Native + Expo SDK 58) para clientes da oficina e para a equipe usar no celular.
Conversa com a [`stokar-api`](../stokar-api).

## Finalidade

- **Clientes** (pessoas e empresas) pedem serviços, acompanham o andamento, abrem as notas em PDF,
  cadastram veículos e conversam com a oficina pelo chat. A conta pode ser criada no próprio app ou pela oficina no site.
- **Equipe da oficina** (ADMIN, MANAGER, OPERATOR) entra com o mesmo e-mail e senha do site e ganha o "modo oficina":
  registra serviços para qualquer cliente, toca o atendimento (aprovar, iniciar, concluir, emitir nota) e responde o chat.
  É assim que o dono registra um serviço quando está longe do computador.

Não há painel (dashboard) no aplicativo: os indicadores ficam no site ([`stokar-web`](../stokar-web)).

**Stack:** Expo SDK 58 · React Native · TypeScript · styled-components · React Navigation · Context API · expo-secure-store.

## Requisitos

- Node.js 20 ou superior e npm
- A [`stokar-api`](../stokar-api) rodando e acessível pelo aparelho
- Para testar: o app **Expo Go** (compatível com o SDK 58) no celular, ou um emulador Android / simulador iOS
- Para gerar builds: conta no Expo e o EAS CLI (`npm i -g eas-cli`) — veja **Publicação (EAS)**

## Como executar

```bash
cp .env.example .env      # ajuste EXPO_PUBLIC_API_URL
npm install
npm start                 # abre o Expo; leia o QR code com o Expo Go ou tecle "a" (Android) / "i" (iOS)
```

Também há `npm run android` e `npm run ios`, que já abrem no emulador/simulador.

`EXPO_PUBLIC_API_URL` precisa ser alcançável pelo aparelho:

| Onde o app roda | Valor |
|---|---|
| Simulador iOS | `http://localhost:3000/api` |
| Emulador Android | `http://10.0.2.2:3000/api` |
| Celular na mesma rede | `http://IP-DO-COMPUTADOR:3000/api` |
| Produção | a URL publicada da API (HTTPS) |

`npm run typecheck` confere os tipos.

## Arquitetura (a mesma ideia do site)

```
App.tsx                      Provedores (Context API) e navegação
src/
  models/                    Tipos, rótulos, permissões e acesso à API
    services/                http (axios + refresh token), api, tokenStorage, invoicePdf
  contexts/                  Dados globais compartilhados (Context API)
    AuthContext              sessão: usuário, login, cadastro, sair, excluir conta
    AppDataContext           oficina, cadastro do cliente (veículos/contratos), contadores de não lidas
    ThemeContext             tema claro/escuro/do aparelho (também alimenta o styled-components)
    ToastContext             avisos de sucesso e erro
  controllers/               Um hook por tela/fluxo: estado e regras, sem visual
  navigation/                Pilhas e abas (React Navigation) e os tipos das rotas
  styles/                    Tokens e temas (os mesmos do site, em dp)
  utils/                     Formatação e configuração
  views/
    components/ui/           Componentes base, no padrão do shadcn/ui usado no site
    components/              Logo, RequestCard, ChatView
    screens/                 Telas, uma pasta por área
```

**Regras de organização**

- **Estilo separado do componente:** cada `Componente.tsx` tem o seu `Componente.styles.ts` (styled-components/native).
- **Telas não chamam a API:** elas usam um hook de `controllers/`, que usa `models/services/api.ts`.
- **Estado global só em `contexts/`.** Se dois lugares distantes precisam do mesmo dado, ele vai para um contexto.
- **Cores, espaços e fontes** vêm do tema (`theme.colors`, `theme.space(n)`, `theme.fonts`). Não escreva valores soltos.

**Sobre o shadcn/ui:** ele não tem versão para React Native (depende de Radix e Tailwind, que são da web).
Os componentes de `views/components/ui` seguem a mesma API e as mesmas variantes do site
(`Button` com `primary | secondary | outline | ghost | danger`, `Field`, `Badge`, `Card`, `Sheet` no lugar do `Dialog`…),
escritos em styled-components.

## Perfis e telas

| Aba | Cliente (`CLIENT`) | Equipe |
|---|---|---|
| Serviços | os pedidos dele · **Pedir serviço** | todos os serviços, com busca e filtro · **Registrar serviço** |
| Chat / Conversas | conversa com a oficina | caixa de entrada com os clientes |
| Conta | dados, veículos, notas, notificações, tema, política de privacidade, excluir conta | dados, notas, notificações, tema |

O perfil `REQUESTER` (solicitante interno do almoxarifado) usa o site; no app ele vê só um aviso.

## Chat e notificações

A API roda em ambiente serverless e não tem WebSocket nem push. O app consulta:

- a conversa aberta a cada 4 s (`EXPO_PUBLIC_CHAT_POLL_MS`);
- os contadores de não lidas a cada 20 s, com o app em primeiro plano (`EXPO_PUBLIC_UNREAD_POLL_MS`).

Com o app fechado, o cliente não recebe aviso no celular (só e-mail, se a API tiver SMTP configurado).
Push de verdade é o próximo passo natural (`expo-notifications` + uma rota para guardar o token do aparelho).

## Versionamento

O app segue [SemVer](https://semver.org/lang/pt-BR/) e tem **dois números**:

| Número | Onde fica | Quem muda |
|---|---|---|
| **Versão** (`1.0.0`) — a que o usuário vê na loja e em Conta | `package.json` e `app.json` (`expo.version`) | você, com `npm run release` |
| **Build** (`versionCode` no Android, `buildNumber` no iOS) | nos servidores do EAS | o EAS, sozinho, a cada build de produção (`appVersionSource: "remote"` + `autoIncrement`) |

Quando subir cada parte da versão:

- **patch** (`1.0.0 → 1.0.1`): correções;
- **minor** (`1.0.0 → 1.1.0`): novidades que não quebram nada;
- **major** (`1.0.0 → 2.0.0`): mudança que exige a API nova ou muda o jeito de usar.

```bash
npm run release -- minor          # atualiza package.json, app.json e abre a entrada no CHANGELOG.md
# preencha o CHANGELOG.md
git commit -am "release: app v1.1.0" && git tag app-v1.1.0
eas build --profile production --platform all
```

`runtimeVersion` usa a política `appVersion`: uma atualização OTA (`eas update`) só chega a quem tem a mesma versão instalada,
então código JavaScript novo nunca cai em um binário incompatível.

A API e o site têm o próprio `CHANGELOG.md` e a própria versão. A API informa a dela em `GET /` e no Swagger (`/api/docs`).

## Publicação (EAS)

```bash
npm install -g eas-cli
eas login
eas init                           # liga o projeto à sua conta/organização do Expo
eas build --profile preview --platform android     # APK para testar
eas build --profile production --platform all      # lojas
eas submit --profile production
```

### APK para testar (Android)

O perfil `preview` do `eas.json` gera um `.apk` instalável direto no celular (sem loja).
O `.env` não vai para o build (está no `.gitignore`), então a URL da API vem das variáveis do EAS:

```bash
eas login
eas init                                             # só na primeira vez: grava o projectId no app.json
eas env:create --environment preview --name EXPO_PUBLIC_API_URL \
  --value https://SUA-API.onrender.com/api --visibility plaintext   # só na primeira vez
npm run build:apk                                    # = eas build --profile preview --platform android
```

Ao terminar, o EAS mostra um link/QR code para baixar o APK. Os intervalos de consulta e a URL da política
já estão no `env` do perfil `preview` em `eas.json`. Use uma URL `https://`: o Android bloqueia `http://` em builds de release.

Antes do primeiro build:

1. Troque `ios.bundleIdentifier` e `android.package` em `app.json` (`com.stokar.app` é um valor de exemplo).
2. Defina `EXPO_PUBLIC_API_URL` e `EXPO_PUBLIC_PRIVACY_POLICY_URL` de produção (variáveis de ambiente do EAS ou `env` em `eas.json`).
3. Preencha os campos entre colchetes da [Política de Privacidade](./POLITICA_DE_PRIVACIDADE.md) e publique o repositório
   (as lojas exigem o link público da política e um jeito de excluir a conta — o app já tem: Conta → Meus dados → Excluir minha conta).

## Marca

Mesmo nome e mesmo símbolo do site: `assets/logo.svg` é o `stokar-logo.svg`; `views/components/Logo.tsx` desenha o símbolo
com `react-native-svg` e as cores do tema. Os PNGs de ícone e de abertura em `assets/` foram gerados a partir dele.
