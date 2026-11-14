const LOCALE = 'pt-BR';

const quantityFmt = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 3 });
const compactFmt = new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 });
const currencyFmt = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'BRL' });
const dateFmt = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});
const timeFmt = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' });
const relativeFmt = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });

export const formatQuantity = (value: number, unit?: string) =>
  unit ? `${quantityFmt.format(value)} ${unit}` : quantityFmt.format(value);
export const formatCompact = (value: number) => compactFmt.format(value);
export const formatCurrency = (value: number) => currencyFmt.format(value);
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));
export const formatTime = (iso: string) => timeFmt.format(new Date(iso));

/** Datas "AAAA-MM-DD" são tratadas como data local (sem voltar um dia pelo fuso). */
export function formatDate(iso: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return dateFmt.format(date);
}

export function formatRelative(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return 'agora';
  if (abs < 3600) return relativeFmt.format(Math.round(diff / 60), 'minute');
  if (abs < 86_400) return relativeFmt.format(Math.round(diff / 3600), 'hour');
  if (abs < 604_800) return relativeFmt.format(Math.round(diff / 86_400), 'day');
  return formatDate(iso);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Converte o valor de um <input type="number"> em número ou undefined. */
export function toNumber(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export const emptyToNull = (value?: string | null) => (value && value.trim() ? value.trim() : null);
export const emptyToUndefined = (value?: string | null) => (value && value.trim() ? value.trim() : undefined);

/** CPF/CNPJ (somente dígitos) com a pontuação usual. */
export function formatDocument(document?: string | null) {
  if (!document) return '';
  if (document.length === 11) return document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (document.length === 14) return document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return document;
}

export function vehicleLabel(v?: { plate?: string | null; brand?: string | null; model: string; year?: number | null } | null) {
  if (!v) return '';
  const name = [v.brand, v.model, v.year].filter(Boolean).join(' ');
  return v.plate ? `${name} · ${v.plate}` : name;
}

/** Abre um blob (ex.: PDF) em outra aba; se o navegador bloquear, baixa o arquivo. */
export function openBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, '_blank', 'noopener');
  if (!opened) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
