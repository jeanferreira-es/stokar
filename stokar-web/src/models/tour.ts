import { MANAGER_ROLES, STAFF_ROLES } from './permissions';
import type { UserRole } from './types';

/**
 * Tutorial de primeiro acesso.
 *
 * Cada passo aponta para elementos marcados com `data-tour="..."` no layout.
 * `targets` é uma lista de alternativas, em ordem: o primeiro elemento visível é destacado
 * (ex.: o item do menu lateral no computador e o botão "Mais" no celular).
 * Sem `targets`, o passo aparece centralizado na tela.
 * Se nenhum alvo estiver visível, o passo é pulado.
 *
 * Mudou bastante o conteúdo? Aumente TOUR_VERSION para que todos vejam o tutorial de novo.
 */
export const TOUR_VERSION = 1;

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targets?: string[];
  /** Perfis que veem o passo; sem `roles`, todos veem. */
  roles?: UserRole[];
}

const nav = (path: string) => `nav:${path}`;
const MORE = 'nav:more';

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Boas-vindas ao Stokar',
    description:
      'Em poucos passos você conhece as principais áreas do sistema. Dá para pular a qualquer momento e rever o tutorial depois, no menu da sua conta.',
  },
  {
    id: 'dashboard',
    targets: [nav('/')],
    title: 'Painel',
    description:
      'A visão geral do dia: produtos com estoque baixo, solicitações por situação e as movimentações dos últimos 30 dias.',
    roles: STAFF_ROLES,
  },
  {
    id: 'dashboard-requester',
    targets: [nav('/')],
    title: 'Painel',
    description: 'Aqui você acompanha as suas solicitações e o que mudou nelas recentemente.',
    roles: ['REQUESTER'],
  },
  {
    id: 'products',
    targets: [nav('/produtos')],
    title: 'Produtos',
    description:
      'O cadastro de peças e materiais, com estoque mínimo e preço de venda. Quando o saldo cai abaixo do mínimo, o Stokar avisa.',
    roles: STAFF_ROLES,
  },
  {
    id: 'products-requester',
    targets: [nav('/produtos')],
    title: 'Produtos',
    description: 'Consulte os produtos e materiais disponíveis antes de abrir uma solicitação.',
    roles: ['REQUESTER'],
  },
  {
    id: 'stock',
    targets: [nav('/movimentacoes')],
    title: 'Movimentações',
    description: 'Registre entradas, saídas e ajustes de estoque. Todo o histórico fica guardado aqui.',
    roles: STAFF_ROLES,
  },
  {
    id: 'requests',
    targets: [nav('/solicitacoes')],
    title: 'Solicitações de serviço',
    description:
      'O dia a dia da oficina: pedidos que chegam pelo aplicativo e serviços registrados pela equipe. Aprove, inicie e conclua cada serviço — ao concluir, as peças usadas saem do estoque — e emita a nota.',
    roles: STAFF_ROLES,
  },
  {
    id: 'requests-requester',
    targets: [nav('/solicitacoes')],
    title: 'Solicitações',
    description: 'Abra pedidos de materiais ou serviços e acompanhe cada etapa até a conclusão.',
    roles: ['REQUESTER'],
  },
  {
    id: 'workshop',
    targets: ['group:workshop', MORE],
    title: 'Oficina',
    description:
      '<b>Clientes</b> e seus veículos, <b>contratos</b> com empresas (preços negociados ou desconto), o catálogo de <b>serviços e valores</b> e as <b>notas de serviço</b> em PDF.',
    roles: STAFF_ROLES,
  },
  {
    id: 'chat',
    targets: [nav('/atendimento'), MORE],
    title: 'Atendimento',
    description:
      'As mensagens que os clientes mandam pelo aplicativo chegam aqui. O número ao lado mostra quantas ainda não foram lidas.',
    roles: STAFF_ROLES,
  },
  {
    id: 'registries-manager',
    targets: ['group:registry', MORE],
    title: 'Cadastros',
    description: 'Categorias, fornecedores e os <b>usuários</b> do sistema, com o perfil de acesso de cada um.',
    roles: MANAGER_ROLES,
  },
  {
    id: 'registries',
    targets: ['group:registry', MORE],
    title: 'Cadastros',
    description: 'Categorias e fornecedores usados nos produtos.',
    roles: ['OPERATOR'],
  },
  {
    id: 'notifications',
    targets: ['notifications'],
    title: 'Notificações',
    description:
      'Estoque baixo, novas solicitações, mudanças de status, notas emitidas e mensagens no chat aparecem no sininho.',
  },
  {
    id: 'theme',
    targets: ['theme'],
    title: 'Tema claro ou escuro',
    description: 'Alterne entre os temas quando quiser. A escolha fica salva neste navegador.',
  },
  {
    id: 'account',
    targets: ['account'],
    title: 'Sua conta',
    description:
      'Abra as Configurações para mudar nome, senha e notificações por e-mail. Também é por aqui que você revê este tutorial.',
  },
  {
    id: 'done-admin',
    title: 'Tudo pronto!',
    description:
      'Uma boa forma de começar: preencha os <b>dados da oficina</b> em Configurações (eles aparecem nas notas) e cadastre os <b>serviços e valores</b> que vocês oferecem.',
    roles: MANAGER_ROLES,
  },
  {
    id: 'done',
    title: 'Tudo pronto!',
    description: 'Você já conhece o essencial. Se precisar, reveja o tutorial no menu da sua conta.',
    roles: ['OPERATOR', 'REQUESTER'],
  },
];

export const tourStepsFor = (role: UserRole) => TOUR_STEPS.filter((step) => !step.roles || step.roles.includes(role));

export const tourStorageKey = (userId: string) => `stokar:tutorial:v${TOUR_VERSION}:${userId}`;
