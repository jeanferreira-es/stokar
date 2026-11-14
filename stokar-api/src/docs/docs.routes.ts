import { Router } from 'express';
import { buildOpenApiDocument } from './openapi';

/**
 * Documentação da API.
 * - GET /api/docs       → Swagger UI
 * - GET /api/docs.json  → documento OpenAPI 3
 *
 * A interface é carregada de um CDN (em vez do pacote swagger-ui-express) para
 * não depender de arquivos estáticos no bundle serverless da Vercel.
 */
const router = Router();
const SWAGGER_UI = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5';

const page = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Stokar API — Documentação</title>
    <link rel="stylesheet" href="${SWAGGER_UI}/swagger-ui.css" />
    <style>body { margin: 0; background: #fafafa; } .topbar { display: none; }</style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${SWAGGER_UI}/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: './docs.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        persistAuthorization: true,
        docExpansion: 'none',
        tryItOutEnabled: true,
      });
    </script>
  </body>
</html>`;

router.get('/docs.json', (req, res) => {
  res.json(buildOpenApiDocument(`${req.protocol}://${req.get('host')}/api`));
});

router.get('/docs', (_req, res) => {
  // O helmet bloqueia scripts externos por padrão; aqui liberamos só o CDN do Swagger UI
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      "img-src 'self' data: https:",
      "font-src 'self' data: https://cdn.jsdelivr.net",
      "connect-src 'self'",
    ].join('; '),
  );
  res.type('html').send(page);
});

export default router;
