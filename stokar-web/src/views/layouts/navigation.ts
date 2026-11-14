import {
  ArrowLeftRight,
  Bell,
  Building2,
  ClipboardList,
  Handshake,
  LayoutDashboard,
  MessagesSquare,
  Package,
  ReceiptText,
  Settings,
  Tags,
  Truck,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { MANAGER_ROLES, STAFF_ROLES } from '@/models/permissions';
import type { UserRole } from '@/models/types';

export interface NavItem {
  to: string;
  label: string;
  /** Rótulo curto para a barra inferior do celular. */
  short?: string;
  icon: LucideIcon;
  /** Perfis que enxergam o item; sem `roles`, todos enxergam. */
  roles?: UserRole[];
  /** Aparece na barra inferior do celular (os demais ficam em "Mais"). */
  mobile?: boolean;
  group: 'main' | 'workshop' | 'registry' | 'account';
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Painel', icon: LayoutDashboard, mobile: true, group: 'main' },
  { to: '/produtos', label: 'Produtos', icon: Package, mobile: true, group: 'main' },
  { to: '/movimentacoes', label: 'Movimentações', short: 'Estoque', icon: ArrowLeftRight, roles: STAFF_ROLES, mobile: true, group: 'main' },
  { to: '/solicitacoes', label: 'Solicitações', short: 'Serviços', icon: ClipboardList, mobile: true, group: 'main' },
  { to: '/atendimento', label: 'Atendimento', icon: MessagesSquare, roles: STAFF_ROLES, group: 'workshop' },
  { to: '/clientes', label: 'Clientes', icon: Building2, roles: STAFF_ROLES, group: 'workshop' },
  { to: '/contratos', label: 'Contratos', icon: Handshake, roles: STAFF_ROLES, group: 'workshop' },
  { to: '/servicos', label: 'Serviços e valores', icon: Wrench, roles: STAFF_ROLES, group: 'workshop' },
  { to: '/notas', label: 'Notas de serviço', icon: ReceiptText, roles: STAFF_ROLES, group: 'workshop' },
  { to: '/categorias', label: 'Categorias', icon: Tags, group: 'registry' },
  { to: '/fornecedores', label: 'Fornecedores', icon: Truck, roles: STAFF_ROLES, group: 'registry' },
  { to: '/usuarios', label: 'Usuários', icon: Users, roles: MANAGER_ROLES, group: 'registry' },
  { to: '/notificacoes', label: 'Notificações', icon: Bell, group: 'account' },
  { to: '/configuracoes', label: 'Configurações', icon: Settings, group: 'account' },
];

export const navFor = (role: UserRole) => NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));

export function currentNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => (item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)));
}
