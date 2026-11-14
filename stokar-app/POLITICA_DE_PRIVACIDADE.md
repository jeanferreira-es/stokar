<!--
COMO PREENCHER (este comentário não aparece na página publicada)

Todo texto entre colchetes [ ] precisa ser trocado por dados reais antes de publicar o app. Confira com:
  grep -n "\[" POLITICA_DE_PRIVACIDADE.md

- Seção 1: o responsável pode ser pessoa física (autônomo, MEI) ou empresa. Use os mesmos dados de
  "Configurações → Dados da oficina" (eles saem no cabeçalho das notas), para que os dois lugares batam.
- Encarregado: agente de pequeno porte (inclui pessoa física e MEI) pode não indicar encarregado
  (Resolução CD/ANPD nº 2/2022, art. 11). Nesse caso escreva "Não indicado — fale pelo contato acima".
- Seção 1, "Hospedagem": se quem hospeda o sistema é o próprio responsável, apague o parágrafo do operador.
- Seção 4: se um dia configurar NOTIFICATION_WEBHOOK_URL na API (Slack, Discord, n8n...), inclua a ferramenta na tabela
  de fornecedores (dados envolvidos: nome dos destinatários, título e texto dos avisos).
- Seção 5: só prometa o prazo dos registros técnicos que o provedor de hospedagem (ou você) realmente guarda.
  Empresa com fins econômicos precisa guardar no mínimo 6 meses (Marco Civil, art. 15).
- Ao mudar o texto, atualize a versão, a data e o histórico (seção 12).
-->

# Política de Privacidade — Stokar

**Versão 1.1 · em vigor desde 14 de novembro de 2026**

Esta política explica quais dados o aplicativo **Stokar** trata, para quê, com quem são compartilhados, por quanto tempo
são guardados e como você exerce os seus direitos. Ela segue a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD)
e o Marco Civil da Internet (Lei nº 12.965/2014).

## 1. Quem é o responsável pelos seus dados

O responsável (controlador) pelos seus dados é quem opera a oficina que atende você por este aplicativo. Pode ser uma
pessoa física (profissional autônomo ou MEI) ou uma empresa:

- **Nome completo ou razão social:** Fulano de Souza Santos
- **CPF ou CNPJ:** 947.273.736-65
- **Endereço:** Vila Malheiros 140, Manaus - AM
- **E-mail:** fulano.santos@gmail.com
- **Telefone:** +5592994237543
- **Encarregado pelo tratamento de dados (DPO):** Fedaykim Atreides — fedaykim@gmail.com

Esses mesmos dados aparecem no cabeçalho das notas de serviço emitidas pelo aplicativo.

**Hospedagem e manutenção do sistema:** Jean da Silva Ferreira, 033.816.592-43,
fedaykim@gmail.com, hospeda e mantém o sistema em nome do responsável, como **operador** (art. 5º, VII, da LGPD). Ele trata os
dados apenas para fazer o sistema funcionar, conforme as instruções do responsável.

## 2. Quais dados tratamos

| Dado | Quando é coletado | Para quê |
|---|---|---|
| **Cadastro de acesso:** nome, e-mail, telefone e senha (guardada só como hash, de forma irreversível) | Ao criar a conta ou quando a oficina cria o seu acesso | Identificar você, permitir o login e falar com você sobre os seus serviços |
| **Cadastro para as notas:** nome completo ou razão social, CPF ou CNPJ e endereço | Ao criar a conta, ao editar **Meus dados** ou quando a oficina cadastra você | Emitir as notas de serviço e manter o cadastro de clientes da oficina |
| **Veículos e equipamentos:** marca, modelo, ano, cor, placa ou número de série e observações | Quando você ou a oficina cadastra um veículo | Saber em qual veículo o serviço será feito e manter o histórico dele |
| **Pedidos de serviço:** serviços escolhidos, descrição, datas, andamento, valores e contrato aplicado | Ao pedir um serviço e durante o atendimento | Executar o serviço contratado e informar o andamento |
| **Notas de serviço:** dados do cliente e do serviço no momento da emissão | Quando a oficina emite a nota | Comprovar o serviço prestado e cumprir obrigações fiscais e contábeis |
| **Mensagens do chat:** texto, data e hora | Ao conversar com a oficina | Atender você e manter o histórico do atendimento |
| **Notificações:** avisos sobre os seus serviços, notas e mensagens | Automaticamente, conforme o andamento | Manter você informado no aplicativo e, se você não desligar, por e-mail |
| **Registros de acesso:** endereço IP, data e hora das requisições aos servidores | Automaticamente, a cada uso | Segurança, prevenção a fraudes, diagnóstico de falhas e cumprimento do Marco Civil da Internet |
| **Verificação de atualizações:** identificador aleatório da instalação (não ligado à sua conta), sistema (Android ou iOS), versão do aplicativo, canal de atualização e endereço IP | Quando o aplicativo abre e procura uma versão nova | Entregar correções e melhorias do aplicativo sem precisar de nova instalação |

**O que o aplicativo não faz:** não acessa localização, câmera, microfone, contatos, fotos ou arquivos do aparelho;
não exibe publicidade; não usa ferramentas de análise de comportamento nem rastreia você entre outros aplicativos ou sites;
não vende dados.

### Dados guardados no seu aparelho

- **Token de sessão**, no armazenamento seguro do sistema (Keychain no iOS, Keystore no Android), para manter você conectado.
  É apagado quando você sai da conta.
- **Preferência de aparência** (claro, escuro ou do aparelho).
- **Cópia temporária dos PDFs** das notas que você abre, na área de cache do aplicativo.
- **Identificador da instalação** usado na verificação de atualizações.

Esses dados são apagados quando você desinstala o aplicativo. Se você **compartilhar** uma nota (por e-mail, WhatsApp
ou outro aplicativo), a cópia enviada passa a ser tratada pelo aplicativo e pelas pessoas que você escolheu, fora do
controle do Stokar.

## 3. Bases legais

Tratamos os seus dados com base em:

- **Execução de contrato** e procedimentos preliminares (art. 7º, V): cadastro, veículos, pedidos, andamento, chat,
  notificações e notas;
- **Cumprimento de obrigação legal ou regulatória** (art. 7º, II): guarda das notas e dos registros dos serviços, pelos
  prazos fiscais, contábeis e do Código de Defesa do Consumidor, e guarda dos registros de acesso (Marco Civil, art. 15);
- **Exercício regular de direitos** (art. 7º, VI): guarda do histórico de atendimento para eventuais disputas;
- **Legítimo interesse** (art. 7º, IX): segurança do serviço, prevenção a fraudes e entrega de atualizações do aplicativo.
  Você pode se opor a esse tratamento (seção 7).

Não usamos o consentimento como base para nenhum tratamento. Se isso mudar, pediremos o seu consentimento de forma
específica, e ele poderá ser retirado a qualquer momento.

## 4. Com quem compartilhamos

- **Equipe da oficina**, que acessa os dados pelo aplicativo e pelo sistema web, conforme a função de cada pessoa, para atender você;
- **Fornecedores de tecnologia**, apenas na medida necessária para prestar o serviço:

| Fornecedor | Serviço | Dados envolvidos | Onde ficam |
|---|---|---|---|
| Render (Render Services, Inc.) | Hospedagem do servidor do sistema (API) | Todos os dados da seção 2 que passam pelo servidor e os registros de acesso | Estados Unidos (Oregon) |
| Render (Render Services, Inc.) — Render Postgres | Banco de dados PostgreSQL | Todos os dados da seção 2 guardados no sistema | Estados Unidos (Oregon) |
| Vercel (Vercel Inc.) | Hospedagem do sistema web usado pela equipe da oficina | Endereço IP, data e hora de quem acessa o sistema web. Os dados de clientes não ficam guardados na Vercel: o sistema web os busca direto do servidor no Render | Estados Unidos e rede global de distribuição |
| Google (Google LLC) — Gmail / Google Workspace | Envio dos avisos por e-mail | Seu e-mail, o título e o texto dos avisos. Uma cópia de cada aviso fica na caixa de "Enviados" da conta usada no envio | Estados Unidos e outros países onde o Google mantém data centers |
| Expo (650 Industries, Inc.) | Entrega de atualizações do aplicativo | Dados da linha "Verificação de atualizações" da seção 2 | Estados Unidos |

- **Autoridades públicas**, quando houver obrigação legal ou ordem judicial.

**Transferência internacional:** os fornecedores que guardam ou processam dados fora do Brasil fazem isso com base em
cláusulas-padrão contratuais, conforme o art. 33, II, "b", da LGPD e a Resolução CD/ANPD nº 19/2024, ou em outro
mecanismo previsto nos arts. 33 a 36 da LGPD.

## 5. Por quanto tempo guardamos

| Dado | Prazo |
|---|---|
| Cadastro de acesso (nome, e-mail, telefone, senha) | Enquanto a conta estiver ativa; é anonimizado quando você exclui a conta (seção 6) |
| Cadastro para as notas, veículos, pedidos e notas de serviço | 5 anos após o último serviço, prazo fiscal (Código Tributário Nacional, arts. 173 e 174) e de prescrição do Código de Defesa do Consumidor (art. 27), mesmo que a conta seja excluída |
| Mensagens do chat | 5 anos após a última mensagem, para o exercício de direitos em eventuais disputas |
| Notificações | Enquanto a conta estiver ativa |
| Registros de acesso (IP, data e hora) | 6 meses após o registro dos dados |

Ao fim desses prazos, os dados são eliminados ou anonimizados, a não ser que outra obrigação legal exija guardá-los por mais tempo.

## 6. Como excluir a sua conta e os seus dados

Você pode excluir a conta **pelo próprio aplicativo**: **Conta → Meus dados → Excluir minha conta**.

**Serviços em aberto:** enquanto houver um serviço aberto, aprovado ou em andamento, a exclusão fica bloqueada, porque a
oficina ainda precisa falar com você para executar e entregar o serviço contratado. Aguarde a conclusão ou peça o
cancelamento à oficina e, depois, exclua a conta.

Ao confirmar com a sua senha:

- o seu acesso é encerrado na hora, em todos os aparelhos;
- o seu nome, e-mail e telefone são apagados da conta de acesso, que é anonimizada, e os avisos por e-mail param.

**O que continua com a oficina**, pelos prazos da seção 5 e pelas obrigações legais da seção 3: o cadastro usado nas
notas (nome completo ou razão social, CPF ou CNPJ e endereço), os veículos, os pedidos, as notas emitidas e as mensagens
do chat. Terminados os prazos, esses dados também são eliminados ou anonimizados.

**Sem o aplicativo:** peça a exclusão pelo e-mail da seção 1, informando o e-mail da conta. Para proteger você,
poderemos pedir uma confirmação de identidade. Respondemos em até 15 dias.

As contas da equipe da oficina são excluídas por um administrador do sistema.

## 7. Os seus direitos

Pela LGPD (art. 18), você pode pedir a qualquer momento:

- confirmação de que tratamos os seus dados e acesso a eles;
- correção de dados incompletos, inexatos ou desatualizados (também em **Conta → Meus dados**);
- anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desacordo com a lei;
- portabilidade dos dados a outro fornecedor;
- informação sobre com quem os dados foram compartilhados;
- **oposição** ao tratamento feito por legítimo interesse (art. 18, § 2º);
- revogação do consentimento, se algum dia o tratamento se basear nele.

Você pode **desligar os avisos por e-mail** em **Conta → Meus dados → Avisos por e-mail**. Os avisos dentro do aplicativo
continuam, porque fazem parte do atendimento.

Para exercer os seus direitos, use o contato da seção 1. Respondemos em até 15 dias. Você também pode reclamar à
Autoridade Nacional de Proteção de Dados (ANPD): https://www.gov.br/anpd.

## 8. Segurança

- A comunicação entre o aplicativo e os servidores é criptografada (HTTPS/TLS);
- as senhas são guardadas apenas como hash (bcrypt), nunca em texto legível;
- o acesso usa tokens de curta duração, e a troca de senha, a saída ou a exclusão da conta encerram as sessões;
- cada cliente só vê os próprios pedidos, veículos, notas e conversas, e a equipe acessa conforme a função de cada pessoa.

Nenhum sistema é totalmente imune a incidentes. Se ocorrer um incidente que possa trazer risco ou dano relevante a você,
avisaremos você e a ANPD, como exige o art. 48 da LGPD.

## 9. Crianças e adolescentes

O aplicativo é destinado a maiores de 18 anos e a empresas. Não coletamos intencionalmente dados de crianças e adolescentes.
Se você souber de uma conta criada por menor de idade, avise pelo contato da seção 1 para que ela seja excluída.

## 10. Alterações desta política

Esta política pode ser atualizada. A versão e a data de vigência ficam no topo, e o histórico de alterações fica na seção 12.
Mudanças relevantes serão avisadas por e-mail ou por aviso no aplicativo antes de entrarem em vigor.

## 11. Contato

Dúvidas sobre esta política ou sobre os seus dados: fedaykim@gmail.com, os mesmos da seção 1.

## 12. Histórico de versões

- **1.1 — 14/11/2026:** identificação do responsável como pessoa física ou empresa e do operador; inclusão da verificação
  de atualizações (Expo), dos avisos por e-mail e de como desligá-los; lista de fornecedores e
  (Render, Vercel, Google e Expo) e base da transferência internacional; prazos de guarda detalhados; detalhamento do que continua guardado após a exclusão
  da conta; direito de oposição; aviso sobre notas compartilhadas; retirada do consentimento como base legal; bloqueio da exclusão da conta enquanto houver serviço em aberto.
- **1.0 — 13/11/2026:** primeira versão.
