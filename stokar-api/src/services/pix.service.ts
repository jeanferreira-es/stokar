import { PixKeyType } from '../entities';

/**
 * "PIX copia e cola" estático (BR Code, padrão EMV-MPM do Banco Central).
 * Leva a chave da oficina, o valor e um identificador (txid) com o código do serviço,
 * para o cliente pagar no app do banco sem digitar nada.
 *
 * Não depende de banco nem de PSP: o pagamento cai direto na chave. A confirmação
 * continua manual (a oficina confere o extrato e registra o pagamento).
 */

/** Sem acentos e só caracteres aceitos pelo padrão; corta no tamanho máximo. */
function sanitize(value: string, max: number): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 .,\-/&@]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Formata a chave como os bancos esperam em cada tipo. */
export function normalizePixKey(key: string, type: PixKeyType | null): string {
  const trimmed = key.trim();
  switch (type) {
    case PixKeyType.CPF:
    case PixKeyType.CNPJ:
      return trimmed.replace(/\D/g, '');
    case PixKeyType.EMAIL:
      return trimmed.toLowerCase();
    case PixKeyType.PHONE: {
      const digits = trimmed.replace(/\D/g, '');
      // Celular brasileiro: +55 + DDD + número
      return digits.startsWith('55') && digits.length >= 12 ? `+${digits}` : `+55${digits}`;
    }
    default:
      return trimmed;
  }
}

/** Campo TLV: id (2) + tamanho (2) + valor */
const field = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`;

/** CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), exigido no campo 63. */
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface PixPayloadInput {
  key: string;
  keyType: PixKeyType | null;
  receiverName: string;
  city: string;
  /** Valor em reais; sem valor, o cliente digita no banco */
  amount?: number;
  /** Identificador que aparece no extrato (letras e números, até 25) */
  txid?: string;
}

/** Monta o código "copia e cola". Retorna null se faltar algum dado obrigatório. */
export function buildPixPayload(input: PixPayloadInput): string | null {
  const key = normalizePixKey(input.key, input.keyType);
  const name = sanitize(input.receiverName, 25);
  const city = sanitize(input.city, 15);
  if (!key || key.length > 77 || !name || !city) return null;

  const txid = (input.txid ?? '').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';
  const amount = input.amount && input.amount > 0 ? input.amount.toFixed(2) : null;

  const payload =
    field('00', '01') +
    field('26', field('00', 'br.gov.bcb.pix') + field('01', key)) +
    field('52', '0000') +
    field('53', '986') +
    (amount ? field('54', amount) : '') +
    field('58', 'BR') +
    field('59', name) +
    field('60', city) +
    field('62', field('05', txid)) +
    '6304';

  return payload + crc16(payload);
}
