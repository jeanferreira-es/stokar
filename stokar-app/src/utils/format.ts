const LOCALE = 'pt-BR';

const quantityFmt = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 3 });
const currencyFmt = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'BRL' });
const dateFmt = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const timeFmt = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' });

export const formatQuantity = (value: number, unit?: string | null) =>
  unit ? `${quantityFmt.format(value)} ${unit}` : quantityFmt.format(value);
export const formatCurrency = (value: number) => currencyFmt.format(value);
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));
export const formatTime = (iso: string) => timeFmt.format(new Date(iso));

/** Datas "AAAA-MM-DD" são tratadas como data local (sem voltar um dia pelo fuso). */
export function formatDate(iso: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return dateFmt.format(date);
}

export function formatRelative(iso: string) {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (seconds < 60) return 'agora';
  if (seconds < 3600) return `há ${Math.round(seconds / 60)} min`;
  if (seconds < 86_400) return `há ${Math.round(seconds / 3600)} h`;
  if (seconds < 172_800) return 'ontem';
  if (seconds < 604_800) return `há ${Math.round(seconds / 86_400)} dias`;
  return formatDate(iso);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

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

/** "1.234,50" ou "1234.5" digitado pelo usuário → número (undefined se vazio ou inválido). */
export function parseNumber(value: string): number | undefined {
  const text = value.trim();
  if (!text) return undefined;
  const normalized = text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}

export const emptyToNull = (value?: string | null) => (value && value.trim() ? value.trim() : null);
export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
