import { Router } from 'express';
import { z } from 'zod';
import { AppDataSource } from '../database/data-source';
import { MovementType, Product, RequestStatus, ServiceRequest, STAFF_ROLES, StockMovement } from '../entities';
import { authorize, currentUser } from '../middlewares/auth';

const router = Router();

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** GET /api/reports/summary — números para o painel (dashboard) */
router.get('/summary', authorize(...STAFF_ROLES), async (_req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [stock, requestsByStatus, movements] = await Promise.all([
    AppDataSource.getRepository(Product)
      .createQueryBuilder('p')
      .select('COUNT(*)', 'products')
      .addSelect('COUNT(*) FILTER (WHERE p.quantity <= p.minQuantity)', 'lowStock')
      .addSelect('COUNT(*) FILTER (WHERE p.quantity = 0)', 'outOfStock')
      .addSelect('COALESCE(SUM(p.quantity * p.costPrice), 0)', 'stockValue')
      .where('p.active = true')
      .getRawOne<{ products: string; lowStock: string; outOfStock: string; stockValue: string }>(),
    AppDataSource.getRepository(ServiceRequest)
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.status')
      .getRawMany<{ status: RequestStatus; count: string }>(),
    AppDataSource.getRepository(StockMovement)
      .createQueryBuilder('m')
      .select('m.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(m.quantity), 0)', 'quantity')
      .where('m.createdAt >= :since', { since })
      .groupBy('m.type')
      .getRawMany<{ type: string; count: string; quantity: string }>(),
  ]);

  const byStatus = Object.fromEntries(Object.values(RequestStatus).map((s) => [s, 0])) as Record<RequestStatus, number>;
  for (const row of requestsByStatus) byStatus[row.status] = Number(row.count);

  res.json({
    stock: {
      activeProducts: Number(stock?.products ?? 0),
      lowStock: Number(stock?.lowStock ?? 0),
      outOfStock: Number(stock?.outOfStock ?? 0),
      totalValue: Number(Number(stock?.stockValue ?? 0).toFixed(2)),
    },
    serviceRequests: byStatus,
    movementsLast30Days: movements.map((m) => ({
      type: m.type,
      count: Number(m.count),
      quantity: Number(m.quantity),
    })),
  });
});

/**
 * GET /api/reports/movements-series — entradas e saídas por período (gráfico do painel)
 * Query: granularity = day | week | month (padrão month), points = nº de períodos (1–60, padrão 9),
 * tz = fuso IANA usado para "cortar" os períodos (padrão UTC), ex.: America/Manaus.
 * Devolve sempre `points` períodos, do mais antigo ao atual, com zero onde não houve movimento.
 */
router.get('/movements-series', authorize(...STAFF_ROLES), async (req, res) => {
  const q = z
    .object({
      granularity: z.enum(['day', 'week', 'month']).default('month'),
      points: z.coerce.number().int().min(1).max(60).default(9),
      tz: z.string().max(64).refine(isValidTimeZone, 'Fuso horário inválido').default('UTC'),
    })
    .parse(req.query);

  // $1 = granularidade, $2 = fuso, $3 = nº de períodos (todos validados acima e enviados como parâmetros)
  const rows = (await AppDataSource.query(
    `
    WITH params AS (
      SELECT date_trunc($1::text, now() AT TIME ZONE $2::text) AS last_bucket,
             ('1 ' || $1::text)::interval AS step
    ),
    buckets AS (
      SELECT generate_series(p.last_bucket - ($3::int - 1) * p.step, p.last_bucket, p.step) AS bucket
      FROM params p
    ),
    totals AS (
      SELECT date_trunc($1::text, m.created_at AT TIME ZONE $2::text) AS bucket,
             COALESCE(SUM(m.quantity) FILTER (WHERE m.type = 'IN'), 0) AS qty_in,
             COALESCE(SUM(m.quantity) FILTER (WHERE m.type = 'OUT'), 0) AS qty_out,
             COUNT(*) FILTER (WHERE m.type = 'ADJUSTMENT') AS adjustments,
             COUNT(*) AS movements
      FROM stock_movements m
      CROSS JOIN params p
      WHERE m.created_at >= ((p.last_bucket - ($3::int - 1) * p.step) AT TIME ZONE $2::text)
      GROUP BY 1
    )
    SELECT to_char(b.bucket, 'YYYY-MM-DD') AS bucket,
           COALESCE(t.qty_in, 0) AS qty_in,
           COALESCE(t.qty_out, 0) AS qty_out,
           COALESCE(t.adjustments, 0) AS adjustments,
           COALESCE(t.movements, 0) AS movements
    FROM buckets b
    LEFT JOIN totals t ON t.bucket = b.bucket
    ORDER BY b.bucket
    `,
    [q.granularity, q.tz, q.points],
  )) as Array<{ bucket: string; qty_in: string; qty_out: string; adjustments: string; movements: string }>;

  res.json({
    granularity: q.granularity,
    points: rows.map((row) => ({
      bucket: row.bucket,
      in: Number(row.qty_in),
      out: Number(row.qty_out),
      adjustments: Number(row.adjustments),
      movements: Number(row.movements),
    })),
  });
});

/**
 * GET /api/reports/top-products — produtos mais movimentados no período
 * Query: days (1–365, padrão 30), limit (1–20, padrão 5), type = IN | OUT (padrão OUT).
 */
router.get('/top-products', authorize(...STAFF_ROLES), async (req, res) => {
  const q = z
    .object({
      days: z.coerce.number().int().min(1).max(365).default(30),
      limit: z.coerce.number().int().min(1).max(20).default(5),
      type: z.enum([MovementType.IN, MovementType.OUT]).default(MovementType.OUT),
    })
    .parse(req.query);

  const since = new Date(Date.now() - q.days * 24 * 60 * 60 * 1000);

  const rows = (await AppDataSource.query(
    `
    SELECT p.id, p.sku, p.name, p.unit, p.quantity, p.min_quantity,
           COUNT(*) AS movements,
           SUM(m.quantity) AS total
    FROM stock_movements m
    JOIN products p ON p.id = m.product_id
    WHERE m.type::text = $1 AND m.created_at >= $2 AND p.active = true
    GROUP BY p.id
    ORDER BY total DESC, p.name ASC
    LIMIT $3
    `,
    [q.type, since, q.limit],
  )) as Array<{
    id: string;
    sku: string;
    name: string;
    unit: string;
    quantity: string;
    min_quantity: string;
    movements: string;
    total: string;
  }>;

  res.json({
    items: rows.map((row) => ({
      product: {
        id: row.id,
        sku: row.sku,
        name: row.name,
        unit: row.unit,
        quantity: Number(row.quantity),
        minQuantity: Number(row.min_quantity),
      },
      movements: Number(row.movements),
      quantity: Number(row.total),
    })),
  });
});

/**
 * GET /api/reports/my-requests — solicitações abertas pelo usuário autenticado, por status.
 * Liberada para todos os perfis: é o painel de quem não tem acesso ao /summary (REQUESTER).
 */
router.get('/my-requests', async (req, res) => {
  const rows = await AppDataSource.getRepository(ServiceRequest)
    .createQueryBuilder('r')
    .select('r.status', 'status')
    .addSelect('COUNT(*)', 'count')
    .where('r.requesterId = :me', { me: currentUser(req).id })
    .groupBy('r.status')
    .getRawMany<{ status: RequestStatus; count: string }>();

  const byStatus = Object.fromEntries(Object.values(RequestStatus).map((s) => [s, 0])) as Record<RequestStatus, number>;
  for (const row of rows) byStatus[row.status] = Number(row.count);

  res.json({ total: Object.values(byStatus).reduce((sum, n) => sum + n, 0), byStatus });
});

export default router;
