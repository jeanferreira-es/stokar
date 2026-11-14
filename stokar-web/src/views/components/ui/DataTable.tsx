import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PageMeta } from '@/models/types';
import { Button } from './Button';
import * as S from './DataTable.styles';
import { Card, Skeleton } from './Primitives';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right';
  numeric?: boolean;
  /** Coluna que vira o título do cartão no celular. */
  primary?: boolean;
  /** Coluna de botões: no celular fica no rodapé do cartão, sem rótulo. */
  actions?: boolean;
}

interface DataTableProps<T> {
  columns: Array<Column<T>>;
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  loading?: boolean;
  empty: ReactNode;
  meta?: PageMeta;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
}

export const CellTitle = S.CellTitle;
export const RowActions = S.RowActions;

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  empty,
  meta,
  onPageChange,
  onRowClick,
}: DataTableProps<T>) {
  if (!loading && rows && rows.length === 0) {
    return <Card>{empty}</Card>;
  }

  return (
    <S.Wrap>
      <S.Scroll>
        <S.Table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" data-align={c.align}>
                  {c.actions ? <span aria-hidden /> : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading || !rows
              ? Array.from({ length: 6 }, (_, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c.key} data-label={c.header} data-primary={c.primary || undefined}>
                        <Skeleton $w={c.primary ? '70%' : '60px'} />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => (
                  <S.Row
                    key={rowKey(row)}
                    $clickable={!!onRowClick}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        data-label={c.header}
                        data-align={c.align}
                        data-numeric={c.numeric || undefined}
                        data-primary={c.primary || undefined}
                        data-actions={c.actions || undefined}
                        onClick={c.actions ? (e) => e.stopPropagation() : undefined}
                      >
                        {c.cell(row)}
                      </td>
                    ))}
                  </S.Row>
                ))}
          </tbody>
        </S.Table>
      </S.Scroll>

      {meta && onPageChange && meta.totalPages > 1 && (
        <S.Pagination aria-label="Paginação">
          <span>
            Página {meta.page} de {meta.totalPages} ({meta.total} registros)
          </span>
          <div>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
              aria-label="Página anterior"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange(meta.page + 1)}
              aria-label="Próxima página"
            >
              <ChevronRight />
            </Button>
          </div>
        </S.Pagination>
      )}
    </S.Wrap>
  );
}
