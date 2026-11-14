import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CustomerSummary, Vehicle } from '@/models/types';

/** Telas empilhadas sobre as abas (iguais para cliente e equipe; cada perfil usa as suas). */
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabsParamList> | undefined;
  RequestDetail: { id: string };
  NewRequest: { customer?: CustomerSummary } | undefined;
  /** Equipe: conversa com um cliente */
  ChatThread: { conversationId: string; title: string };
  Vehicles: undefined;
  VehicleForm: { vehicle?: Vehicle } | undefined;
  Invoices: undefined;
  /** Cliente: pagamentos pendentes, chave PIX e códigos copia e cola */
  Payments: undefined;
  Notifications: undefined;
  Profile: undefined;
  ChangePassword: undefined;
  /** Equipe: cadastro rápido de cliente durante o registro de um serviço */
  CustomerForm: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type TabsParamList = {
  Services: undefined;
  Chat: undefined;
  Account: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<AuthStackParamList, T>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
