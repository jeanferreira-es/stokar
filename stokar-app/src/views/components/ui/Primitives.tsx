import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useTheme } from 'styled-components/native';
import type { Tone } from '@/models/labels';
import { initials } from '@/utils/format';
import * as S from './Primitives.styles';
import { Body, Muted, Strong, Subheading } from './Text';

export const Card = S.Card;
export const Row = S.Row;
export const Stack = S.Stack;
export const Fill = S.Fill;
export const Divider = S.Divider;
export const Group = S.Group;

export function Badge({ label, tone }: { label: string; tone?: Tone }) {
  return (
    <S.BadgeRoot $tone={tone}>
      <S.BadgeLabel $tone={tone}>{label}</S.BadgeLabel>
    </S.BadgeRoot>
  );
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <S.AvatarRoot $size={size}>
      <S.AvatarLabel $size={size}>{initials(name)}</S.AvatarLabel>
    </S.AvatarRoot>
  );
}

export function Counter({ value }: { value: number }) {
  if (value <= 0) return null;
  return (
    <S.Counter accessibilityLabel={`${value} não lidas`}>
      <S.CounterLabel>{value > 99 ? '99+' : value}</S.CounterLabel>
    </S.Counter>
  );
}

export function IconBubble({ icon: Icon, tone = 'primary', size = 40 }: { icon: LucideIcon; tone?: Tone; size?: number }) {
  const theme = useTheme();
  return (
    <S.IconBubble $tone={tone} $size={size}>
      <Icon size={Math.round(size * 0.48)} color={S.toneColors(theme, tone).fg} />
    </S.IconBubble>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <S.Empty>
      <IconBubble icon={icon} size={56} />
      <Subheading style={{ textAlign: 'center' }}>{title}</Subheading>
      {description && <S.EmptyText>{description}</S.EmptyText>}
      {action}
    </S.Empty>
  );
}

export function Loading() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <ActivityIndicator color={theme.colors.primary} />
    </View>
  );
}

/** Filtro em forma de pílula (ex.: status na lista de serviços). */
export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress}>
      <S.ChipRoot $active={active}>
        <S.ChipLabel $active={active}>{label}</S.ChipLabel>
      </S.ChipRoot>
    </Pressable>
  );
}

export function Callout({ icon: Icon, tone, title, children }: { icon: LucideIcon; tone: Tone; title?: string; children?: ReactNode }) {
  const theme = useTheme();
  const color = S.toneColors(theme, tone).fg;
  return (
    <S.Callout $tone={tone}>
      <Icon size={18} color={color} style={{ marginTop: 2 }} />
      <Fill>
        {title && <Strong style={{ color }}>{title}</Strong>}
        {typeof children === 'string' ? <Body>{children}</Body> : children}
      </Fill>
    </S.Callout>
  );
}

interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  tone?: Tone;
  left?: ReactNode;
  right?: ReactNode;
  /** Mostra a seta de navegação (padrão quando há onPress e nenhum `right`). */
  chevron?: boolean;
  danger?: boolean;
  onPress?: () => void;
}

/** Linha de lista/menu, com ícone à esquerda e conteúdo opcional à direita. */
export function ListItem({ title, subtitle, icon, tone = 'neutral', left, right, chevron, danger, onPress }: ListItemProps) {
  const theme = useTheme();
  const showChevron = chevron ?? (!!onPress && !right);
  const content = (pressed: boolean) => (
    <S.ListItemRoot $pressed={pressed}>
      {left ?? (icon ? <IconBubble icon={icon} tone={danger ? 'danger' : tone} size={36} /> : null)}
      <Fill>
        <Strong numberOfLines={1} style={danger ? { color: theme.colors.danger } : undefined}>
          {title}
        </Strong>
        {subtitle ? <Muted numberOfLines={2}>{subtitle}</Muted> : null}
      </Fill>
      {right}
      {showChevron && <ChevronRight size={18} color={theme.colors.textSubtle} />}
    </S.ListItemRoot>
  );
  if (!onPress) return content(false);
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {({ pressed }) => content(pressed)}
    </Pressable>
  );
}

/** Par "rótulo: valor" usado nos detalhes. */
export function Fact({ label, value }: { label: string; value: string }) {
  return (
    <Row $between $top>
      <Muted>{label}</Muted>
      <Body style={{ flex: 1, textAlign: 'right' }}>{value}</Body>
    </Row>
  );
}
