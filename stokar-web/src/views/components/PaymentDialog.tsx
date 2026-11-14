import { useState } from 'react';
import { PAYMENT_METHOD_LABEL, PAYMENT_METHODS } from '@/models/labels';
import type { PaymentInput, PaymentMethod } from '@/models/types';
import { formatCurrency } from '@/utils/format';
import { Button, Dialog, DialogFooter, Field, FormGrid, FormStack, Input, Select, Textarea } from './ui';

/** Data de hoje no formato do <input type="date"> (fuso do navegador). */
const today = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

/** Registrar que o cliente pagou: forma, data e uma observação interna. */
export function PaymentDialog(props: {
  amount: number;
  busy: boolean;
  onConfirm: (input: PaymentInput) => void;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>('PIX');
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (!date || date > today()) return setError('Informe uma data até hoje');
    // Hoje: registra o horário atual; outro dia: meio-dia daquela data (evita virar o dia por fuso)
    const paidAt = date === today() ? undefined : new Date(`${date}T12:00:00`).toISOString();
    props.onConfirm({ method, paidAt, notes: notes.trim() || undefined });
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && props.onClose()}
      title="Registrar pagamento"
      description={`Confirme que o cliente pagou ${formatCurrency(props.amount)}. Ele é avisado no aplicativo.`}
      size="sm"
    >
      <FormStack
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <FormGrid>
          <Field label="Forma de pagamento">
            <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_METHOD_LABEL[m]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Data do pagamento" error={error}>
            <Input
              type="date"
              max={today()}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setError('');
              }}
            />
          </Field>
        </FormGrid>
        <Field label="Observação (opcional)" hint="Só a equipe vê. Ex.: conferido no extrato, pago no balcão">
          <Textarea maxLength={500} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={props.onClose}>
            Voltar
          </Button>
          <Button type="submit" loading={props.busy}>
            Confirmar pagamento
          </Button>
        </DialogFooter>
      </FormStack>
    </Dialog>
  );
}
