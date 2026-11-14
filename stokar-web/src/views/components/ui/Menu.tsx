import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import * as RadixPopover from '@radix-ui/react-popover';
import type { ComponentProps, CSSProperties } from 'react';
import * as S from './Menu.styles';

/* ---------- DropdownMenu ---------- */
export const DropdownMenu = RadixMenu.Root;
export const DropdownMenuTrigger = RadixMenu.Trigger;
export const DropdownMenuItem = S.MenuItem;
export const DropdownMenuLabel = S.MenuLabel;
export const DropdownMenuSeparator = S.MenuSeparator;

export function DropdownMenuContent(props: ComponentProps<typeof S.MenuContent>) {
  return (
    <RadixMenu.Portal>
      <S.MenuContent align="end" sideOffset={8} collisionPadding={12} {...props} />
    </RadixMenu.Portal>
  );
}

/* ---------- Popover ---------- */
export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;
export const PopoverAnchor = RadixPopover.Anchor;
export const PopoverClose = RadixPopover.Close;

export function PopoverContent({
  width,
  style,
  ...props
}: ComponentProps<typeof S.PopoverContent> & { width?: number }) {
  return (
    <RadixPopover.Portal>
      <S.PopoverContent
        align="end"
        sideOffset={10}
        collisionPadding={12}
        style={{ ...(width ? ({ '--popover-width': `${width}px` } as CSSProperties) : {}), ...style }}
        {...props}
      />
    </RadixPopover.Portal>
  );
}
