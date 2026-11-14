import { ValueTransformer } from 'typeorm';

/** O driver pg devolve colunas NUMERIC como string; converte para number. */
export const numericTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value === null || value === undefined ? value : Number(value)),
};

export const round = (value: number, decimals = 3): number => {
  const f = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * f) / f;
};
