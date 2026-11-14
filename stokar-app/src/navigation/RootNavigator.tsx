import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ClipboardList, MessagesSquare, UserRound } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTheme } from 'styled-components/native';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { isClient, isStaff } from '@/models/permissions';
import { Loading } from '@/views/components/ui';
import { ChangePasswordScreen } from '@/views/screens/Account/ChangePassword';
import { AccountScreen } from '@/views/screens/Account';
import { ProfileScreen } from '@/views/screens/Account/Profile';
import { LoginScreen } from '@/views/screens/Auth/Login';
import { RegisterScreen } from '@/views/screens/Auth/Register';
import { ClientChatScreen } from '@/views/screens/Chat/ClientChat';
import { InboxScreen } from '@/views/screens/Chat/Inbox';
import { StaffChatScreen } from '@/views/screens/Chat/StaffChat';
import { CustomerFormScreen } from '@/views/screens/Customers/Form';
import { InvoicesScreen } from '@/views/screens/Invoices/List';
import { PaymentsScreen } from '@/views/screens/Payments';
import { NotificationsScreen } from '@/views/screens/Notifications/List';
import { RequestDetailScreen } from '@/views/screens/Requests/Detail';
import { RequestsListScreen } from '@/views/screens/Requests/List';
import { NewRequestScreen } from '@/views/screens/Requests/New';
import { UnsupportedScreen } from '@/views/screens/Unsupported';
import { VehicleFormScreen } from '@/views/screens/Vehicles/Form';
import { VehiclesScreen } from '@/views/screens/Vehicles/List';
import type { AuthStackParamList, RootStackParamList, TabsParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabsParamList>();

/**
 * Abas principais. Cliente e equipe usam o mesmo app:
 * - cliente: Serviços (os dele), Chat (com a oficina) e Conta;
 * - equipe: Serviços (todos), Conversas (caixa de entrada) e Conta.
 * É assim que o dono registra serviços e responde clientes quando está longe do site.
 */
function TabsNavigator() {
  const theme = useTheme();
  const { user } = useAuth();
  const { unreadChat, unreadNotifications } = useAppData();
  const staff = isStaff(user);

  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primaryText,
        tabBarInactiveTintColor: theme.colors.textSubtle,
        tabBarLabelStyle: { fontFamily: theme.fonts.medium, fontSize: 12, lineHeight: 16 },
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
        tabBarBadgeStyle: { backgroundColor: theme.colors.primary, color: theme.colors.primaryFg, fontFamily: theme.fonts.semibold },
      }}
    >
      <Tabs.Screen
        name="Services"
        component={RequestsListScreen}
        options={{ title: 'Serviços', tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="Chat"
        component={staff ? InboxScreen : ClientChatScreen}
        options={{
          title: staff ? 'Conversas' : 'Chat',
          tabBarBadge: unreadChat > 0 ? (unreadChat > 99 ? '99+' : unreadChat) : undefined,
          tabBarIcon: ({ color, size }) => <MessagesSquare color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="Account"
        component={AccountScreen}
        options={{
          title: 'Conta',
          tabBarBadge: unreadNotifications > 0 ? (unreadNotifications > 99 ? '99+' : unreadNotifications) : undefined,
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
        }}
      />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const theme = useTheme();
  const { status, user } = useAuth();

  const navigationTheme = useMemo<Theme>(() => {
    const base = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.primary,
        background: theme.colors.bg,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.primary,
      },
    };
  }, [theme]);

  const stackOptions = {
    headerStyle: { backgroundColor: theme.colors.bg },
    headerShadowVisible: false,
    headerTintColor: theme.colors.text,
    headerTitleStyle: { fontFamily: theme.fonts.display, fontSize: 19 },
    headerBackButtonDisplayMode: 'minimal' as const,
    contentStyle: { backgroundColor: theme.colors.bg },
  };

  if (status === 'loading') return <Loading />;

  return (
    <NavigationContainer theme={navigationTheme}>
      {status === 'guest' ? (
        <AuthStack.Navigator screenOptions={stackOptions}>
          <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Criar conta' }} />
        </AuthStack.Navigator>
      ) : !isClient(user) && !isStaff(user) ? (
        <UnsupportedScreen />
      ) : (
        <RootStack.Navigator screenOptions={stackOptions}>
          <RootStack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
          <RootStack.Screen name="RequestDetail" component={RequestDetailScreen} options={{ title: 'Serviço' }} />
          <RootStack.Screen name="NewRequest" component={NewRequestScreen} options={{ title: 'Pedir serviço' }} />
          <RootStack.Screen name="ChatThread" component={StaffChatScreen} options={({ route }) => ({ title: route.params.title })} />
          <RootStack.Screen name="Vehicles" component={VehiclesScreen} options={{ title: 'Meus veículos' }} />
          <RootStack.Screen name="VehicleForm" component={VehicleFormScreen} options={{ title: 'Veículo' }} />
          <RootStack.Screen name="Invoices" component={InvoicesScreen} options={{ title: 'Notas de serviço' }} />
          <RootStack.Screen name="Payments" component={PaymentsScreen} options={{ title: 'Pagamentos' }} />
          <RootStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notificações' }} />
          <RootStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Meus dados' }} />
          <RootStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Trocar senha' }} />
          <RootStack.Screen name="CustomerForm" component={CustomerFormScreen} options={{ title: 'Novo cliente' }} />
        </RootStack.Navigator>
      )}
    </NavigationContainer>
  );
}
