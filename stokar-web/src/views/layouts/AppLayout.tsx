import { ChevronDown, Ellipsis, GraduationCap, LogOut, Moon, Settings, Sun } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useCurrentUser } from '@/controllers/AuthController';
import { useThemeMode } from '@/controllers/ThemeController';
import { useTour } from '@/controllers/TourController';
import { useChatUnread } from '@/controllers/useChatController';
import { useNotificationWatcher } from '@/controllers/useNotificationsController';
import { ROLE_LABEL } from '@/models/labels';
import { greeting, initials } from '@/utils/format';
import { Logo } from '../components/Logo';
import { NotificationBell } from '../components/NotificationBell';
import {
  Avatar,
  Dialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui';
import * as S from './AppLayout.styles';
import { currentNavItem, navFor, type NavItem } from './navigation';

const GROUPS: Array<NavItem['group']> = ['main', 'workshop', 'registry', 'account'];

export function AppLayout() {
  const user = useCurrentUser();
  const { logout } = useAuth();
  const { mode, toggle } = useThemeMode();
  const { startTour } = useTour();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const unread = useNotificationWatcher();
  const chatUnread = useChatUnread();
  const [moreOpen, setMoreOpen] = useState(false);

  const items = navFor(user.role);
  const section = currentNavItem(pathname);
  const SectionIcon = section?.icon;
  const bottomItems = items.filter((i) => i.mobile).slice(0, 4);
  const moreItems = items.filter((i) => !bottomItems.includes(i));

  return (
    <S.Shell>
      <S.TopBar>
        <Link to="/" aria-label="Stokar — ir para o painel">
          <S.BrandFull>
            <Logo size={42} />
          </S.BrandFull>
          <S.BrandMark>
            <Logo size={40} markOnly />
          </S.BrandMark>
        </Link>

        {section && SectionIcon && (
          <S.Section>
            <SectionIcon aria-hidden />
            <span>{section.label}</span>
          </S.Section>
        )}

        <S.Spacer />

        <S.TopActions>
          <S.ThemeToggle
            onClick={toggle}
            data-tour="theme"
            role="switch"
            aria-checked={mode === 'dark'}
            aria-label="Modo escuro"
            title={mode === 'dark' ? 'Mudar para o modo claro' : 'Mudar para o modo escuro'}
          >
            <span data-active={mode === 'light'}>
              <Sun aria-hidden />
            </span>
            <span data-active={mode === 'dark'}>
              <Moon aria-hidden />
            </span>
          </S.ThemeToggle>

          <NotificationBell unread={unread} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <S.UserButton aria-label="Menu da conta" data-tour="account">
                <Avatar $size={42}>{initials(user.name)}</Avatar>
                <div>
                  <small>{greeting()}</small>
                  <strong>{user.name}</strong>
                </div>
                <ChevronDown aria-hidden />
              </S.UserButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>
                {user.email} — {ROLE_LABEL[user.role]}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate('/configuracoes')}>
                <Settings /> Configurações
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={startTour}>
                <GraduationCap /> Ver tutorial
              </DropdownMenuItem>
              <DropdownMenuItem $danger onSelect={() => void logout()}>
                <LogOut /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </S.TopActions>
      </S.TopBar>

      <S.Side aria-label="Navegação principal">
        {GROUPS.map((group) => {
          const groupItems = items.filter((i) => i.group === group);
          if (groupItems.length === 0) return null;
          return (
            <S.SideGroup key={group} data-tour={`group:${group}`}>
              {groupItems.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <S.SideLink to={to} end={to === '/'} title={label} data-tour={`nav:${to}`}>
                    <Icon aria-hidden />
                    <span>{label}</span>
                    {to === '/notificacoes' && unread > 0 && (
                      <S.Count data-count aria-label={`${unread} não lidas`}>
                        {unread > 99 ? '99+' : unread}
                      </S.Count>
                    )}
                    {to === '/atendimento' && chatUnread > 0 && (
                      <S.Count data-count aria-label={`${chatUnread} mensagens não lidas`}>
                        {chatUnread > 99 ? '99+' : chatUnread}
                      </S.Count>
                    )}
                  </S.SideLink>
                </li>
              ))}
            </S.SideGroup>
          );
        })}
      </S.Side>

      <S.Main>
        <Outlet />
      </S.Main>

      <S.BottomNav aria-label="Navegação principal">
        {bottomItems.map(({ to, label, short, icon: Icon }) => (
          <S.BottomLink key={to} to={to} end={to === '/'} aria-label={label} data-tour={`nav:${to}`}>
            <Icon aria-hidden />
            {short ?? label}
          </S.BottomLink>
        ))}
        <S.BottomButton
          type="button"
          data-tour="nav:more"
          className={moreItems.some((i) => i === section) ? 'active' : undefined}
          onClick={() => setMoreOpen(true)}
        >
          <Ellipsis aria-hidden />
          Mais
        </S.BottomButton>
      </S.BottomNav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen} title="Mais opções" size="sm">
        <S.MoreList>
          {moreItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink to={to} onClick={() => setMoreOpen(false)}>
                <Icon aria-hidden />
                {label}
              </NavLink>
            </li>
          ))}
          <li>
            <a
              href="#tutorial"
              onClick={(e) => {
                e.preventDefault();
                setMoreOpen(false);
                startTour();
              }}
            >
              <GraduationCap aria-hidden />
              Ver tutorial
            </a>
          </li>
          <li>
            <a
              href="#sair"
              onClick={(e) => {
                e.preventDefault();
                void logout();
              }}
            >
              <LogOut aria-hidden />
              Sair
            </a>
          </li>
        </S.MoreList>
      </Dialog>
    </S.Shell>
  );
}
