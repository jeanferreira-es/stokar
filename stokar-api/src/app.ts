import 'reflect-metadata';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { API_VERSION } from './config/version';
import { getDataSource } from './database/data-source';
import docsRoutes from './docs/docs.routes';
import { errorHandler, notFoundHandler } from './middlewares/error';
import routes from './routes';

const app = express();


app.disable('x-powered-by');
// Atrás do proxy da Vercel: usa o protocolo/host originais (links da documentação)
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((o) => o.trim()) }));
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => {
  res.json({ name: 'stokar-api', version: API_VERSION, docs: '/api/docs', health: '/api/health' });
});

app.get('/api/health', async (_req, res) => {
  const ds = await getDataSource();
  await ds.query('SELECT 1');
  res.json({ status: 'ok', database: 'up', timestamp: new Date().toISOString() });
});

// Documentação (Swagger UI): pública e sem depender do banco
app.use('/api', docsRoutes);

// Garante a conexão com o banco antes de qualquer rota da API.
// Em serverless a conexão é reaproveitada enquanto a instância estiver "quente".
app.use('/api', async (_req, _res, next) => {
  await getDataSource();
  next();
});
app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
