import type { ComponentProps, ReactNode } from 'react';
import * as S from './Primitives.styles';

export const Badge = S.Badge;
export const IconBubble = S.IconBubble;
export const Card = S.Card;
export const CardHeader = S.CardHeader;
export const CardTitle = S.CardTitle;
export const Avatar = S.Avatar;
export const Skeleton = S.Skeleton;
export const PageHeader = S.PageHeader;
export const HeaderActions = S.HeaderActions;
export const Toolbar = S.Toolbar;
export const Muted = S.Muted;
export const Stack = S.Stack;

export function Switch(props: ComponentProps<typeof S.SwitchRoot>) {
  return (
    <S.SwitchRoot {...props}>
      <S.SwitchThumb />
    </S.SwitchRoot>
  );
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  label: string;
}

export function Segmented<T extends string>({ value, onChange, options, label }: SegmentedProps<T>) {
  return (
    <S.Segmented role="tablist" aria-label={label}>
      {options.map((option) => (
        <S.SegmentedItem
          key={option.value}
          role="tab"
          aria-selected={option.value === value}
          $active={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </S.SegmentedItem>
      ))}
    </S.Segmented>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <S.Empty>
      {icon && <S.IconBubble $size={52}>{icon}</S.IconBubble>}
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action}
    </S.Empty>
  );
}
