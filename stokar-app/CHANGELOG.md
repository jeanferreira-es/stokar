# Changelog — stokar-app

Segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/). Como subir a versão: veja "Versionamento" no README.

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
