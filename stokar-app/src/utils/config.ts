import Constants from 'expo-constants';

/** Versão do app (app.json → expo.version), exibida na tela Conta. */
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

/** Endereço público da política de privacidade (POLITICA_DE_PRIVACIDADE.md publicada pelo GitHub Pages). */
export const PRIVACY_POLICY_URL =
  process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ?? 'https://jeanferreira-es.github.io/stokar/stokar-app/POLITICA_DE_PRIVACIDADE.html';
