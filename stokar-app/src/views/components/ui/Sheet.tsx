import { Check } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';
import { ListItem } from './Primitives';
import * as S from './Sheet.styles';
import { Muted, Subheading } from './Text';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

/** Painel que sobe do rodapé: substitui diálogos e menus do site. */
export function Sheet({ visible, onClose, title, description, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <S.Root>
          <S.Backdrop onPress={onClose} accessibilityLabel="Fechar" />
          <S.Panel $inset={insets.bottom}>
            <S.Handle />
            <S.Header>
              <Subheading>{title}</Subheading>
              {description && <Muted>{description}</Muted>}
            </S.Header>
            {children}
          </S.Panel>
        </S.Root>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const SheetBody = S.Body;

export interface Option<T> {
  key: string;
  label: string;
  description?: string;
  right?: string;
  value: T;
}

interface OptionsSheetProps<T> extends Omit<SheetProps, 'children'> {
  options: Array<Option<T>>;
  selectedKey?: string | null;
  onSelect: (value: T) => void;
  /** Conteúdo acima da lista (ex.: campo de busca). */
  header?: ReactNode;
  emptyText?: string;
  footer?: ReactNode;
}

/** Lista de opções em um painel (o "select" do app). */
export function OptionsSheet<T>({ options, selectedKey, onSelect, header, emptyText, footer, ...sheet }: OptionsSheetProps<T>) {
  const theme = useTheme();
  return (
    <Sheet {...sheet}>
      {header && <S.Body>{header}</S.Body>}
      <FlatList
        data={options}
        keyExtractor={(option) => option.key}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <ListItem
            title={item.label}
            subtitle={item.description}
            chevron={false}
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {item.right ? <Muted>{item.right}</Muted> : null}
                {item.key === selectedKey ? <Check size={18} color={theme.colors.primaryText} /> : null}
              </View>
            }
            onPress={() => onSelect(item.value)}
          />
        )}
        ListEmptyComponent={emptyText ? <Muted style={{ padding: 16, textAlign: 'center' }}>{emptyText}</Muted> : undefined}
      />
      {footer && <S.Body>{footer}</S.Body>}
    </Sheet>
  );
}
