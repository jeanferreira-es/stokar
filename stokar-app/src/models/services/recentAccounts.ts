import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Contas que já entraram neste aparelho, para o atalho da tela de login.
 * Guarda só nome e e-mail (nunca a senha) e no máximo 4 contas, da mais recente para a mais antiga.
 */
export interface RecentAccount {
  email: string;
  name: string;
}

const KEY = 'stokar.recentAccounts';
const MAX = 4;

export const recentAccounts = {
  async list(): Promise<RecentAccount[]> {
    try {
      const saved = await AsyncStorage.getItem(KEY);
      const parsed = saved ? (JSON.parse(saved) as RecentAccount[]) : [];
      return Array.isArray(parsed) ? parsed.filter((a) => a && typeof a.email === 'string').slice(0, MAX) : [];
    } catch {
      return [];
    }
  },

  async remember(account: RecentAccount): Promise<void> {
    const email = account.email.trim().toLowerCase();
    const current = await recentAccounts.list();
    const next = [{ email, name: account.name }, ...current.filter((a) => a.email !== email)].slice(0, MAX);
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* atalho é só conveniência */
    }
  },

  async forget(email: string): Promise<RecentAccount[]> {
    const next = (await recentAccounts.list()).filter((a) => a.email !== email);
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    return next;
  },
};
