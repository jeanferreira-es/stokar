import { Ban, ClipboardList, FileText, ReceiptText } from 'lucide-react';
import { useState } from 'react';
import { useInvoicesController } from '@/controllers/useWorkshopController';
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE } from '@/models/labels';
import type { Invoice, InvoiceStatus } from '@/models/types';
import { formatCurrency, formatDateTime } from '@/utils/format';
import {
  Badge,
  Button,
  CellTitle,
  DataTable,
  Dialog,
  DialogFooter,
  EmptyState,
  Field,
  FormStack,
  PageHeader,
  RowActions,
  SearchInput,
  Select,
  Textarea,
  Toolbar,
  type Column,
} from '../../components/ui';

export function InvoicesPage() {
  const c = useInvoicesController();

  const columns: Array<Column<Invoice>> = [
    {
      key: 'code',
      header: 'Nota',
      primary: true,
      cell: (i) => (
        <CellTitle>
          <strong>{i.code}</strong>
          <span>
            {i.reference.requestCode} — {i.reference.title}
          </span>
        </CellTitle>
      ),
    },
    { key: 'customer', header: 'Cliente', cell: (i) => i.recipient?.name ?? 'Não identificado' },
    { key: 'issued', header: 'Emissão', cell: (i) => formatDateTime(i.issuedAt) },
    { key: 'total', header: 'Total', align: 'right', numeric: true, cell: (i) => <strong>{formatCurrency(i.total)}</strong> },
    {
      key: 'status',
      header: 'Situação',
      cell: (i) => <Badge $tone={INVOICE_STATUS_TONE[i.status]}>{INVOICE_STATUS_LABEL[i.status]}</Badge>,
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      actions: true,
      cell: (i) => (
        <RowActions>
          <Button variant="ghost" size="icon" aria-label={`Abrir o PDF da nota ${i.code}`} loading={c.opening === i.id} onClick={() => c.openPdf(i)}>
            <FileText />
          </Button>
          <Button variant="ghost" size="icon" aria-label={`Ver a solicitação ${i.reference.requestCode}`} onClick={() => c.openRequest(i)}>
            <ClipboardList />
          </Button>
          {c.canCancel && i.status === 'ISSUED' && (
            <Button variant="ghost" size="icon" aria-label={`Cancelar a nota ${i.code}`} onClick={() => c.setCancelling(i)}>
              <Ban />
            </Button>
          )}
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <PageHeader>
        <div>
          <h1>Notas de serviço</h1>
          <p>Notas emitidas a partir das solicitações concluídas. São documentos sem valor fiscal.</p>
        </div>
      </PageHeader>

      <Toolbar>
        <SearchInput placeholder="Buscar por número, cliente ou serviço" value={c.search} onChange={(e) => c.setSearch(e.target.value)} />
        <Select aria-label="Situação" value={c.status} onChange={(e) => c.setStatus(e.target.value as InvoiceStatus | '')}>
          <option value="">Todas as situações</option>
          <option value="ISSUED">Emitidas</option>
          <option value="CANCELLED">Canceladas</option>
        </Select>
      </Toolbar>

      <DataTable
        columns={columns}
        rows={c.rows}
        rowKey={(i) => i.id}
        loading={c.loading}
        meta={c.meta}
        onPageChange={c.setPage}
        onRowClick={c.openPdf}
        empty={
          <EmptyState
            icon={<ReceiptText />}
            title={c.hasFilters ? 'Nenhuma nota encontrada' : 'Nenhuma nota emitida'}
            description={
              c.hasFilters
                ? 'Mude a busca ou a situação.'
                : 'Conclua uma solicitação e use "Emitir nota" na tela dela. A nota aparece aqui e no aplicativo do cliente.'
            }
          />
        }
      />

      {c.cancelling && (
        <CancelDialog
          invoice={c.cancelling}
          busy={c.cancelBusy}
          onConfirm={c.confirmCancel}
          onClose={() => c.setCancelling(null)}
        />
      )}
    </>
  );
}

function CancelDialog(props: { invoice: Invoice; busy: boolean; onConfirm: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && props.onClose()}
      title={`Cancelar a nota ${props.invoice.code}`}
      description="A nota continua no histórico, marcada como cancelada. A solicitação volta a poder ser corrigida e receber outra nota."
      size="sm"
    >
      <FormStack
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (reason.trim().length < 3) return setError('Explique o motivo do cancelamento');
          props.onConfirm(reason.trim());
        }}
      >
        <Field label="Motivo" error={error}>
          <Textarea
            autoFocus
            maxLength={2000}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError('');
            }}
          />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Voltar
          </Button>
          <Button type="submit" variant="danger" loading={props.busy}>
            Cancelar nota
          </Button>
        </DialogFooter>
      </FormStack>
    </Dialog>
  );
}
