import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthController, useAuth } from './controllers/AuthController';
import { queryClient } from './controllers/shared';
import { ThemeController, useThemeMode } from './controllers/ThemeController';
import { TourController } from './controllers/TourController';
import { MANAGER_ROLES, STAFF_ROLES } from './models/permissions';
import type { UserRole } from './models/types';
import { Logo } from './views/components/Logo';
import { Button } from './views/components/ui';
import { AppLayout } from './views/layouts/AppLayout';
import { FullScreen } from './views/layouts/AppLayout.styles';
import { LoginPage, RegisterPage } from './views/pages/Auth';
import { CatalogPage } from './views/pages/Catalog';
import { ChatPage } from './views/pages/Chat';
import { ContractsPage } from './views/pages/Contracts';
import { CustomersPage } from './views/pages/Customers';
import { CustomerDetailPage } from './views/pages/Customers/Detail';
import { DashboardPage } from './views/pages/Dashboard';
import { InvoicesPage } from './views/pages/Invoices';
import { NotificationsPage } from './views/pages/Notifications';
import { ProductsPage } from './views/pages/Products';
import { CategoriesPage } from './views/pages/Registries/Categories';
import { SuppliersPage } from './views/pages/Registries/Suppliers';
import { UsersPage } from './views/pages/Registries/Users';
import { RequestsPage } from './views/pages/Requests';
import { RequestDetailPage } from './views/pages/Requests/Detail';
import { SettingsPage } from './views/pages/Settings';
import { StockPage } from './views/pages/Stock';

const Splash = () => (
  <FullScreen role="status" aria-label="Carregando o Stokar">
    <Logo size={56} />
  </FullScreen>
);

function ClientNotice({ onLogout }: { onLogout: () => void }) {
  return (
    <FullScreen>
      <div style={{ display: 'grid', gap: 16, justifyItems: 'center', textAlign: 'center', maxWidth: 420, padding: 24 }}>
        <Logo size={56} />
        <h1 style={{ fontSize: '1.375rem' }}>Seu acesso é pelo aplicativo</h1>
        <p>
          Esta área é da equipe da oficina. Para pedir serviços, acompanhar o andamento, abrir as notas e conversar com a
          oficina, use o aplicativo Stokar no celular.
        </p>
        <Button variant="outline" onClick={onLogout}>
          Sair
        </Button>
      </div>
    </FullScreen>
  );
}

/** Só entra quem tem sessão; guarda a rota pedida para voltar depois do login. */
function Protected() {
  const { status, user, logout } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <Splash />;
  if (status === 'guest') return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  // O perfil de cliente usa o aplicativo: o site é a área da equipe
  if (user?.role === 'CLIENT') return <ClientNotice onLogout={() => void logout()} />;
  return (
    <TourController>
      <AppLayout />
    </TourController>
  );
}

function GuestOnly() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <Splash />;
  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? '/'} replace />;
  }
  return <Outlet />;
}

/** Esconde telas que o perfil não usa (a API também barra com 403). */
function Allow({ roles }: { roles: UserRole[] }) {
  const { user } = useAuth();
  return user && roles.includes(user.role) ? <Outlet /> : <Navigate to="/" replace />;
}

function ThemedToaster() {
  const { mode } = useThemeMode();
  return <Toaster theme={mode} position="top-right" closeButton />;
}

export function App() {
  return (
    <ThemeController>
      <QueryClientProvider client={queryClient}>
        <AuthController>
          <BrowserRouter>
            <Routes>
              <Route element={<GuestOnly />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/cadastro" element={<RegisterPage />} />
              </Route>

              <Route element={<Protected />}>
                <Route index element={<DashboardPage />} />
                <Route path="/produtos" element={<ProductsPage />} />
                <Route path="/solicitacoes" element={<RequestsPage />} />
                <Route path="/solicitacoes/:id" element={<RequestDetailPage />} />
                <Route path="/categorias" element={<CategoriesPage />} />
                <Route path="/notificacoes" element={<NotificationsPage />} />
                <Route path="/configuracoes" element={<SettingsPage />} />

                <Route element={<Allow roles={STAFF_ROLES} />}>
                  <Route path="/movimentacoes" element={<StockPage />} />
                  <Route path="/fornecedores" element={<SuppliersPage />} />
                  <Route path="/atendimento" element={<ChatPage />} />
                  <Route path="/clientes" element={<CustomersPage />} />
                  <Route path="/clientes/:id" element={<CustomerDetailPage />} />
                  <Route path="/contratos" element={<ContractsPage />} />
                  <Route path="/servicos" element={<CatalogPage />} />
                  <Route path="/notas" element={<InvoicesPage />} />
                </Route>
                <Route element={<Allow roles={MANAGER_ROLES} />}>
                  <Route path="/usuarios" element={<UsersPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <ThemedToaster />
        </AuthController>
      </QueryClientProvider>
    </ThemeController>
  );
}
