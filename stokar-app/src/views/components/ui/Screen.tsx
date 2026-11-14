import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';
import * as S from './Screen.styles';

interface ScreenProps {
  children: ReactNode;
  /** Conteúdo rolável com espaçamento padrão (padrão). Use `false` para telas com lista própria. */
  scroll?: boolean;
  /** Barra fixa no rodapé (botões de ação). */
  footer?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Aplica a área segura no topo (telas sem cabeçalho de navegação). */
  topInset?: boolean;
}

/** Moldura das telas: fundo do tema, teclado, área segura e "puxar para atualizar". */
export function Screen({ children, scroll = true, footer, refreshing, onRefresh, topInset }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <S.Root style={topInset ? { paddingTop: insets.top } : undefined}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: theme.space(4),
              paddingBottom: theme.space(8) + (footer ? 0 : insets.bottom),
              gap: theme.space(4),
            }}
            refreshControl={
              onRefresh ? (
                <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
        {footer && <S.Footer $inset={insets.bottom}>{footer}</S.Footer>}
      </KeyboardAvoidingView>
    </S.Root>
  );
}
