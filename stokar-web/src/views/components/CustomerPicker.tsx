import { ChevronsUpDown, X } from 'lucide-react';
import { useState } from 'react';
import { useCustomerSearch } from '@/controllers/shared';
import type { Customer } from '@/models/types';
import { formatDocument } from '@/utils/format';
import * as S from './ProductPicker.styles';
import { Button, Input, Popover, PopoverContent, PopoverTrigger } from './ui';

export type PickedCustomer = Pick<Customer, 'id' | 'name' | 'tradeName' | 'document'>;

interface CustomerPickerProps {
  value: PickedCustomer | null;
  onChange: (customer: PickedCustomer | null) => void;
  placeholder?: string;
  /** Permite limpar a escolha (solicitação interna, sem cliente). */
  clearable?: boolean;
  disabled?: boolean;
  id?: string;
  'aria-invalid'?: boolean;
}

/** Combobox de clientes com busca na API (nome, fantasia, CPF/CNPJ ou e-mail). */
export function CustomerPicker({
  value,
  onChange,
  placeholder = 'Selecione um cliente',
  clearable,
  disabled,
  ...aria
}: CustomerPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useCustomerSearch(search, open);

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <S.Trigger type="button" role="combobox" aria-expanded={open} disabled={disabled} {...aria}>
            {value ? <span>{value.tradeName || value.name}</span> : <span data-placeholder>{placeholder}</span>}
            <ChevronsUpDown aria-hidden />
          </S.Trigger>
        </PopoverTrigger>
        <PopoverContent align="start" width={420}>
          <S.SearchBox>
            <Input
              autoFocus
              placeholder="Buscar por nome, CPF/CNPJ ou e-mail"
              aria-label="Buscar cliente"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </S.SearchBox>
          {isLoading && <S.Note>Buscando…</S.Note>}
          {data?.length === 0 && <S.Note>Nenhum cliente ativo encontrado.</S.Note>}
          {data && data.length > 0 && (
            <S.Options>
              {data.map((c) => (
                <li key={c.id}>
                  <S.Option
                    type="button"
                    onClick={() => {
                      onChange(c);
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <div>
                      <strong>{c.tradeName || c.name}</strong>
                      <small>{c.tradeName ? c.name : c.email}</small>
                    </div>
                    <em>{formatDocument(c.document)}</em>
                  </S.Option>
                </li>
              ))}
            </S.Options>
          )}
        </PopoverContent>
      </Popover>
      {clearable && value && !disabled && (
        <Button variant="ghost" size="icon" aria-label="Remover cliente" onClick={() => onChange(null)}>
          <X />
        </Button>
      )}
    </div>
  );
}
