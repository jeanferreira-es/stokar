import 'reflect-metadata';
import pg from 'pg';
import { DataSource } from 'typeorm';
import { env } from '../config/env';
import { entities } from '../entities';
import { migrations } from './migrations';

export const AppDataSource = new DataSource({
  type: 'postgres',
  // Passar o driver explicitamente garante que o `pg` entre no bundle da Vercel
  driver: pg,
  url: env.DATABASE_URL,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
  uuidExtension: 'pgcrypto',
  entities,
  migrations,
  migrationsRun: env.DB_MIGRATIONS_RUN,
  synchronize: env.DB_SYNCHRONIZE,
  logging: false,
  extra: {
    max: env.DB_POOL_MAX,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  },
});

let initializing: Promise<DataSource> | undefined;

/**
 * Inicializa a conexão uma única vez e a reutiliza entre invocações
 * "quentes" da função serverless.
 */
export function getDataSource(): Promise<DataSource> {
  if (AppDataSource.isInitialized) return Promise.resolve(AppDataSource);
  if (!initializing) {
    initializing = AppDataSource.initialize().catch((err) => {
      initializing = undefined;
      throw err;
    });
  }
  return initializing;
}
