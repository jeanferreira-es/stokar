import { Eye, EyeOff, Search } from 'lucide-react';
import {
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import * as S from './Form.styles';

export const Input = S.Input;
export const Textarea = S.Textarea;
/** Select nativo estilizado: funciona direto com react-hook-form e abre o seletor do sistema no celular. */
export const Select = S.Select;
export const FormGrid = S.FormGrid;
export const FormStack = S.FormStack;
export const ErrorText = S.ErrorText;

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

/** Rótulo + controle + mensagem de erro, já ligados por id/aria. */
export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId();
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
      })
    : children;

  return (
    <S.FieldRoot>
      <S.Label htmlFor={id}>{label}</S.Label>
      {control}
      {error ? (
        <S.ErrorText id={`${id}-error`} role="alert">
          {error}
        </S.ErrorText>
      ) : (
        hint && <S.Hint id={`${id}-hint`}>{hint}</S.Hint>
      )}
    </S.FieldRoot>
  );
}

export function SearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <S.SearchWrap>
      <Search aria-hidden />
      <S.Input type="search" aria-label={props.placeholder ?? 'Buscar'} {...props} />
    </S.SearchWrap>
  );
}

/**
 * Campo de senha com o "olhinho" para conferir o que foi digitado.
 * Aceita as mesmas props do <Input> (inclusive o `register` do react-hook-form).
 */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>>(
  function PasswordInput(props, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <S.PasswordWrap>
        <S.Input ref={ref} type={visible ? 'text' : 'password'} {...props} />
        <S.PasswordToggle
          type="button"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
        </S.PasswordToggle>
      </S.PasswordWrap>
    );
  },
);
