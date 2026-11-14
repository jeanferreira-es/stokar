# Changelog — stokar-web

Segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/). A versão fica em `package.json`.

## 1.3.0 — 2026-11-13

### Adicionado
- Tutorial de primeiro acesso (driver.js): destaca o menu, o sininho, o tema e a conta, com textos por perfil
  (equipe, gestores e solicitantes). Abre sozinho uma vez por usuário e pode ser revisto em
  **menu da conta → Ver tutorial**, em **Mais** (celular) ou em **Configurações → Tutorial**.

## 1.2.0 — 2026-11-13

### Adicionado
- Botão de mostrar/ocultar a senha no login e no cadastro (`PasswordInput`).
- Cadastro: campo "Repita a senha".

## 1.1.0 — 2026-11-12

### Adicionado
- **Atendimento**: caixa de entrada e conversa para responder as mensagens enviadas pelos clientes no aplicativo.
- **Clientes**: cadastro de empresas e pessoas, veículos, acessos ao aplicativo, contratos e últimos serviços.
- **Contratos**: vigência, mensalidade, desconto e tabela de preços negociados.
- **Serviços e valores**: catálogo de serviços e tipos de serviço.
- **Notas de serviço**: lista, PDF e cancelamento; botão **Emitir nota** na solicitação concluída.
- Solicitação: cliente, veículo, contrato, serviços com valor, valor das peças, desconto e totais.
- Produto: preço de venda. Configurações: dados da oficina.

### Alterado
- A equipe pode editar a solicitação até a conclusão.
- O perfil de cliente (aplicativo) não acessa o site.

## 1.0.0

- Painel, produtos, movimentações, solicitações, cadastros, notificações e configurações.
