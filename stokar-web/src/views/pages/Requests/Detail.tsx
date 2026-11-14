import {
  ArrowLeft,
  Ban,
  Check,
  CircleCheck,
  FileQuestion,
  FileText,
  Pencil,
  Play,
  ReceiptText,
  TriangleAlert,
  UserCheck,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useServiceRequestDetailController,
  type RequestDialog,
} from '@/controllers/useServiceRequestsController';
import { PRIORITY_LABEL, PRIORITY_TONE, STATUS_LABEL, STATUS_TONE } from '@/models/labels';
import type { ServiceRequest, User } from '@/models/types';
import { formatCurrency, formatDate, formatDateTime, formatDocument, formatQuantity, vehicleLabel } from '@/utils/format';
import { RequestFormDialog } from '../../components/RequestFormDialog';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  Dialog,
  DialogFooter,
  EmptyState,
  Field,
  FormStack,
  PageHeader,
  Select,
  Skeleton,
  Stack,
  Textarea,
} from '../../components/ui';
import * as S from './Requests.styles';

export function RequestDetailPage() {
  const { id = '' } = useParams();
  const c = useServiceRequestDetailController(id);
  const r = c.request;

  if (c.notFound) {
    return (
      <Card>
        <EmptyState
          icon={<FileQuestion />}
          title="Solicitação não encontrada"
          description="Ela pode ter sido removida ou você não tem acesso a ela."
          action={
            <Button variant="outline" asChild>
              <S.Back to="/solicitacoes" style={{ margin: 0 }}>
                Voltar para as solicitações
              </S.Back>
            </Button>
          }
        />
      </Card>
    );
  }

  if (c.loading || !r) {
    return (
      <Stack>
        <Skeleton $w="40%" $h="40px" />
        <Skeleton $h="320px" />
      </Stack>
    );
  }

  return (
    <>
      <S.Back to="/solicitacoes">
        <ArrowLeft aria-hidden /> Solicitações
      </S.Back>

      <PageHeader>
        <div>
          <S.Code>{r.code}</S.Code>
          <h1>{r.title}</h1>
          <S.TitleRow>
            <Badge $tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
            <Badge $tone={PRIORITY_TONE[r.priority]}>Prioridade {PRIORITY_LABEL[r.priority].toLowerCase()}</Badge>
          </S.TitleRow>
        </div>
      </PageHeader>

      <S.Layout>
        <Stack $gap={6}>
          {r.statusReason && (
            <S.Callout $tone={r.status === 'REJECTED' ? 'danger' : 'neutral'}>
              <Ban aria-hidden />
              <div>
                <strong>Motivo {r.status === 'REJECTED' ? 'da rejeição' : 'do cancelamento'}</strong>
                <p>{r.statusReason}</p>
              </div>
            </S.Callout>
          )}
          {r.resolutionNotes && (
            <S.Callout $tone="success">
              <CircleCheck aria-hidden />
              <div>
                <strong>Notas da conclusão</strong>
                <p>{r.resolutionNotes}</p>
              </div>
            </S.Callout>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Descrição</CardTitle>
            </CardHeader>
            <S.Prose>{r.description}</S.Prose>
          </Card>

          {r.services && r.services.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Serviços</CardTitle>
              </CardHeader>
              <S.Materials>
                {r.services.map((line) => (
                  <li key={line.id}>
                    <div>
                      <strong>{line.description}</strong>
                      <small>
                        {formatQuantity(line.quantity)} × {formatCurrency(line.unitPrice)}
                      </small>
                    </div>
                    <em>{formatCurrency(line.total)}</em>
                  </li>
                ))}
              </S.Materials>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{r.customer ? 'Peças e materiais' : 'Materiais'}</CardTitle>
            </CardHeader>
            {r.status !== 'COMPLETED' && c.shortages.length > 0 && (
              <S.Callout $tone="warning" style={{ marginBottom: 12 }}>
                <TriangleAlert aria-hidden />
                <div>
                  <strong>Saldo insuficiente para concluir</strong>
                  Lance uma entrada dos itens marcados antes de concluir o atendimento.
                </div>
              </S.Callout>
            )}
            {r.items && r.items.length > 0 ? (
              <S.Materials>
                {r.items.map((item) => {
                  const short = r.status !== 'COMPLETED' && !!item.product && item.product.available < item.quantity;
                  return (
                    <li key={item.id}>
                      <div>
                        <strong>{item.product?.name ?? 'Produto removido'}</strong>
                        <small data-short={short}>
                          {item.product?.sku}
                          {item.product &&
                            item.product.available !== undefined &&
                            ` — ${formatQuantity(item.product.available, item.product.unit)} em estoque`}
                          {item.unitPrice > 0 && ` — ${formatCurrency(item.unitPrice)} cada`}
                        </small>
                      </div>
                      <em>
                        {formatQuantity(item.quantity, item.product?.unit)}
                        {item.total > 0 && ` · ${formatCurrency(item.total)}`}
                      </em>
                    </li>
                  );
                })}
              </S.Materials>
            ) : (
              <p>Esta solicitação não usa materiais do estoque.</p>
            )}
          </Card>

          {r.totals && r.totals.services + r.totals.parts > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Valores</CardTitle>
              </CardHeader>
              <S.Totals>
                <dt>Serviços</dt>
                <dd>{formatCurrency(r.totals.services)}</dd>
                <dt>Peças e materiais</dt>
                <dd>{formatCurrency(r.totals.parts)}</dd>
                {r.totals.discount > 0 && (
                  <>
                    <dt>Desconto</dt>
                    <dd>- {formatCurrency(r.totals.discount)}</dd>
                  </>
                )}
                <dt data-total>Total</dt>
                <dd data-total>{formatCurrency(r.totals.total)}</dd>
              </S.Totals>
            </Card>
          )}
        </Stack>

        <Stack $gap={6}>
          {c.hasActions && (
            <Card>
              <CardHeader>
                <CardTitle>Próximo passo</CardTitle>
              </CardHeader>
              <S.Actions>
                {c.can.approve && (
                  <Button onClick={() => c.openDialog('approve')}>
                    <Check /> Aprovar
                  </Button>
                )}
                {c.can.start && (
                  <Button onClick={c.start} loading={c.busy}>
                    <Play /> Iniciar atendimento
                  </Button>
                )}
                {c.can.complete && (
                  <Button onClick={() => c.openDialog('complete')}>
                    <CircleCheck /> Concluir e dar baixa
                  </Button>
                )}
                {c.can.assign && (
                  <Button variant="secondary" onClick={() => c.openDialog('assign')}>
                    <UserCheck /> {r.assignee ? 'Trocar responsável' : 'Definir responsável'}
                  </Button>
                )}
                {c.can.edit && (
                  <Button variant="secondary" onClick={() => c.openDialog('edit')}>
                    <Pencil /> Editar
                  </Button>
                )}
                {c.can.reject && (
                  <Button variant="danger" onClick={() => c.openDialog('reject')}>
                    <X /> Rejeitar
                  </Button>
                )}
                {c.can.cancel && (
                  <Button variant="outline" onClick={() => c.openDialog('cancel')}>
                    <Ban /> Cancelar solicitação
                  </Button>
                )}
              </S.Actions>
            </Card>
          )}

          {(r.invoice || c.can.invoice) && (
            <Card>
              <CardHeader>
                <CardTitle>Nota de serviço</CardTitle>
                {r.invoice && <Badge $tone="success">Emitida</Badge>}
              </CardHeader>
              {r.invoice ? (
                <S.Actions>
                  <S.InvoiceLine>
                    <ReceiptText aria-hidden />
                    <div>
                      <strong>{r.invoice.code}</strong>
                      <small>
                        {formatCurrency(r.invoice.total)} · {formatDateTime(r.invoice.issuedAt)}
                      </small>
                    </div>
                  </S.InvoiceLine>
                  <Button variant="secondary" onClick={c.openInvoicePdf} loading={c.openingPdf}>
                    <FileText /> Abrir PDF
                  </Button>
                </S.Actions>
              ) : (
                <S.Actions>
                  <p>O serviço foi concluído. Emita a nota para o cliente abrir no aplicativo.</p>
                  <Button onClick={() => c.openDialog('invoice')}>
                    <ReceiptText /> Emitir nota
                  </Button>
                </S.Actions>
              )}
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Andamento</CardTitle>
            </CardHeader>
            <Timeline request={r} />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes</CardTitle>
            </CardHeader>
            <S.Facts>
              {r.customer && (
                <>
                  <dt>Cliente</dt>
                  <dd>
                    {c.staff ? (
                      <Link to={`/clientes/${r.customer.id}`}>{r.customer.tradeName || r.customer.name}</Link>
                    ) : (
                      r.customer.tradeName || r.customer.name
                    )}
                    {r.customer.document && <small> {formatDocument(r.customer.document)}</small>}
                  </dd>
                </>
              )}
              {r.vehicle && (
                <>
                  <dt>Veículo</dt>
                  <dd>{vehicleLabel(r.vehicle)}</dd>
                </>
              )}
              {r.contract && (
                <>
                  <dt>Contrato</dt>
                  <dd>
                    {r.contract.code} — {r.contract.title}
                  </dd>
                </>
              )}
              <dt>{r.customer ? 'Registrada por' : 'Solicitante'}</dt>
              <dd>
                {r.requester?.name ?? '—'}
                {r.origin === 'APP' && <small> pelo aplicativo</small>}
              </dd>
              <dt>Responsável</dt>
              <dd>{r.assignee?.name ?? 'Ainda sem responsável'}</dd>
              <dt>Prazo</dt>
              <dd>{r.dueDate ? formatDate(r.dueDate) : 'Sem prazo'}</dd>
              <dt>Atualizada</dt>
              <dd>{formatDateTime(r.updatedAt)}</dd>
            </S.Facts>
          </Card>
        </Stack>
      </S.Layout>

      {c.dialog === 'edit' && (
        <RequestFormDialog request={r} staff={c.staff} busy={c.busy} onSubmit={c.update} onClose={c.closeDialog} />
      )}
      {c.dialog && c.dialog !== 'edit' && (
        <ActionDialog
          kind={c.dialog}
          request={r}
          assignees={c.assignees}
          hasShortage={c.shortages.length > 0}
          busy={c.busy}
          onClose={c.closeDialog}
          onConfirm={(value) => {
            if (c.dialog === 'approve') c.approve(value);
            if (c.dialog === 'reject') c.reject(value);
            if (c.dialog === 'assign') c.assign(value);
            if (c.dialog === 'complete') c.complete(value);
            if (c.dialog === 'cancel') c.cancel(value);
            if (c.dialog === 'invoice') c.issueInvoice(value);
          }}
        />
      )}
    </>
  );
}

function Timeline({ request: r }: { request: ServiceRequest }) {
  const stopped = r.status === 'REJECTED' || r.status === 'CANCELLED';
  const steps = [
    { label: 'Aberta', at: r.createdAt as string | null },
    { label: 'Aprovada', at: r.approvedAt },
    { label: 'Em andamento', at: r.startedAt },
    { label: 'Concluída', at: r.completedAt },
  ];
  const firstPending = steps.findIndex((s) => !s.at);

  return (
    <S.Steps>
      {steps.map((step, i) => {
        if (stopped && !step.at) return null;
        const state = step.at ? 'done' : i === firstPending ? 'current' : 'todo';
        return (
          <S.Step key={step.label} $state={state}>
            <i>{step.at ? <Check aria-hidden /> : i + 1}</i>
            <div>
              <strong>{step.label}</strong>
              {step.at && <small>{formatDateTime(step.at)}</small>}
            </div>
          </S.Step>
        );
      })}
      {stopped && (
        <S.Step $state="stopped">
          <i>
            <X aria-hidden />
          </i>
          <div>
            <strong>{STATUS_LABEL[r.status]}</strong>
            <small>{formatDateTime(r.updatedAt)}</small>
          </div>
        </S.Step>
      )}
    </S.Steps>
  );
}

type ActionKind = Exclude<RequestDialog, 'edit' | null>;

const ACTION_COPY: Record<ActionKind, { title: string; description: string; confirm: string }> = {
  approve: {
    title: 'Aprovar solicitação',
    description: 'O solicitante é avisado. Você já pode indicar quem vai atender.',
    confirm: 'Aprovar',
  },
  reject: {
    title: 'Rejeitar solicitação',
    description: 'O solicitante recebe o motivo. Uma solicitação rejeitada não pode ser reaberta.',
    confirm: 'Rejeitar',
  },
  assign: {
    title: 'Definir responsável',
    description: 'A pessoa escolhida é avisada por notificação.',
    confirm: 'Definir responsável',
  },
  complete: {
    title: 'Concluir e dar baixa',
    description: 'Os materiais listados saem do estoque de uma vez. Se faltar saldo de algum item, nada é baixado.',
    confirm: 'Concluir e dar baixa',
  },
  invoice: {
    title: 'Emitir nota de serviço',
    description:
      'A nota guarda os serviços, as peças e os valores como estão agora. O cliente é avisado e pode abrir o PDF no aplicativo.',
    confirm: 'Emitir nota',
  },
  cancel: {
    title: 'Cancelar solicitação',
    description: 'Os envolvidos são avisados. Uma solicitação cancelada não pode ser reaberta.',
    confirm: 'Cancelar solicitação',
  },
};

function ActionDialog(props: {
  kind: ActionKind;
  request: ServiceRequest;
  assignees: User[];
  hasShortage: boolean;
  busy: boolean;
  onConfirm: (value: string) => void;
  onClose: () => void;
}) {
  const { kind } = props;
  const copy = ACTION_COPY[kind];
  const usesAssignee = kind === 'approve' || kind === 'assign';
  const [value, setValue] = useState(usesAssignee ? (props.request.assigneeId ?? '') : '');
  const [error, setError] = useState('');

  const submit = () => {
    if (kind === 'reject' && value.trim().length < 3) return setError('Explique o motivo da rejeição');
    if (kind === 'assign' && !value) return setError('Escolha quem vai atender');
    props.onConfirm(value.trim());
  };

  return (
    <Dialog open onOpenChange={(open) => !open && props.onClose()} title={copy.title} description={copy.description} size="sm">
      <FormStack
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {kind === 'complete' && props.hasShortage && (
          <S.Callout $tone="warning">
            <TriangleAlert aria-hidden />
            <div>Há materiais sem saldo suficiente. A conclusão vai falhar até o estoque ser reposto.</div>
          </S.Callout>
        )}

        {usesAssignee ? (
          <Field label={kind === 'approve' ? 'Responsável (opcional)' : 'Responsável'} error={error}>
            <Select
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError('');
              }}
            >
              <option value="">{kind === 'approve' ? 'Decidir depois' : 'Selecione'}</option>
              {props.assignees.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field
            label={
              kind === 'complete'
                ? 'Notas da conclusão (opcional)'
                : kind === 'invoice'
                  ? 'Observações na nota (opcional)'
                  : kind === 'reject'
                    ? 'Motivo'
                    : 'Motivo (opcional)'
            }
            error={error}
          >
            <Textarea
              autoFocus
              maxLength={2000}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError('');
              }}
            />
          </Field>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Voltar
          </Button>
          <Button type="submit" variant={kind === 'reject' ? 'danger' : 'primary'} loading={props.busy}>
            {copy.confirm}
          </Button>
        </DialogFooter>
      </FormStack>
    </Dialog>
  );
}
