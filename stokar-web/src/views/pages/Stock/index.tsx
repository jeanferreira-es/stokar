import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, SlidersHorizontal, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStockController } from '@/controllers/useStockController';
import { MOVEMENT_LABEL, MOVEMENT_TONE, MOVEMENT_TYPES } from '@/models/labels';
import type { MovementType, StockMovement } from '@/models/types';
import { formatCurrency, formatDateTime, formatQuantity } from '@/utils/format';
import { MovementDialog } from '../../components/MovementDialog';
import { ProductPicker } from '../../components/ProductPicker';
import {
  Badge,
  Button,
  CellTitle,
  DataTable,
  EmptyState,
  HeaderActions,
  Input,
  PageHeader,
  Segmented,
  Toolbar,
  type Column,
} from '../../components/ui';
import * as S from './Stock.styles';

const SIGN: Record<MovementType, string> = { IN: '+', OUT: '−', ADJUSTMENT: '=' };

const columns: Array<Column<StockMovement>> = [
  {
    key: 'product',
    header: 'Produto',
    primary: true,
    cell: (m) => (
      <CellTitle>
        <strong>{m.product?.name ?? '—'}</strong>
        <span>{m.product?.sku}</span>
      </CellTitle>
    ),
  },
  { key: 'type', header: 'Tipo', cell: (m) => <Badge $tone={MOVEMENT_TONE[m.type]}>{MOVEMENT_LABEL[m.type]}</Badge> },
  {
    key: 'quantity',
    header: 'Quantidade',
    align: 'right',
    numeric: true,
    cell: (m) => (
      <strong>
        {SIGN[m.type]} {formatQuantity(m.quantity, m.product?.unit)}
      </strong>
    ),
  },
  {
    key: 'balance',
    header: 'Saldo',
    align: 'right',
    numeric: true,
    cell: (m) => `${formatQuantity(m.balanceBefore)} → ${formatQuantity(m.balanceAfter)}`,
  },
  {
    key: 'cost',
    header: 'Custo unit.',
    align: 'right',
    numeric: true,
    cell: (m) => (m.unitCost !== null ? formatCurrency(m.unitCost) : '—'),
  },
  {
    key: 'origin',
    header: 'Origem',
    cell: (m) =>
      m.serviceRequest ? (
        <S.RequestLink as={Link} to={`/solicitacoes/${m.serviceRequest.id}`}>
          {m.serviceRequest.code}
        </S.RequestLink>
      ) : (
        (m.supplier?.name ?? m.document ?? m.reason ?? '—')
      ),
  },
  { key: 'user', header: 'Por', cell: (m) => m.user?.name ?? '—' },
  { key: 'date', header: 'Quando', cell: (m) => formatDateTime(m.createdAt) },
];

export function StockPage() {
  const c = useStockController();

  return (
    <>
      <PageHeader>
        <div>
          <h1>Movimentações</h1>
          <p>Histórico de entradas, saídas e ajustes. Cada lançamento guarda o saldo antes e depois.</p>
        </div>
        <HeaderActions>
          {c.canAdjust && (
            <Button variant="outline" onClick={() => c.openCreate('ADJUSTMENT')}>
              <SlidersHorizontal /> Ajustar saldo
            </Button>
          )}
          <Button variant="secondary" onClick={() => c.openCreate('OUT')}>
            <ArrowUpFromLine /> Lançar saída
          </Button>
          <Button onClick={() => c.openCreate('IN')}>
            <ArrowDownToLine /> Lançar entrada
          </Button>
        </HeaderActions>
      </PageHeader>

      <Toolbar>
        <Segmented
          label="Tipo de movimentação"
          value={c.type}
          onChange={c.setType}
          options={[
            { value: 'ALL', label: 'Todas' },
            ...MOVEMENT_TYPES.map((t) => ({ value: t, label: `${MOVEMENT_LABEL[t]}s` })),
          ]}
        />
        <S.PickerSlot>
          <ProductPicker value={c.product} onChange={c.setProduct} placeholder="Todos os produtos" />
          {c.product && (
            <Button variant="ghost" size="icon" aria-label="Limpar produto" onClick={() => c.setProduct(null)}>
              <X />
            </Button>
          )}
        </S.PickerSlot>
        <S.DateRange>
          <Input type="date" aria-label="De" value={c.from} max={c.to || undefined} onChange={(e) => c.setFrom(e.target.value)} />
          <span>até</span>
          <Input type="date" aria-label="Até" value={c.to} min={c.from || undefined} onChange={(e) => c.setTo(e.target.value)} />
        </S.DateRange>
      </Toolbar>

      <DataTable
        columns={columns}
        rows={c.rows}
        rowKey={(m) => m.id}
        loading={c.loading}
        meta={c.meta}
        onPageChange={c.setPage}
        empty={
          <EmptyState
            icon={<ArrowLeftRight />}
            title={c.hasFilters ? 'Nenhuma movimentação com esses filtros' : 'Nenhuma movimentação ainda'}
            description={
              c.hasFilters
                ? 'Mude o período, o tipo ou o produto.'
                : 'Lance a primeira entrada para registrar o que chegou ao almoxarifado.'
            }
          />
        }
      />

      {c.creating && <MovementDialog type={c.creating} onClose={c.closeCreate} />}
    </>
  );
}
