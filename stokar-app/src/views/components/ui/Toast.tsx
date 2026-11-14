import { CircleAlert, CircleCheck } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled, { useTheme } from 'styled-components/native';

export interface ToastData {
  message: string;
  tone: 'success' | 'danger';
}

const Root = styled.View<{ $top: number }>`
  position: absolute;
  top: ${({ $top }) => $top + 8}px;
  left: ${({ theme }) => theme.space(4)}px;
  right: ${({ theme }) => theme.space(4)}px;
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)}px;
  padding: ${({ theme }) => theme.space(3.5)}px ${({ theme }) => theme.space(4)}px;
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => (theme.mode === 'dark' ? theme.colors.surfaceAlt : theme.colors.text)};
  elevation: 6;
`;

const Message = styled.Text`
  flex: 1;
  font-family: ${({ theme }) => theme.fonts.medium};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => (theme.mode === 'dark' ? theme.colors.text : theme.colors.surface)};
`;

export function Toast({ message, tone, onDismiss }: ToastData & { onDismiss: () => void }) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const Icon = tone === 'success' ? CircleCheck : CircleAlert;
  // Sobre o fundo escuro do aviso, usa os tons claros de sucesso/erro
  const color = tone === 'success' ? '#5FCB8E' : '#FF7D6B';
  return (
    <Pressable onPress={onDismiss} accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
      <Root $top={insets.top} style={{ shadowColor: theme.colors.text, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }}>
        <Icon size={20} color={color} />
        <Message>{message}</Message>
      </Root>
    </Pressable>
  );
}
