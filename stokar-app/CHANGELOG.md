# Changelog — stokar-app

Segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/). Como subir a versão: veja "Versionamento" no README.

## 1.2.0 — 2026-11-14

### Adicionado
- Tela inicial do cliente: cartão **Pagamento pendente** e tela **Pagamentos**, com a chave PIX da oficina, as instruções
  e o "PIX copia e cola" com o valor de cada serviço (`expo-clipboard`).
- Detalhe do serviço: situação do pagamento; o cliente vai direto para o PIX e a equipe usa **Registrar pagamento**.
  Com a regra "concluir só depois do pagamento" ligada, o botão de concluir dá lugar a um aviso.
- Login: atalho **Entrar como** com as contas já usadas no aparelho (preenche só o e-mail).
- Trocar senha: campo **Repita a nova senha**.

### Alterado
- A sessão só termina ao tocar em **Sair**: login com sessão longa do app, e sem internet o app abre com o último perfil salvo
  em vez de voltar para o login.
- O aviso de mensagem no chat só some quando a aba **Chat** é aberta (antes, a aba montada em segundo plano marcava como lida).

## 1.1.0 — 2026-11-13

### Adicionado
- Tela inicial: sininho com o contador de notificações não lidas e a seção **Novidades**, que mostra o que mudou
  (serviço aprovado, iniciado, concluído, nota emitida, resposta no chat) e leva direto ao assunto.
- Botão de mostrar/ocultar a senha no login, no cadastro e na troca de senha.
- Cadastro: campo "Repita a senha".

### Alterado
- A lista de serviços se atualiza sozinha quando chega uma notificação.
- Abrir o chat tira do sininho o aviso de "nova mensagem" (requer a API 1.1.1).

## 1.0.0 — 2026-11-13

### Adicionado
- Login e cadastro do cliente (pessoa física ou empresa).
- **Cliente:** pedir serviço escolhendo no catálogo (com os valores do contrato, se houver), acompanhar o andamento,
  cancelar o pedido, abrir o PDF das notas, cadastrar veículos e conversar com a oficina.
- **Equipe da oficina:** registrar serviço para um cliente (com serviços avulsos, peças do estoque e desconto), cadastro rápido de cliente,
  aprovar, iniciar, concluir, emitir nota e responder as conversas.
- Notificações no aplicativo, tema claro/escuro e exclusão da conta.
