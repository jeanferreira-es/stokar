import { useQuery } from '@tanstack/react-query';
import { isManager } from '@/models/permissions';
import { settingsService } from '@/models/services/api';
import type { CompanySettings } from '@/models/types';
import { useAuth, useCurrentUser } from './AuthController';
import { keys, useAction } from './shared';
import { useThemeMode } from './ThemeController';
import { useDesktopNotifications } from './useNotificationsController';

export function useSettingsController() {
  const user = useCurrentUser();
  const { updateProfile, changePassword } = useAuth();
  const theme = useThemeMode();
  const desktop = useDesktopNotifications();

  const saveName = useAction((name: string) => updateProfile({ name }), { success: 'Nome atualizado' });
  const toggleEmail = useAction((emailNotifications: boolean) => updateProfile({ emailNotifications }), {
    success: 'Preferência salva',
  });
  const savePassword = useAction(changePassword, {
    success: 'Senha alterada. As outras sessões foram encerradas.',
  });

  // Dados da oficina (cabeçalho das notas e contato no aplicativo): só gestores editam
  const manager = isManager(user);
  const company = useQuery({
    queryKey: [...keys.settings, 'company'],
    queryFn: () => settingsService.company(),
    enabled: manager,
  });
  const saveCompany = useAction((input: Partial<CompanySettings>) => settingsService.updateCompany(input), {
    invalidate: [keys.settings],
    success: 'Dados da oficina salvos',
  });

  return {
    canEditCompany: manager,
    company: company.data,
    saveCompany: (input: Partial<CompanySettings>) => saveCompany.mutate(input),
    savingCompany: saveCompany.isPending,
    user,
    theme,
    desktop,
    saveName: (name: string) => saveName.mutate(name),
    savingName: saveName.isPending,
    toggleEmail: (value: boolean) => toggleEmail.mutate(value),
    togglingEmail: toggleEmail.isPending,
    savePassword: (data: { currentPassword: string; newPassword: string }) => savePassword.mutateAsync(data),
    savingPassword: savePassword.isPending,
  };
}
