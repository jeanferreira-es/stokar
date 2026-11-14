import { Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold } from '@expo-google-fonts/barlow';
import { BarlowSemiCondensed_600SemiBold, BarlowSemiCondensed_700Bold } from '@expo-google-fonts/barlow-semi-condensed';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppDataProvider } from '@/contexts/AppDataContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useThemeMode } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { RootNavigator } from '@/navigation/RootNavigator';

// Mantém a tela de abertura até as fontes e a sessão estarem prontas
void SplashScreen.preventAutoHideAsync();

function Shell({ fontsReady }: { fontsReady: boolean }) {
  const { status } = useAuth();
  const { mode } = useThemeMode();
  const ready = fontsReady && status !== 'loading';

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );
}

/**
 * Raiz do app. Os dados globais ficam em contextos (Context API):
 * tema → sessão → avisos → dados compartilhados (oficina, cadastro, não lidas).
 */
export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    BarlowSemiCondensed_600SemiBold,
    BarlowSemiCondensed_700Bold,
  });

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppDataProvider>
              {/* Se uma fonte falhar, o app abre com a fonte do sistema */}
              <Shell fontsReady={fontsLoaded || !!fontError} />
            </AppDataProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
