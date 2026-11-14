import Constants from 'expo-constants';

/** Versão do app (app.json → expo.version), exibida na tela Conta. */
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

/** Endereço público da política de privacidade (o arquivo POLITICA_DE_PRIVACIDADE.md no GitHub). */
export const PRIVACY_POLICY_URL =
  process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ?? 'https://github.com/jeanferreira-es/stokar/blob/main/stokar-app/POLITICA_DE_PRIVACIDADE.md';
