// Servidor HTTP para desenvolvimento local (ou hospedagem tradicional).
// Na Vercel quem responde é api/index.ts.
import app from './app';
import { env } from './config/env';
import { getDataSource } from './database/data-source';

async function bootstrap(): Promise<void> {
  await getDataSource();
  app.listen(env.PORT, () => {
    console.log(`API de estoque rodando em http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Falha ao iniciar a aplicação:', err);
  process.exit(1);
});
