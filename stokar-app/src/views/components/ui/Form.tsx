import { ChevronDown, Eye, EyeOff } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, type TextInputProps } from 'react-native';
import { useTheme } from 'styled-components/native';
import * as S from './Form.styles';
import { Label } from './Text';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

/** Rótulo + controle + mensagem de erro ou dica. */
export function Field({ label, error, hint, children }: FieldProps) {
  return (
    <S.FieldRoot>
      <Label>{label}</Label>
      {children}
      {error ? <S.ErrorText accessibilityRole="alert">{error}</S.ErrorText> : hint ? <S.Hint>{hint}</S.Hint> : null}
    </S.FieldRoot>
  );
}

export interface InputProps extends TextInputProps {
  invalid?: boolean;
}

export function Input({ invalid, multiline, ...rest }: InputProps) {
  const theme = useTheme();
  return (
    <S.Input
      $invalid={invalid}
      $multiline={multiline}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      placeholderTextColor={theme.colors.textSubtle}
      selectionColor={theme.colors.primary}
      {...rest}
    />
  );
}

/** Campo com rótulo já embutido: o caso mais comum nos formulários. */
export function TextField({ label, error, hint, ...rest }: InputProps & { label: string; error?: string; hint?: string }) {
  return (
    <Field label={label} error={error} hint={hint}>
      <Input invalid={!!error} accessibilityLabel={label} {...rest} />
    </Field>
  );
}

/** Campo de senha com o "olhinho" para conferir o que foi digitado. */
export function PasswordField({
  label,
  error,
  hint,
  style,
  ...rest
}: Omit<InputProps, 'secureTextEntry'> & { label: string; error?: string; hint?: string }) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return (
    <Field label={label} error={error} hint={hint}>
      <S.PasswordWrap>
        <Input
          invalid={!!error}
          accessibilityLabel={label}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          style={[{ paddingRight: theme.touch }, style]}
          {...rest}
        />
        <S.PasswordToggle
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
          accessibilityState={{ selected: visible }}
          hitSlop={4}
          onPress={() => setVisible((v) => !v)}
        >
          <Icon size={20} color={theme.colors.textSubtle} />
        </S.PasswordToggle>
      </S.PasswordWrap>
    </Field>
  );
}

/** "Select": mostra o valor escolhido e abre uma lista (Sheet) ao tocar. */
export function SelectButton(props: { value?: string; placeholder: string; onPress: () => void; disabled?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={props.onPress} disabled={props.disabled}>
      {({ pressed }) => (
        <S.SelectTrigger $pressed={pressed} style={{ opacity: props.disabled ? 0.5 : 1 }}>
          <S.SelectValue $placeholder={!props.value} numberOfLines={1}>
            {props.value || props.placeholder}
          </S.SelectValue>
          <ChevronDown size={18} color={theme.colors.textSubtle} />
        </S.SelectTrigger>
      )}
    </Pressable>
  );
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}

export function Segmented<T extends string>({ value, onChange, options }: SegmentedProps<T>) {
  return (
    <S.SegmentedRoot accessibilityRole="tablist">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={{ flex: 1 }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
          >
            <S.SegmentedItem $active={active}>
              <S.SegmentedLabel $active={active}>{option.label}</S.SegmentedLabel>
            </S.SegmentedItem>
          </Pressable>
        );
      })}
    </S.SegmentedRoot>
  );
}
