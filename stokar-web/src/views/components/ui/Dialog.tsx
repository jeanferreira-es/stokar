import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import * as S from './Dialog.styles';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, title, description, size = 'md', children }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <S.Overlay />
        <S.Content $size={size} aria-describedby={description ? undefined : undefined}>
          <S.Header>
            <div>
              <S.Title>{title}</S.Title>
              {description && <S.Description>{description}</S.Description>}
            </div>
            <RadixDialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Fechar">
                <X />
              </Button>
            </RadixDialog.Close>
          </S.Header>
          <S.Body>{children}</S.Body>
        </S.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export const DialogFooter = S.Footer;

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  danger,
  loading,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} description={description} size="sm">
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Voltar
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
