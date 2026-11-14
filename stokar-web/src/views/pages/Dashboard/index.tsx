import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  ChartNoAxesColumn,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Hourglass,
  Package,
  PackageX,
  Plus,
  SlidersHorizontal,
  TriangleAlert,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboardController } from '@/controllers/useDashboardController';
import { MOVEMENT_LABEL, MOVEMENT_TONE, STATUS_LABEL, STATUS_TONE, type Tone } from '@/models/labels';
import type { MovementType, SeriesGranularity } from '@/models/types';
import { formatCurrency, formatQuantity, formatRelative, greeting } from '@/utils/format';
import { Gauge } from '../../components/charts/Gauge';
import { MovementChart } from '../../components/charts/MovementChart';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  IconBubble,
  Select,
  Skeleton,
} from '../../components/ui';
import * as S from './Dashboard.styles';

const MOVEMENT_ICON: Record<MovementType, LucideIcon> = {
  IN: ArrowDownToLine,
  OUT: ArrowUpFromLine,
  ADJUSTMENT: SlidersHorizontal,
};

const GRANULARITY_LABEL: Record<SeriesGranularity, string> = {
  day: 'Por dia',
  week: 'Por semana',
  month: 'Por mês',
};

interface StatProps {
  label: string;
  value: string | undefined;
  note?: string;
  icon: LucideIcon;
  tone: Tone;
  hazard?: boolean;
}

function Stat({ label, value, note, icon: Icon, tone, hazard }: StatProps) {
  return (
    <S.Stat $hazard={hazard}>
      <header>
        {label}
        <IconBubble $tone={tone} $size={38}>
          <Icon aria-hidden />
        </IconBubble>
      </header>
      {value === undefined ? <Skeleton $w="55%" $h="34px" style={{ marginTop: 8 }} /> : <strong>{value}</strong>}
      {note && <small>{note}</small>}
    </S.Stat>
  );
}

const ListSkeleton = () => (
  <S.List aria-hidden>
    {Array.from({ length: 4 }, (_, i) => (
      <Skeleton key={i} $h="64px" />
    ))}
  </S.List>
);

export function DashboardPage() {
  const c = useDashboardController();
  const firstName = c.user.name.split(' ')[0];
  const status = c.requestsByStatus;

  const movements30 = c.summary?.movementsLast30Days.reduce((sum, m) => sum + m.count, 0);

  return (
    <S.Grid>
      <S.Welcome>
        <h1>
          {greeting()}, {firstName}
        </h1>
        <p>
          {c.staff
            ? 'Veja como está o estoque e o que precisa da sua atenção hoje.'
            : 'Acompanhe suas solicitações de serviço por aqui.'}
        </p>
      </S.Welcome>

      {c.staff ? (
        <S.Stats>
          <Stat
            label="Produtos ativos"
            value={c.summary && formatQuantity(c.summary.stock.activeProducts)}
            note={movements30 !== undefined ? `${formatQuantity(movements30)} movimentações em 30 dias` : undefined}
            icon={Package}
            tone="primary"
          />
          <Stat
            label="Valor em estoque"
            value={c.summary && formatCurrency(c.summary.stock.totalValue)}
            note="Saldo × custo médio"
            icon={Wallet}
            tone="info"
          />
          <Stat
            label="Estoque baixo"
            value={c.summary && formatQuantity(c.summary.stock.lowStock)}
            note={c.summary ? `${formatQuantity(c.summary.stock.outOfStock)} sem saldo` : undefined}
            icon={TriangleAlert}
            tone="warning"
            hazard={!!c.summary && c.summary.stock.lowStock > 0}
          />
        </S.Stats>
      ) : (
        <S.Stats>
          <Stat label="Aguardando aprovação" value={status && String(status.OPEN)} icon={Hourglass} tone="warning" />
          <Stat
            label="Em atendimento"
            value={status && String(status.APPROVED + status.IN_PROGRESS)}
            icon={Wrench}
            tone="primary"
          />
          <Stat label="Concluídas" value={status && String(status.COMPLETED)} icon={ClipboardCheck} tone="success" />
        </S.Stats>
      )}

      {c.staff && (
        <S.ChartCard>
          <Card>
            <CardHeader>
              <CardTitle>Entradas e saídas</CardTitle>
              <Select
                aria-label="Período do gráfico"
                value={c.granularity}
                onChange={(e) => c.setGranularity(e.target.value as SeriesGranularity)}
                style={{ width: 'auto', borderRadius: 999 }}
              >
                {(Object.keys(GRANULARITY_LABEL) as SeriesGranularity[]).map((g) => (
                  <option key={g} value={g}>
                    {GRANULARITY_LABEL[g]}
                  </option>
                ))}
              </Select>
            </CardHeader>
            {c.seriesLoading && <Skeleton $h="320px" />}
            {c.seriesError && (
              <EmptyState
                icon={<ChartNoAxesColumn />}
                title="Não foi possível carregar o gráfico"
                description="Confira se a API está atualizada com a rota /reports/movements-series."
              />
            )}
            {c.series && <MovementChart points={c.series} granularity={c.granularity} />}
          </Card>
        </S.ChartCard>
      )}

      <S.GaugeCard style={c.staff ? undefined : { gridColumn: '1 / -1' }}>
        <Card>
          <CardHeader>
            <CardTitle>{c.staff ? 'Solicitações de serviço' : 'Minhas solicitações'}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/solicitacoes">Ver todas</Link>
            </Button>
          </CardHeader>
          {c.requestsLoading ? (
            <Skeleton $h="200px" />
          ) : (
            <>
              <Gauge value={c.completion.rate} label="concluídas" />
              <S.GaugeStats>
                <div>
                  <dt>Em aberto</dt>
                  <dd>{c.completion.pending}</dd>
                </div>
                <div>
                  <dt>Concluídas</dt>
                  <dd>{c.completion.completed}</dd>
                </div>
              </S.GaugeStats>
            </>
          )}
        </Card>
      </S.GaugeCard>

      {c.staff ? (
        <>
          <S.Third>
            <Card>
              <CardHeader>
                <CardTitle>Atividades recentes</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/movimentacoes">Ver histórico</Link>
                </Button>
              </CardHeader>
              {c.recentMovementsLoading && <ListSkeleton />}
              {c.recentMovements?.length === 0 && (
                <EmptyState
                  icon={<Boxes />}
                  title="Nenhuma movimentação ainda"
                  description="Lance a primeira entrada para começar a acompanhar o estoque."
                />
              )}
              <S.List>
                {c.recentMovements?.map((m) => {
                  const Icon = MOVEMENT_ICON[m.type];
                  return (
                    <S.Row key={m.id}>
                      <IconBubble $tone={MOVEMENT_TONE[m.type]}>
                        <Icon aria-hidden />
                      </IconBubble>
                      <S.RowBody>
                        <strong>
                          {MOVEMENT_LABEL[m.type]} de {formatQuantity(m.quantity, m.product?.unit)}
                        </strong>
                        <span>{m.product?.name}</span>
                      </S.RowBody>
                      <S.RowAside>{formatRelative(m.createdAt)}</S.RowAside>
                    </S.Row>
                  );
                })}
              </S.List>
            </Card>
          </S.Third>

          <S.Third>
            <Card>
              <CardHeader>
                <CardTitle>Alertas</CardTitle>
              </CardHeader>
              {c.summaryLoading || !c.summary ? (
                <ListSkeleton />
              ) : (
                <S.List>
                  <AlertRow
                    to="/produtos?estoque=baixo"
                    tone="danger"
                    icon={PackageX}
                    title="Sem estoque"
                    detail={`${c.summary.stock.outOfStock} produtos zerados`}
                  />
                  <AlertRow
                    to="/produtos?estoque=baixo"
                    tone="warning"
                    icon={TriangleAlert}
                    title="Estoque baixo"
                    detail={`${c.summary.stock.lowStock} produtos no mínimo ou abaixo`}
                  />
                  <AlertRow
                    to="/solicitacoes?status=OPEN"
                    tone="info"
                    icon={Hourglass}
                    title="Aguardando aprovação"
                    detail={`${c.summary.serviceRequests.OPEN} solicitações abertas`}
                  />
                  <AlertRow
                    to="/solicitacoes?status=IN_PROGRESS"
                    tone="primary"
                    icon={Wrench}
                    title="Em andamento"
                    detail={`${c.summary.serviceRequests.IN_PROGRESS} solicitações em atendimento`}
                  />
                </S.List>
              )}
            </Card>
          </S.Third>

          <S.Third>
            <Card>
              <CardHeader>
                <CardTitle>Mais retirados em 30 dias</CardTitle>
              </CardHeader>
              {c.topProductsLoading && <ListSkeleton />}
              {c.topProducts?.length === 0 && (
                <EmptyState icon={<Package />} title="Sem saídas no período" description="Quando houver retiradas, os produtos mais usados aparecem aqui." />
              )}
              <S.List>
                {c.topProducts?.map(({ product, quantity, movements }) => (
                  <S.Row key={product.id}>
                    <IconBubble $tone={product.quantity <= product.minQuantity ? 'warning' : 'neutral'}>
                      <Package aria-hidden />
                    </IconBubble>
                    <S.RowBody>
                      <strong>{product.name}</strong>
                      <span>
                        {product.sku} — saldo {formatQuantity(product.quantity, product.unit)}
                      </span>
                    </S.RowBody>
                    <S.RowAside>
                      <strong>{formatQuantity(quantity, product.unit)}</strong>
                      {movements} {movements === 1 ? 'saída' : 'saídas'}
                    </S.RowAside>
                  </S.Row>
                ))}
              </S.List>
            </Card>
          </S.Third>
        </>
      ) : (
        <div style={{ gridColumn: '1 / -1' }}>
          <Card>
            <CardHeader>
              <CardTitle>Últimas solicitações</CardTitle>
              <Button size="sm" asChild>
                <Link to="/solicitacoes?nova=1">
                  <Plus aria-hidden /> Nova solicitação
                </Link>
              </Button>
            </CardHeader>
            {c.myRecentLoading && <ListSkeleton />}
            {c.myRecent?.length === 0 && (
              <EmptyState
                icon={<ClipboardList />}
                title="Você ainda não abriu solicitações"
                description="Peça um serviço ou material e acompanhe o andamento por aqui."
              />
            )}
            <S.List>
              {c.myRecent?.map((r) => (
                <li key={r.id}>
                  <S.RowLink to={`/solicitacoes/${r.id}`}>
                    <IconBubble $tone={STATUS_TONE[r.status]}>
                      <ClipboardList aria-hidden />
                    </IconBubble>
                    <S.RowBody>
                      <strong>{r.title}</strong>
                      <span>
                        {r.code} — aberta {formatRelative(r.createdAt)}
                      </span>
                    </S.RowBody>
                    <Badge $tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                  </S.RowLink>
                </li>
              ))}
            </S.List>
          </Card>
        </div>
      )}
    </S.Grid>
  );
}

function AlertRow(props: { to: string; tone: Tone; icon: LucideIcon; title: string; detail: string }) {
  const Icon = props.icon;
  return (
    <li>
      <S.RowLink to={props.to} $tone={props.tone}>
        <S.AlertIcon $tone={props.tone}>
          <Icon aria-hidden />
        </S.AlertIcon>
        <S.RowBody>
          <strong>{props.title}</strong>
          <span>{props.detail}</span>
        </S.RowBody>
        <ChevronRight aria-hidden />
      </S.RowLink>
    </li>
  );
}
