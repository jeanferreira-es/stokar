import { ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { useProductSearch } from '@/controllers/shared';
import type { Product } from '@/models/types';
import { formatQuantity } from '@/utils/format';
import * as S from './ProductPicker.styles';
import { Input, Popover, PopoverContent, PopoverTrigger } from './ui';

interface ProductPickerProps {
  value: Product | null;
  onChange: (product: Product) => void;
  placeholder?: string;
  /** Produtos que não devem aparecer (ex.: já adicionados à solicitação). */
  excludeIds?: string[];
  id?: string;
  'aria-invalid'?: boolean;
}

/** Combobox de produtos com busca na API (nome ou SKU). */
export function ProductPicker({
  value,
  onChange,
  placeholder = 'Selecione um produto',
  excludeIds = [],
  ...aria
}: ProductPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useProductSearch(search, open);
  const options = data?.filter((p) => !excludeIds.includes(p.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <S.Trigger type="button" role="combobox" aria-expanded={open} {...aria}>
          {value ? (
            <span>
              {value.name} ({value.sku})
            </span>
          ) : (
            <span data-placeholder>{placeholder}</span>
          )}
          <ChevronsUpDown aria-hidden />
        </S.Trigger>
      </PopoverTrigger>
      <PopoverContent align="start" width={420}>
        <S.SearchBox>
          <Input
            autoFocus
            placeholder="Buscar por nome ou SKU"
            aria-label="Buscar produto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </S.SearchBox>
        {isLoading && <S.Note>Buscando…</S.Note>}
        {options?.length === 0 && <S.Note>Nenhum produto ativo encontrado.</S.Note>}
        {options && options.length > 0 && (
          <S.Options>
            {options.map((p) => (
              <li key={p.id}>
                <S.Option
                  type="button"
                  onClick={() => {
                    onChange(p);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <div>
                    <strong>{p.name}</strong>
                    <small>{p.sku}</small>
                  </div>
                  <em>{formatQuantity(p.quantity, p.unit)}</em>
                </S.Option>
              </li>
            ))}
          </S.Options>
        )}
      </PopoverContent>
    </Popover>
  );
}
