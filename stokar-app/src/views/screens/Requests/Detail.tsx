import { useNavigation } from '@react-navigation/native';
import { Ban, Banknote, Check, CircleCheck, FileQuestion, FileText, Play, ReceiptText, Wallet, X } from 'lucide-react-native';
import { useState } from 'react';
import { useTheme } from 'styled-components/native';
import { useRequestDetailController, type RequestAction } from '@/controllers/useRequestDetailController';
import { PAYMENT_METHOD_LABEL, PAYMENT_METHODS, PRIORITY_LABEL, STATUS_HINT, STATUS_LABEL, STATUS_TONE } from '@/models/labels';
import type { RootScreenProps } from '@/navigation/types';
import type { PaymentMethod, ServiceRequest } from '@/models/types';
import { formatCurrency, formatDate, formatDateTime, formatDocument, formatQuantity, vehicleLabel } from '@/utils/format';
import {
  Badge,
  Body,
  Button,
  Callout,
  Card,
  Chip,
  Divider,
  EmptyState,
  Fact,
  Fill,
  Heading,
  Loading,
  Money,
  Muted,
  Row,
  Screen,
  Sheet,
  Stack,
  SheetBody,
  Strong,
  Subheading,
  TextField,
} from '../../components/ui';
import * as S from './Requests.styles';

/** Ações que pedem um texto (motivo ou notas) antes de confirmar. */
const PROMPT: Partial<Record<RequestAction, { title: string; description: string; label: string; confirm: string; required?: boolean; danger?: boolean }>> = {
  reject: {
    title: 'Rejeitar serviço',
    description: 'O cliente recebe o motivo. Um serviço rejeitado não pode ser reaberto.',
    label: 'Motivo',
    confirm: 'Rejeitar',
    required: true,
    danger: true,
  },
  cancel: {
    title: 'Cancelar pedido',
    description: 'Os envolvidos são avisados. Um pedido cancelado não pode ser reaberto.',
    label: 'Motivo (opcional)',
    confirm: 'Cancelar pedido',
    danger: true,
  },
  complete: {
    title: 'Concluir serviço',
    description: 'As peças lançadas saem do estoque. Se faltar saldo de alguma, nada é baixado.',
    label: 'Notas da conclusão (opcional)',
    confirm: 'Concluir',
  },
};

export function RequestDetailScreen({ route }: RootScreenProps<'RequestDetail'>) {
  const c = useRequestDetailController(route.params.id);
  const [prompt, setPrompt] = useState<RequestAction | null>(null);
  const [text, setText] = useState('');
  const [textError, setTextError] = useState('');
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('PIX');
  const [payNotes, setPayNotes] = useState('');
  const navigation = useNavigation();
  const r = c.request;

  if (c.loading) return <Loading />;
  if (c.notFound || !r) {
    return (
      <Screen>
        <EmptyState icon={FileQuestion} title="Serviço não encontrado" description="Ele pode ter sido removido ou você não tem acesso a ele." />
      </Screen>
    );
  }

  const openPrompt = (action: RequestAction) => {
    setText('');
    setTextError('');
    setPrompt(action);
  };
  const confirmPrompt = async () => {
    if (!prompt) return;
    if (PROMPT[prompt]?.required && text.trim().length < 3) return setTextError('Explique o motivo');
    if (await c.run(prompt, text)) setPrompt(null);
  };
  const copy = prompt ? PROMPT[prompt] : undefined;

  const actions = (
    <>
      {c.can.approve && <Button label="Aprovar" icon={Check} loading={c.busy === 'approve'} onPress={() => void c.run('approve')} />}
      {c.can.start && <Button label="Iniciar atendimento" icon={Play} loading={c.busy === 'start'} onPress={() => void c.run('start')} />}
      {c.can.complete && <Button label="Concluir serviço" icon={CircleCheck} onPress={() => openPrompt('complete')} />}
      {c.paymentBlocksCompletion && (
        <Callout icon={Banknote} tone="warning">
          A oficina exige o pagamento para encerrar. Registre o pagamento para concluir.
        </Callout>
      )}
      {c.canRegisterPayment && (
        <Button
          label="Registrar pagamento"
          variant={c.paymentBlocksCompletion ? 'primary' : 'secondary'}
          icon={Banknote}
          onPress={() => {
            setMethod('PIX');
            setPayNotes('');
            setPaying(true);
          }}
        />
      )}
      {c.can.invoice && <Button label="Emitir nota" icon={ReceiptText} loading={c.busy === 'invoice'} onPress={() => void c.run('invoice')} />}
      {c.can.reject && <Button label="Rejeitar" variant="danger" icon={X} onPress={() => openPrompt('reject')} />}
      {c.can.cancel && <Button label="Cancelar pedido" variant="outline" icon={Ban} onPress={() => openPrompt('cancel')} />}
    </>
  );
  const hasActions = Object.values(c.can).some(Boolean) || c.canRegisterPayment;

  return (
    <Screen refreshing={c.refreshing} onRefresh={c.refresh} footer={hasActions ? actions : undefined}>
      <Card>
        <Row $between>
          <S.Code>{r.code}</S.Code>
          <Badge label={STATUS_LABEL[r.status]} tone={STATUS_TONE[r.status]} />
        </Row>
        <Heading>{r.title}</Heading>
        {!c.staff && <Muted>{STATUS_HINT[r.status]}</Muted>}
        <Body selectable>{r.description}</Body>
      </Card>

      {r.statusReason && (
        <Callout icon={Ban} tone={r.status === 'REJECTED' ? 'danger' : 'neutral'} title={r.status === 'REJECTED' ? 'Motivo da rejeição' : 'Motivo do cancelamento'}>
          {r.statusReason}
        </Callout>
      )}
      {r.resolutionNotes && (
        <Callout icon={CircleCheck} tone="success" title="Notas da conclusão">
          {r.resolutionNotes}
        </Callout>
      )}

      {r.invoice && (
        <Card>
          <Row $between>
            <Fill>
              <Subheading>Nota {r.invoice.code}</Subheading>
              <Muted>
                {formatCurrency(r.invoice.total)} · {formatDateTime(r.invoice.issuedAt)}
              </Muted>
            </Fill>
            <Badge label="Emitida" tone="success" />
          </Row>
          <Button label="Abrir PDF da nota" variant="secondary" icon={FileText} loading={c.busy === 'pdf'} onPress={() => void c.openPdf()} />
        </Card>
      )}

      {r.payment && r.payment.status !== 'NONE' && (
        <Card>
          <Row $between>
            <Subheading>Pagamento</Subheading>
            <Badge label={r.payment.status === 'PAID' ? 'Pago' : 'Pendente'} tone={r.payment.status === 'PAID' ? 'success' : 'warning'} />
          </Row>
          {r.payment.status === 'PAID' && r.payment.paidAt ? (
            <Muted>
              Pago em {formatDate(r.payment.paidAt)}
              {r.payment.method ? ` · ${PAYMENT_METHOD_LABEL[r.payment.method]}` : ''}
              {c.staff && r.payment.confirmedBy ? `\nRegistrado por ${r.payment.confirmedBy.name}` : ''}
              {c.staff && r.payment.notes ? `\n${r.payment.notes}` : ''}
            </Muted>
          ) : (
            <Muted>
              {formatCurrency(r.totals?.total ?? 0)} a pagar.{' '}
              {c.staff ? 'O cliente vê o valor e a chave PIX no aplicativo.' : 'Depois de pagar, a oficina confirma e você recebe um aviso.'}
            </Muted>
          )}
          {!c.staff && r.payment.status === 'PENDING' && (
            <Button label="Pagar com PIX" icon={Wallet} onPress={() => navigation.navigate('Payments')} />
          )}
        </Card>
      )}

      {(r.services?.length || r.items?.length) && r.totals ? <Values request={r} /> : null}

      <Card>
        <Subheading>Andamento</Subheading>
        <Timeline request={r} />
      </Card>

      <Card>
        <Subheading>Detalhes</Subheading>
        {c.staff && r.customer && (
          <Fact
            label="Cliente"
            value={[r.customer.tradeName || r.customer.name, formatDocument(r.customer.document), r.customer.phone].filter(Boolean).join('\n')}
          />
        )}
        {r.vehicle && <Fact label="Veículo" value={vehicleLabel(r.vehicle)} />}
        {r.contract && <Fact label="Contrato" value={`${r.contract.code} — ${r.contract.title}`} />}
        <Fact label="Responsável" value={r.assignee?.name ?? 'Ainda sem responsável'} />
        {c.staff && <Fact label="Prioridade" value={PRIORITY_LABEL[r.priority]} />}
        {c.staff && <Fact label="Registrado por" value={`${r.requester?.name ?? '—'}${r.origin === 'APP' ? ' (aplicativo)' : ''}`} />}
        <Fact label="Aberto em" value={formatDateTime(r.createdAt)} />
      </Card>

      <Sheet
        visible={paying}
        onClose={() => setPaying(false)}
        title="Registrar pagamento"
        description={`Confirme que o cliente pagou ${formatCurrency(r.totals?.total ?? 0)}. Ele é avisado no aplicativo.`}
      >
        <SheetBody>
          <Stack $gap={2}>
            <Muted>Forma de pagamento</Muted>
            <Row style={{ flexWrap: 'wrap' }}>
              {PAYMENT_METHODS.map((m) => (
                <Chip key={m} label={PAYMENT_METHOD_LABEL[m]} active={method === m} onPress={() => setMethod(m)} />
              ))}
            </Row>
          </Stack>
          <TextField label="Observação (opcional)" hint="Só a equipe vê" value={payNotes} onChangeText={setPayNotes} maxLength={500} />
          <Button
            label="Confirmar pagamento"
            loading={c.busy === 'payment'}
            onPress={() => void c.registerPayment(method, payNotes).then((ok) => ok && setPaying(false))}
          />
          <Button label="Voltar" variant="ghost" onPress={() => setPaying(false)} />
        </SheetBody>
      </Sheet>

      <Sheet visible={!!prompt} onClose={() => setPrompt(null)} title={copy?.title ?? ''} description={copy?.description}>
        <SheetBody>
          <TextField
            label={copy?.label ?? ''}
            value={text}
            onChangeText={(value) => {
              setText(value);
              setTextError('');
            }}
            error={textError}
            multiline
            maxLength={2000}
          />
          <Button
            label={copy?.confirm ?? 'Confirmar'}
            variant={copy?.danger ? 'danger' : 'primary'}
            loading={!!prompt && c.busy === prompt}
            onPress={() => void confirmPrompt()}
          />
          <Button label="Voltar" variant="ghost" onPress={() => setPrompt(null)} />
        </SheetBody>
      </Sheet>
    </Screen>
  );
}

function Values({ request: r }: { request: ServiceRequest }) {
  const totals = r.totals!;
  return (
    <Card>
      <Subheading>Serviços e valores</Subheading>
      {r.services?.map((line) => (
        <Row key={line.id} $between $top>
          <Fill>
            <Strong>{line.description}</Strong>
            <Muted>
              {formatQuantity(line.quantity)} × {formatCurrency(line.unitPrice)}
            </Muted>
          </Fill>
          <Body>{formatCurrency(line.total)}</Body>
        </Row>
      ))}
      {r.items?.map((item) => (
        <Row key={item.id} $between $top>
          <Fill>
            <Strong>{item.product?.name ?? 'Peça'}</Strong>
            <Muted>
              {formatQuantity(item.quantity, item.product?.unit)} × {formatCurrency(item.unitPrice)}
            </Muted>
          </Fill>
          <Body>{formatCurrency(item.total)}</Body>
        </Row>
      ))}
      <Divider />
      {totals.discount > 0 && (
        <Row $between>
          <Muted>Desconto</Muted>
          <Body>- {formatCurrency(totals.discount)}</Body>
        </Row>
      )}
      <Row $between>
        <Strong>Total</Strong>
        <Money>{formatCurrency(totals.total)}</Money>
      </Row>
      {r.status !== 'COMPLETED' && <Muted>Os valores podem mudar até a conclusão, se a oficina precisar incluir peças ou serviços.</Muted>}
    </Card>
  );
}

/** Etapas do fluxo OPEN → APPROVED → IN_PROGRESS → COMPLETED. */
function Timeline({ request: r }: { request: ServiceRequest }) {
  const theme = useTheme();
  const stopped = r.status === 'REJECTED' || r.status === 'CANCELLED';
  const steps = [
    { label: 'Pedido aberto', at: r.createdAt as string | null },
    { label: 'Aprovado pela oficina', at: r.approvedAt },
    { label: 'Em andamento', at: r.startedAt },
    { label: 'Concluído', at: r.completedAt },
  ].filter((step) => !stopped || step.at);
  const firstPending = steps.findIndex((s) => !s.at);
  const rows = stopped ? [...steps, { label: STATUS_LABEL[r.status], at: r.updatedAt, stopped: true }] : steps;

  return (
    <>
      {rows.map((step, i) => {
        const isStopped = 'stopped' in step;
        const state = isStopped ? 'stopped' : step.at ? 'done' : i === firstPending ? 'current' : 'todo';
        const last = i === rows.length - 1;
        return (
          <S.Step key={step.label}>
            <S.StepRail>
              <S.StepDot $state={state}>
                {isStopped ? (
                  <X size={14} color={theme.colors.danger} />
                ) : step.at ? (
                  <Check size={14} color={theme.colors.primaryFg} />
                ) : null}
              </S.StepDot>
              {!last && <S.StepLine $done={state === 'done'} />}
            </S.StepRail>
            <S.StepBody>
              <Strong style={state === 'todo' ? { color: theme.colors.textSubtle } : undefined}>{step.label}</Strong>
              {step.at && <Muted>{formatDateTime(step.at)}</Muted>}
            </S.StepBody>
          </S.Step>
        );
      })}
    </>
  );
}
