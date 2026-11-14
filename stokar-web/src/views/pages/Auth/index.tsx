import { ArrowDownToLine, BellRing, ClipboardList, Moon, Sun } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useAuth } from '@/controllers/AuthController';
import { useThemeMode } from '@/controllers/ThemeController';
import { errorMessage } from '@/models/services/http';
import { Logo } from '../../components/Logo';
import { Button, Field, FormStack, Input, PasswordInput } from '../../components/ui';
import * as S from './Auth.styles';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AuthScreen({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { mode, toggle } = useThemeMode();
  return (
    <S.Screen>
      <S.Brand>
        <S.BrandLogo>
          <Logo size={46} />
        </S.BrandLogo>
        <div>
          <S.Flow>
            <li>
              <ArrowDownToLine aria-hidden /> Entradas, saídas e ajustes com histórico
            </li>
            <li>
              <ClipboardList aria-hidden /> Solicitações de serviço com baixa automática
            </li>
            <li>
              <BellRing aria-hidden /> Alertas quando o estoque chega ao mínimo
            </li>
          </S.Flow>
          <h1>Tudo que entra e sai, no lugar certo.</h1>
          <p>Controle do almoxarifado para equipes de manutenção e operação.</p>
        </div>
      </S.Brand>

      <S.Panel>
        <S.ThemeCorner>
          <Button
            variant="secondary"
            size="icon"
            onClick={toggle}
            aria-label={mode === 'dark' ? 'Mudar para o modo claro' : 'Mudar para o modo escuro'}
          >
            {mode === 'dark' ? <Sun /> : <Moon />}
          </Button>
        </S.ThemeCorner>
        <S.FormBox>
          <S.MobileLogo>
            <Logo size={44} />
          </S.MobileLogo>
          <h2>{title}</h2>
          <p>{subtitle}</p>
          {children}
        </S.FormBox>
      </S.Panel>
    </S.Screen>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string; password: string }>();

  const onSubmit = handleSubmit(async (values) => {
    setError('');
    try {
      await login(values);
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <AuthScreen title="Entrar no Stokar" subtitle="Use o e-mail e a senha da sua conta.">
      <FormStack onSubmit={onSubmit} noValidate>
        {error && <S.FormError role="alert">{error}</S.FormError>}
        <Field label="E-mail" error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            {...register('email', { required: 'Informe seu e-mail', pattern: { value: EMAIL_PATTERN, message: 'E-mail inválido' } })}
          />
        </Field>
        <Field label="Senha" error={errors.password?.message}>
          <PasswordInput
            autoComplete="current-password"
            {...register('password', { required: 'Informe sua senha' })}
          />
        </Field>
        <Button type="submit" loading={isSubmitting} fullWidth>
          Entrar
        </Button>
      </FormStack>
      <S.Switch>
        Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
      </S.Switch>
    </AuthScreen>
  );
}

export function RegisterPage() {
  const { register: signUp } = useAuth();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ name: string; email: string; password: string; confirmPassword: string }>();

  const onSubmit = handleSubmit(async ({ confirmPassword: _confirm, ...values }) => {
    setError('');
    try {
      await signUp(values);
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <AuthScreen
      title="Criar conta"
      subtitle="A primeira conta criada vira administradora. As seguintes entram como solicitantes."
    >
      <FormStack onSubmit={onSubmit} noValidate>
        {error && <S.FormError role="alert">{error}</S.FormError>}
        <Field label="Nome" error={errors.name?.message}>
          <Input
            autoComplete="name"
            {...register('name', { validate: (v) => v.trim().length >= 2 || 'Informe seu nome' })}
          />
        </Field>
        <Field label="E-mail" error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            {...register('email', { required: 'Informe seu e-mail', pattern: { value: EMAIL_PATTERN, message: 'E-mail inválido' } })}
          />
        </Field>
        <Field label="Senha" error={errors.password?.message} hint="Ao menos 8 caracteres">
          <PasswordInput
            autoComplete="new-password"
            {...register('password', {
              required: 'Crie uma senha',
              minLength: { value: 8, message: 'A senha deve ter ao menos 8 caracteres' },
              maxLength: { value: 72, message: 'A senha pode ter até 72 caracteres' },
              // Se a senha mudar depois de confirmada, a confirmação é conferida de novo
              deps: ['confirmPassword'],
            })}
          />
        </Field>
        <Field label="Repita a senha" error={errors.confirmPassword?.message}>
          <PasswordInput
            autoComplete="new-password"
            {...register('confirmPassword', {
              required: 'Repita a senha',
              validate: (value, form) => value === form.password || 'As senhas não são iguais',
            })}
          />
        </Field>
        <Button type="submit" loading={isSubmitting} fullWidth>
          Criar conta
        </Button>
      </FormStack>
      <S.Switch>
        Já tem conta? <Link to="/login">Entrar</Link>
      </S.Switch>
    </AuthScreen>
  );
}
