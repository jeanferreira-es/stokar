import { API_VERSION } from '../config/version';

/**
 * Documento OpenAPI 3 da API, montado à mão com alguns atalhos.
 * Ao criar ou alterar uma rota em src/modules, atualize a entrada correspondente aqui.
 */
type Schema = Record<string, unknown>;

const ref = (name: string): Schema => ({ $ref: `#/components/schemas/${name}` });
const str = (extra: Schema = {}): Schema => ({ type: 'string', ...extra });
const num = (extra: Schema = {}): Schema => ({ type: 'number', ...extra });
const int = (extra: Schema = {}): Schema => ({ type: 'integer', ...extra });
const bool: Schema = { type: 'boolean' };
const uuid: Schema = { type: 'string', format: 'uuid' };
const date: Schema = { type: 'string', format: 'date', example: '2026-11-12' };
const dateTime: Schema = { type: 'string', format: 'date-time' };
const nullable = (schema: Schema): Schema => ({ ...schema, nullable: true });
const oneOf = (...values: string[]): Schema => ({ type: 'string', enum: values });
const arr = (items: Schema): Schema => ({ type: 'array', items });
const obj = (properties: Record<string, Schema>, required: string[] = []): Schema => ({
  type: 'object',
  properties,
  ...(required.length ? { required } : {}),
});
const page = (name: string): Schema => obj({ items: arr(ref(name)), meta: ref('PageMeta') });

const ROLE = oneOf('ADMIN', 'MANAGER', 'OPERATOR', 'REQUESTER', 'CLIENT');
const REQUEST_STATUS = oneOf('OPEN', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED');
const PRIORITY = oneOf('LOW', 'MEDIUM', 'HIGH', 'URGENT');
const timestamps = { createdAt: dateTime, updatedAt: dateTime };

const schemas: Record<string, Schema> = {
  Error: obj({
    error: obj({
      status: int({ example: 400 }),
      message: str({ example: 'Dados inválidos' }),
      details: { description: 'Detalhes por campo (validação) ou dados da regra violada' },
    }),
  }),
  PageMeta: obj({ page: int(), limit: int(), total: int(), totalPages: int() }),
  User: obj({
    id: uuid,
    name: str(),
    email: str({ format: 'email' }),
    phone: nullable(str()),
    role: ROLE,
    customerId: nullable({ ...uuid, description: 'Preenchido no perfil CLIENT' }),
    active: bool,
    emailNotifications: bool,
    ...timestamps,
  }),
  AuthTokens: obj({
    tokenType: str({ example: 'Bearer' }),
    accessToken: str(),
    refreshToken: str(),
    expiresIn: str({ example: '15m' }),
  }),
  AuthSession: { allOf: [ref('AuthTokens'), obj({ user: ref('User') })] },
  Category: obj({ id: uuid, name: str(), description: nullable(str()), ...timestamps }),
  Supplier: obj({
    id: uuid,
    name: str(),
    document: nullable(str()),
    email: nullable(str()),
    phone: nullable(str()),
    active: bool,
    ...timestamps,
  }),
  Product: obj({
    id: uuid,
    sku: str(),
    name: str(),
    description: nullable(str()),
    unit: str({ example: 'UN' }),
    quantity: num({ description: 'Saldo atual; só muda por movimentações' }),
    minQuantity: num(),
    costPrice: num({ description: 'Custo médio ponderado' }),
    salePrice: num({ description: 'Preço de venda sugerido quando a peça entra em um serviço' }),
    location: nullable(str()),
    active: bool,
    categoryId: nullable(uuid),
    category: nullable(ref('Category')),
    lowStock: bool,
    ...timestamps,
  }),
  StockMovement: obj({
    id: uuid,
    type: oneOf('IN', 'OUT', 'ADJUSTMENT'),
    quantity: num(),
    balanceBefore: num(),
    balanceAfter: num(),
    unitCost: nullable(num()),
    reason: nullable(str()),
    document: nullable(str()),
    productId: uuid,
    createdAt: dateTime,
  }),
  Customer: obj({
    id: uuid,
    type: oneOf('PERSON', 'COMPANY'),
    name: str({ description: 'Nome da pessoa ou razão social' }),
    tradeName: nullable(str({ description: 'Nome fantasia' })),
    document: nullable(str({ description: 'CPF ou CNPJ, somente dígitos' })),
    email: nullable(str()),
    phone: nullable(str()),
    address: nullable(str()),
    notes: nullable(str({ description: 'Anotações internas (não enviadas ao cliente)' })),
    active: bool,
    ...timestamps,
  }),
  CustomerInput: obj(
    {
      type: oneOf('PERSON', 'COMPANY'),
      name: str(),
      tradeName: nullable(str()),
      document: nullable(str({ example: '12.345.678/0001-90' })),
      email: nullable(str()),
      phone: nullable(str()),
      address: nullable(str()),
      notes: nullable(str()),
      active: bool,
    },
    ['name'],
  ),
  CustomerProfile: {
    allOf: [
      ref('Customer'),
      obj({
        vehicles: arr(ref('Vehicle')),
        contracts: arr(ref('Contract')),
        users: arr(ref('User')),
      }),
    ],
  },
  Vehicle: obj({
    id: uuid,
    customerId: uuid,
    plate: nullable(str({ example: 'ABC1D23' })),
    brand: nullable(str()),
    model: str(),
    year: nullable(int()),
    color: nullable(str()),
    notes: nullable(str()),
    active: bool,
    ...timestamps,
  }),
  VehicleInput: obj(
    {
      customerId: { ...uuid, description: 'Obrigatório para a equipe; ignorado para o perfil CLIENT' },
      plate: nullable(str()),
      brand: nullable(str()),
      model: str(),
      year: nullable(int()),
      color: nullable(str()),
      notes: nullable(str()),
    },
    ['model'],
  ),
  ServiceType: obj({ id: uuid, name: str({ example: 'Pneus' }), description: nullable(str()), active: bool, ...timestamps }),
  Service: obj({
    id: uuid,
    name: str({ example: 'Trocar pneu' }),
    description: nullable(str()),
    price: num({ example: 80 }),
    estimatedMinutes: nullable(int()),
    active: bool,
    serviceTypeId: nullable(uuid),
    serviceType: nullable(ref('ServiceType')),
    contractPrice: num({ description: 'Presente quando a listagem recebe `contractId`' }),
    ...timestamps,
  }),
  ServiceInput: obj(
    {
      name: str(),
      description: nullable(str()),
      price: num(),
      estimatedMinutes: nullable(int()),
      serviceTypeId: nullable(uuid),
      active: bool,
    },
    ['name', 'price'],
  ),
  Contract: obj({
    id: uuid,
    number: int(),
    code: str({ example: 'CT-000007' }),
    title: str(),
    description: nullable(str()),
    status: oneOf('ACTIVE', 'SUSPENDED', 'ENDED'),
    startDate: date,
    endDate: nullable(date),
    monthlyValue: nullable(num()),
    discountPercent: num({ description: 'Desconto (%) nos serviços sem preço negociado' }),
    usable: { ...bool, description: 'Ativo e dentro da vigência' },
    customerId: uuid,
    customer: obj({ id: uuid, name: str(), tradeName: nullable(str()), document: nullable(str()) }),
    services: arr(
      obj({ id: uuid, serviceId: uuid, price: num(), service: obj({ id: uuid, name: str(), price: num() }) }),
    ),
    ...timestamps,
  }),
  ContractInput: obj(
    {
      customerId: uuid,
      title: str(),
      description: nullable(str()),
      status: oneOf('ACTIVE', 'SUSPENDED', 'ENDED'),
      startDate: date,
      endDate: nullable(date),
      monthlyValue: nullable(num()),
      discountPercent: num({ minimum: 0, maximum: 100 }),
      services: arr(obj({ serviceId: uuid, price: num() }, ['serviceId', 'price'])),
    },
    ['customerId', 'title', 'startDate'],
  ),
  ServiceRequest: obj({
    id: uuid,
    number: int(),
    code: str({ example: 'SS-000042' }),
    title: str(),
    description: str(),
    priority: PRIORITY,
    status: REQUEST_STATUS,
    statusReason: nullable(str()),
    resolutionNotes: nullable(str()),
    dueDate: nullable(date),
    origin: oneOf('WEB', 'APP'),
    discount: num(),
    requesterId: uuid,
    requester: obj({ id: uuid, name: str(), email: str() }),
    assigneeId: nullable(uuid),
    assignee: nullable(obj({ id: uuid, name: str(), email: str() })),
    customerId: nullable(uuid),
    customer: nullable(obj({ id: uuid, type: str(), name: str(), tradeName: nullable(str()), document: nullable(str()), phone: nullable(str()) })),
    contractId: nullable(uuid),
    contract: nullable(obj({ id: uuid, code: str(), title: str() })),
    vehicleId: nullable(uuid),
    vehicle: nullable(obj({ id: uuid, plate: nullable(str()), brand: nullable(str()), model: str(), year: nullable(int()), color: nullable(str()) })),
    services: arr(
      obj({ id: uuid, serviceId: nullable(uuid), description: str(), quantity: num(), unitPrice: num(), total: num() }),
    ),
    items: arr(
      obj({
        id: uuid,
        productId: uuid,
        quantity: num(),
        unitPrice: num(),
        total: num(),
        product: obj({ id: uuid, sku: str(), name: str(), unit: str(), available: num({ description: 'Somente para a equipe' }) }),
      }),
    ),
    totals: obj({ services: num(), parts: num(), discount: num(), total: num() }),
    invoice: nullable(obj({ id: uuid, code: str(), total: num(), issuedAt: dateTime })),
    approvedAt: nullable(dateTime),
    startedAt: nullable(dateTime),
    completedAt: nullable(dateTime),
    ...timestamps,
  }),
  ServiceRequestInput: obj(
    {
      title: str({ example: 'Troca dos pneus dianteiros' }),
      description: str(),
      priority: PRIORITY,
      dueDate: nullable(date),
      customerId: nullable({ ...uuid, description: 'Equipe: cliente atendido. Perfil CLIENT: ignorado (usa o próprio cadastro)' }),
      contractId: nullable({ ...uuid, description: 'Contrato vigente do cliente; define os preços' }),
      vehicleId: nullable(uuid),
      origin: oneOf('WEB', 'APP'),
      discount: num({ description: 'Somente equipe' }),
      services: arr(
        obj({
          serviceId: { ...uuid, description: 'Serviço do catálogo. Sem ele, a linha é avulsa (somente equipe)' },
          description: str(),
          quantity: num({ default: 1 }),
          unitPrice: num({ description: 'Somente equipe: sobrepõe o valor do catálogo/contrato' }),
        }),
      ),
      items: arr(
        obj(
          { productId: uuid, quantity: num(), unitPrice: num({ description: 'Padrão: preço de venda do produto' }) },
          ['productId', 'quantity'],
        ),
      ),
    },
    ['title', 'description'],
  ),
  InvoiceParty: obj({
    name: str(),
    document: nullable(str()),
    email: nullable(str()),
    phone: nullable(str()),
    address: nullable(str()),
  }),
  Invoice: obj({
    id: uuid,
    number: int(),
    code: str({ example: 'NS-000015' }),
    status: oneOf('ISSUED', 'CANCELLED'),
    serviceRequestId: uuid,
    customerId: nullable(uuid),
    issuer: ref('InvoiceParty'),
    recipient: nullable(ref('InvoiceParty')),
    reference: obj({
      requestCode: str(),
      title: str(),
      vehicle: nullable(str()),
      contractCode: nullable(str()),
      completedAt: nullable(dateTime),
    }),
    lines: arr(
      obj({
        kind: oneOf('SERVICE', 'PART'),
        description: str(),
        quantity: num(),
        unit: nullable(str()),
        unitPrice: num(),
        total: num(),
      }),
    ),
    servicesTotal: num(),
    partsTotal: num(),
    discount: num(),
    total: num(),
    notes: nullable(str()),
    issuedById: nullable(uuid),
    issuedAt: dateTime,
    cancelledAt: nullable(dateTime),
    cancelReason: nullable(str()),
  }),
  CompanySettings: obj({
    id: int({ example: 1 }),
    name: str(),
    document: nullable(str()),
    email: nullable(str()),
    phone: nullable(str()),
    address: nullable(str()),
    invoiceFooter: nullable(str({ description: 'Texto padrão no rodapé das notas' })),
    updatedAt: dateTime,
  }),
  Conversation: obj({
    id: uuid,
    userId: uuid,
    customerId: nullable(uuid),
    user: obj({ id: uuid, name: str(), email: str(), phone: nullable(str()) }),
    customer: nullable(obj({ id: uuid, name: str(), tradeName: nullable(str()) })),
    lastMessageAt: nullable(dateTime),
    lastMessagePreview: nullable(str()),
    unread: int({ description: 'Mensagens ainda não lidas por quem está consultando' }),
    createdAt: dateTime,
  }),
  ChatMessage: obj({
    id: uuid,
    conversationId: uuid,
    fromStaff: { ...bool, description: 'true = enviada pela equipe da oficina' },
    body: str(),
    sender: nullable(obj({ id: uuid, name: str() })),
    createdAt: dateTime,
  }),
  Notification: obj({
    id: uuid,
    type: oneOf(
      'LOW_STOCK',
      'OUT_OF_STOCK',
      'REQUEST_CREATED',
      'REQUEST_APPROVED',
      'REQUEST_REJECTED',
      'REQUEST_STARTED',
      'REQUEST_COMPLETED',
      'REQUEST_CANCELLED',
      'REQUEST_ASSIGNED',
      'INVOICE_ISSUED',
      'CHAT_MESSAGE',
    ),
    title: str(),
    message: str(),
    data: nullable({ type: 'object', additionalProperties: true }),
    readAt: nullable(dateTime),
    createdAt: dateTime,
  }),
};

/* ---------- Operações ---------- */

interface Operation {
  tag: string;
  summary: string;
  description?: string;
  /** Perfis que podem chamar. Sem isso: qualquer usuário autenticado. */
  roles?: string;
  public?: boolean;
  query?: Record<string, Schema>;
  body?: Schema;
  /** [status, descrição, schema] */
  ok?: [number, string, Schema?];
  errors?: number[];
}

const ERROR_TEXT: Record<number, string> = {
  400: 'Dados inválidos',
  401: 'Não autenticado ou token expirado',
  403: 'Perfil sem permissão',
  404: 'Registro não encontrado (ou fora do seu alcance)',
  409: 'Conflito com o estado atual do registro',
};

const paths: Record<string, Record<string, unknown>> = {};

function add(method: 'get' | 'post' | 'put' | 'patch' | 'delete', path: string, op: Operation): void {
  const [status, text, schema] = op.ok ?? [200, 'OK'];
  const errors = new Set([...(op.errors ?? []), ...(op.public ? [] : [401]), ...(op.roles ? [403] : [])]);
  if (op.body) errors.add(400);
  if (path.includes('{')) errors.add(404);

  const pathParams = [...path.matchAll(/\{(\w+)\}/g)].map(([, name]) => ({
    name,
    in: 'path',
    required: true,
    schema: uuid,
  }));
  const queryParams = Object.entries(op.query ?? {}).map(([name, schema]) => {
    const { description, ...rest } = schema as { description?: string };
    return { name, in: 'query', required: false, schema: rest, ...(description ? { description } : {}) };
  });

  const description = [op.description, op.roles ? `**Perfis:** ${op.roles}.` : null].filter(Boolean).join('\n\n');

  (paths[path] ??= {})[method] = {
    tags: [op.tag],
    summary: op.summary,
    ...(description ? { description } : {}),
    ...(op.public ? { security: [] } : {}),
    ...(pathParams.length + queryParams.length ? { parameters: [...pathParams, ...queryParams] } : {}),
    ...(op.body ? { requestBody: { required: true, content: { 'application/json': { schema: op.body } } } } : {}),
    responses: {
      [status]: schema ? { description: text, content: { 'application/json': { schema } } } : { description: text },
      ...Object.fromEntries(
        [...errors].sort().map((code) => [
          code,
          { description: ERROR_TEXT[code], content: { 'application/json': { schema: ref('Error') } } },
        ]),
      ),
    },
  };
}

const paging = { page: int({ minimum: 1, default: 1 }), limit: int({ minimum: 1, maximum: 100, default: 20 }) };
const search = str({ description: 'Busca textual' });
const STAFF = 'ADMIN, MANAGER, OPERATOR';
const MANAGERS = 'ADMIN, MANAGER';
const STAFF_OR_CLIENT = 'ADMIN, MANAGER, OPERATOR, CLIENT (o cliente só enxerga o que é dele)';
const INTERNAL = 'ADMIN, MANAGER, OPERATOR, REQUESTER';
const partial = (name: string): Schema => ({ allOf: [ref(name)], description: 'Envie apenas os campos que mudam' });

/* Sistema */
add('get', '/health', { tag: 'Sistema', summary: 'Situação da API e do banco', public: true });

/* Autenticação */
const credentials = obj({ email: str({ format: 'email' }), password: str({ minLength: 8 }) }, ['email', 'password']);
add('post', '/auth/register', {
  tag: 'Autenticação',
  summary: 'Cadastro interno',
  description: 'O primeiro usuário cadastrado vira ADMIN; os demais entram como REQUESTER (se ALLOW_PUBLIC_REGISTRATION=true).',
  public: true,
  body: obj({ name: str(), email: str({ format: 'email' }), password: str({ minLength: 8 }) }, ['name', 'email', 'password']),
  ok: [201, 'Usuário criado, já com os tokens', ref('AuthSession')],
  errors: [403, 409],
});
add('post', '/auth/register-client', {
  tag: 'Autenticação',
  summary: 'Cadastro do cliente pelo aplicativo',
  description:
    'Cria o cadastro do cliente (pessoa ou empresa) e o usuário de acesso com perfil CLIENT. Controlado por ALLOW_CLIENT_REGISTRATION.',
  public: true,
  body: obj(
    {
      name: str({ description: 'Nome de quem vai usar o aplicativo' }),
      email: str({ format: 'email' }),
      password: str({ minLength: 8 }),
      phone: str(),
      customerType: oneOf('PERSON', 'COMPANY'),
      companyName: str({ description: 'Obrigatório quando customerType = COMPANY' }),
      document: str({ description: 'CPF ou CNPJ' }),
    },
    ['name', 'email', 'password'],
  ),
  ok: [201, 'Conta criada, já com os tokens', ref('AuthSession')],
  errors: [403, 409],
});
add('post', '/auth/login', {
  tag: 'Autenticação',
  summary: 'Login',
  public: true,
  body: credentials,
  ok: [200, 'Sessão iniciada', ref('AuthSession')],
  errors: [401, 403],
});
add('post', '/auth/refresh', {
  tag: 'Autenticação',
  summary: 'Troca o refresh token por um novo par de tokens',
  public: true,
  body: obj({ refreshToken: str() }, ['refreshToken']),
  ok: [200, 'Novos tokens', ref('AuthTokens')],
  errors: [401],
});
add('post', '/auth/logout', { tag: 'Autenticação', summary: 'Encerra todas as sessões do usuário', ok: [204, 'Sessões encerradas'] });
add('get', '/auth/me', { tag: 'Autenticação', summary: 'Usuário autenticado', ok: [200, 'OK', ref('User')] });
add('patch', '/auth/me', {
  tag: 'Autenticação',
  summary: 'Atualiza nome, telefone e preferência de e-mail',
  body: obj({ name: str(), phone: nullable(str()), emailNotifications: bool }),
  ok: [200, 'OK', ref('User')],
});
add('post', '/auth/change-password', {
  tag: 'Autenticação',
  summary: 'Troca a senha e encerra as outras sessões',
  body: obj({ currentPassword: str(), newPassword: str({ minLength: 8 }) }, ['currentPassword', 'newPassword']),
  ok: [200, 'Novos tokens', ref('AuthTokens')],
});
add('delete', '/auth/me', {
  tag: 'Autenticação',
  summary: 'Exclui a própria conta',
  description:
    'Desativa a conta e anonimiza nome, e-mail e telefone do usuário. O histórico de serviços e notas permanece no cadastro do cliente.',
  roles: 'CLIENT, REQUESTER',
  body: obj({ password: str() }, ['password']),
  ok: [204, 'Conta excluída'],
});

/* Usuários */
const userInput = obj(
  {
    name: str(),
    email: str({ format: 'email' }),
    password: str({ minLength: 8 }),
    role: ROLE,
    phone: nullable(str()),
    customerId: nullable({ ...uuid, description: 'Obrigatório para o perfil CLIENT' }),
  },
  ['name', 'email', 'password'],
);
add('get', '/users', {
  tag: 'Usuários',
  summary: 'Lista usuários',
  roles: MANAGERS,
  query: { ...paging, search, role: ROLE, active: bool, customerId: uuid },
  ok: [200, 'OK', page('User')],
});
add('post', '/users', { tag: 'Usuários', summary: 'Cria usuário', roles: 'ADMIN', body: userInput, ok: [201, 'Criado', ref('User')], errors: [409] });
add('get', '/users/{id}', { tag: 'Usuários', summary: 'Detalhe', roles: MANAGERS, ok: [200, 'OK', ref('User')] });
add('patch', '/users/{id}', {
  tag: 'Usuários',
  summary: 'Atualiza usuário',
  description: 'Trocar a senha, o perfil ou desativar encerra as sessões do usuário.',
  roles: 'ADMIN',
  body: obj({ name: str(), role: ROLE, active: bool, password: str({ minLength: 8 }), phone: nullable(str()), customerId: nullable(uuid) }),
  ok: [200, 'OK', ref('User')],
});
add('delete', '/users/{id}', { tag: 'Usuários', summary: 'Desativa usuário', roles: 'ADMIN', ok: [204, 'Desativado'] });

/* Estoque: categorias, fornecedores, produtos, movimentações */
function crud(tag: string, base: string, name: string, input: Schema, options: { read: string; write: string; remove: string; query?: Record<string, Schema> }) {
  add('get', base, { tag, summary: 'Lista', roles: options.read, query: { ...paging, search, ...options.query }, ok: [200, 'OK', page(name)] });
  add('post', base, { tag, summary: 'Cria', roles: options.write, body: input, ok: [201, 'Criado', ref(name)], errors: [409] });
  add('get', `${base}/{id}`, { tag, summary: 'Detalhe', roles: options.read, ok: [200, 'OK', ref(name)] });
  add('patch', `${base}/{id}`, { tag, summary: 'Atualiza', roles: options.write, body: input, ok: [200, 'OK', ref(name)], errors: [409] });
  add('delete', `${base}/{id}`, { tag, summary: options.remove, roles: options.write === STAFF_OR_CLIENT ? STAFF_OR_CLIENT : MANAGERS, ok: [204, 'Feito'] });
}
crud('Estoque · Categorias', '/categories', 'Category', obj({ name: str(), description: nullable(str()) }, ['name']), {
  read: INTERNAL,
  write: MANAGERS,
  remove: 'Exclui (os produtos ficam sem categoria)',
});
crud(
  'Estoque · Fornecedores',
  '/suppliers',
  'Supplier',
  obj({ name: str(), document: nullable(str()), email: nullable(str()), phone: nullable(str()), active: bool }, ['name']),
  { read: STAFF, write: MANAGERS, remove: 'Desativa', query: { active: bool } },
);
crud(
  'Estoque · Produtos',
  '/products',
  'Product',
  obj(
    {
      sku: str(),
      name: str(),
      description: nullable(str()),
      unit: str(),
      minQuantity: num(),
      costPrice: num(),
      salePrice: num(),
      location: nullable(str()),
      categoryId: nullable(uuid),
      active: bool,
    },
    ['sku', 'name'],
  ),
  { read: INTERNAL, write: MANAGERS, remove: 'Desativa', query: { categoryId: uuid, active: bool, lowStock: bool } },
);
add('post', '/stock/entries', {
  tag: 'Estoque · Movimentações',
  summary: 'Entrada',
  roles: STAFF,
  body: obj(
    { productId: uuid, quantity: num(), unitCost: num(), supplierId: uuid, document: str(), reason: str() },
    ['productId', 'quantity'],
  ),
  ok: [201, 'Movimentação registrada', ref('StockMovement')],
});
add('post', '/stock/exits', {
  tag: 'Estoque · Movimentações',
  summary: 'Saída',
  roles: STAFF,
  body: obj({ productId: uuid, quantity: num(), document: str(), reason: str() }, ['productId', 'quantity']),
  ok: [201, 'Movimentação registrada', ref('StockMovement')],
  errors: [409],
});
add('post', '/stock/adjustments', {
  tag: 'Estoque · Movimentações',
  summary: 'Ajuste de inventário (define o novo saldo)',
  roles: MANAGERS,
  body: obj({ productId: uuid, newQuantity: num(), reason: str() }, ['productId', 'newQuantity', 'reason']),
  ok: [201, 'Movimentação registrada', ref('StockMovement')],
});
add('get', '/stock/movements', {
  tag: 'Estoque · Movimentações',
  summary: 'Histórico de movimentações',
  roles: STAFF,
  query: { ...paging, productId: uuid, type: oneOf('IN', 'OUT', 'ADJUSTMENT'), from: date, to: date },
  ok: [200, 'OK', page('StockMovement')],
});
add('get', '/stock/movements/{id}', { tag: 'Estoque · Movimentações', summary: 'Detalhe', roles: STAFF, ok: [200, 'OK', ref('StockMovement')] });

/* Clientes e veículos */
add('get', '/customers/me', {
  tag: 'Clientes',
  summary: 'Cadastro do cliente autenticado (aplicativo)',
  roles: 'CLIENT',
  ok: [200, 'Cadastro com veículos e contratos', ref('CustomerProfile')],
});
add('patch', '/customers/me', {
  tag: 'Clientes',
  summary: 'O cliente atualiza o próprio cadastro',
  roles: 'CLIENT',
  body: obj({ name: str(), tradeName: nullable(str()), document: nullable(str()), email: nullable(str()), phone: nullable(str()), address: nullable(str()) }),
  ok: [200, 'OK', ref('CustomerProfile')],
  errors: [409],
});
add('get', '/customers', {
  tag: 'Clientes',
  summary: 'Lista clientes',
  roles: STAFF,
  query: { ...paging, search, type: oneOf('PERSON', 'COMPANY'), active: bool },
  ok: [200, 'OK', page('Customer')],
});
add('post', '/customers', { tag: 'Clientes', summary: 'Cadastra cliente', roles: STAFF, body: ref('CustomerInput'), ok: [201, 'Criado', ref('Customer')], errors: [409] });
add('get', '/customers/{id}', {
  tag: 'Clientes',
  summary: 'Cadastro com veículos, contratos e acessos ao aplicativo',
  roles: STAFF,
  ok: [200, 'OK', ref('CustomerProfile')],
});
add('patch', '/customers/{id}', { tag: 'Clientes', summary: 'Atualiza cliente', roles: STAFF, body: partial('CustomerInput'), ok: [200, 'OK', ref('Customer')], errors: [409] });
add('delete', '/customers/{id}', { tag: 'Clientes', summary: 'Desativa cliente', roles: MANAGERS, ok: [204, 'Desativado'] });
add('post', '/customers/{id}/users', {
  tag: 'Clientes',
  summary: 'Cria um acesso ao aplicativo para o cliente',
  roles: MANAGERS,
  body: obj({ name: str(), email: str({ format: 'email' }), password: str({ minLength: 8 }), phone: nullable(str()) }, ['name', 'email', 'password']),
  ok: [201, 'Usuário CLIENT criado', ref('User')],
  errors: [409],
});

add('get', '/vehicles', {
  tag: 'Veículos',
  summary: 'Lista veículos/equipamentos',
  roles: STAFF_OR_CLIENT,
  query: { ...paging, search, customerId: uuid, active: bool },
  ok: [200, 'OK', page('Vehicle')],
});
add('post', '/vehicles', { tag: 'Veículos', summary: 'Cadastra veículo', roles: STAFF_OR_CLIENT, body: ref('VehicleInput'), ok: [201, 'Criado', ref('Vehicle')], errors: [409] });
add('get', '/vehicles/{id}', { tag: 'Veículos', summary: 'Detalhe', roles: STAFF_OR_CLIENT, ok: [200, 'OK', ref('Vehicle')] });
add('patch', '/vehicles/{id}', { tag: 'Veículos', summary: 'Atualiza veículo', roles: STAFF_OR_CLIENT, body: partial('VehicleInput'), ok: [200, 'OK', ref('Vehicle')], errors: [409] });
add('delete', '/vehicles/{id}', { tag: 'Veículos', summary: 'Desativa veículo', roles: STAFF_OR_CLIENT, ok: [204, 'Desativado'] });

/* Catálogo de serviços */
add('get', '/service-types', {
  tag: 'Catálogo de serviços',
  summary: 'Lista os tipos de serviço',
  description: 'Quem não é da equipe recebe apenas os ativos.',
  query: { ...paging, search, active: bool },
  ok: [200, 'OK', page('ServiceType')],
});
const typeInput = obj({ name: str(), description: nullable(str()), active: bool }, ['name']);
add('post', '/service-types', { tag: 'Catálogo de serviços', summary: 'Cria tipo de serviço', roles: MANAGERS, body: typeInput, ok: [201, 'Criado', ref('ServiceType')], errors: [409] });
add('get', '/service-types/{id}', { tag: 'Catálogo de serviços', summary: 'Detalhe do tipo', ok: [200, 'OK', ref('ServiceType')] });
add('patch', '/service-types/{id}', { tag: 'Catálogo de serviços', summary: 'Atualiza tipo de serviço', roles: MANAGERS, body: typeInput, ok: [200, 'OK', ref('ServiceType')], errors: [409] });
add('delete', '/service-types/{id}', { tag: 'Catálogo de serviços', summary: 'Exclui tipo (os serviços ficam sem tipo)', roles: MANAGERS, ok: [204, 'Excluído'] });
add('get', '/services', {
  tag: 'Catálogo de serviços',
  summary: 'Lista os serviços e valores',
  description: 'Com `contractId`, cada serviço traz `contractPrice`: o valor negociado ou o valor padrão com o desconto do contrato.',
  query: { ...paging, search, serviceTypeId: uuid, active: bool, contractId: uuid },
  ok: [200, 'OK', page('Service')],
});
add('post', '/services', { tag: 'Catálogo de serviços', summary: 'Cadastra serviço', roles: MANAGERS, body: ref('ServiceInput'), ok: [201, 'Criado', ref('Service')] });
add('get', '/services/{id}', { tag: 'Catálogo de serviços', summary: 'Detalhe do serviço', ok: [200, 'OK', ref('Service')] });
add('patch', '/services/{id}', { tag: 'Catálogo de serviços', summary: 'Atualiza serviço', roles: MANAGERS, body: partial('ServiceInput'), ok: [200, 'OK', ref('Service')] });
add('delete', '/services/{id}', { tag: 'Catálogo de serviços', summary: 'Desativa serviço', roles: MANAGERS, ok: [204, 'Desativado'] });

/* Contratos */
add('get', '/contracts', {
  tag: 'Contratos',
  summary: 'Lista contratos',
  roles: STAFF_OR_CLIENT,
  query: { ...paging, search, customerId: uuid, status: oneOf('ACTIVE', 'SUSPENDED', 'ENDED') },
  ok: [200, 'OK', page('Contract')],
});
add('post', '/contracts', { tag: 'Contratos', summary: 'Cria contrato', roles: MANAGERS, body: ref('ContractInput'), ok: [201, 'Criado', ref('Contract')] });
add('get', '/contracts/{id}', { tag: 'Contratos', summary: 'Contrato com a tabela de preços', roles: STAFF_OR_CLIENT, ok: [200, 'OK', ref('Contract')] });
add('patch', '/contracts/{id}', {
  tag: 'Contratos',
  summary: 'Atualiza contrato',
  description: 'O cliente do contrato não muda. `services`, quando enviado, substitui a tabela de preços.',
  roles: MANAGERS,
  body: partial('ContractInput'),
  ok: [200, 'OK', ref('Contract')],
});

/* Solicitações de serviço */
const REQ = 'Solicitações de serviço';
add('get', '/service-requests', {
  tag: REQ,
  summary: 'Lista solicitações',
  description: 'Quem não é da equipe vê apenas o que abriu ou o que é do seu cadastro de cliente.',
  query: {
    ...paging,
    search,
    status: REQUEST_STATUS,
    priority: PRIORITY,
    requesterId: uuid,
    assigneeId: uuid,
    customerId: uuid,
    vehicleId: uuid,
    contractId: uuid,
  },
  ok: [200, 'OK', page('ServiceRequest')],
});
add('post', '/service-requests', {
  tag: REQ,
  summary: 'Abre uma solicitação (ou registra um serviço)',
  description:
    'Cliente (aplicativo): abre para o próprio cadastro escolhendo serviços do catálogo; os valores vêm do catálogo/contrato.\n\n' +
    'Equipe: registra o serviço para qualquer cliente, com serviços (inclusive avulsos), peças do estoque e desconto.',
  body: ref('ServiceRequestInput'),
  ok: [201, 'Solicitação aberta', ref('ServiceRequest')],
  errors: [403, 409],
});
add('get', '/service-requests/{id}', { tag: REQ, summary: 'Detalhe com serviços, peças, totais e nota', ok: [200, 'OK', ref('ServiceRequest')] });
add('patch', '/service-requests/{id}', {
  tag: REQ,
  summary: 'Edita a solicitação',
  description:
    'Dono: enquanto estiver aberta. Equipe: até a conclusão. `services` e `items`, quando enviados, substituem as listas. ' +
    'Bloqueado se já houver nota emitida.',
  body: partial('ServiceRequestInput'),
  ok: [200, 'OK', ref('ServiceRequest')],
  errors: [403, 409],
});
const action = (name: string, summary: string, roles: string | undefined, body?: Schema, description?: string) =>
  add('post', `/service-requests/{id}/${name}`, {
    tag: REQ,
    summary,
    description,
    roles,
    body,
    ok: [200, 'Solicitação atualizada', ref('ServiceRequest')],
    errors: [409],
  });
action('approve', 'Aprova (OPEN → APPROVED)', MANAGERS, obj({ assigneeId: uuid }));
action('reject', 'Rejeita (OPEN → REJECTED)', MANAGERS, obj({ reason: str() }, ['reason']));
action('assign', 'Define ou troca o responsável', MANAGERS, obj({ assigneeId: uuid }, ['assigneeId']));
action('start', 'Inicia o atendimento (APPROVED → IN_PROGRESS)', STAFF);
action(
  'complete',
  'Conclui e dá baixa nas peças (IN_PROGRESS → COMPLETED)',
  STAFF,
  obj({ resolutionNotes: str() }),
  'Tudo em uma transação: se faltar saldo de qualquer peça, nada é baixado (409).',
);
action('cancel', 'Cancela (OPEN/APPROVED → CANCELLED)', undefined, obj({ reason: str() }), 'Dono da solicitação ou gestor.');

/* Notas de serviço */
add('get', '/invoices', {
  tag: 'Notas de serviço',
  summary: 'Lista notas',
  roles: STAFF_OR_CLIENT,
  query: { ...paging, search, status: oneOf('ISSUED', 'CANCELLED'), customerId: uuid, serviceRequestId: uuid, from: date, to: date },
  ok: [200, 'OK', page('Invoice')],
});
add('post', '/invoices', {
  tag: 'Notas de serviço',
  summary: 'Emite a nota de uma solicitação concluída',
  description: 'Documento não fiscal. Guarda uma cópia dos dados da oficina, do cliente, dos serviços, das peças e dos valores.',
  roles: STAFF,
  body: obj({ serviceRequestId: uuid, notes: str({ description: 'Observações impressas na nota' }) }, ['serviceRequestId']),
  ok: [201, 'Nota emitida', ref('Invoice')],
  errors: [404, 409],
});
add('get', '/invoices/{id}', { tag: 'Notas de serviço', summary: 'Detalhe', roles: STAFF_OR_CLIENT, ok: [200, 'OK', ref('Invoice')] });
add('get', '/invoices/{id}/pdf', { tag: 'Notas de serviço', summary: 'Nota em PDF', roles: STAFF_OR_CLIENT });
(paths['/invoices/{id}/pdf'].get as { responses: Record<string, unknown> }).responses[200] = {
  description: 'Arquivo PDF',
  content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
};
add('post', '/invoices/{id}/cancel', {
  tag: 'Notas de serviço',
  summary: 'Cancela a nota',
  description: 'Depois do cancelamento, a solicitação pode receber uma nova nota.',
  roles: MANAGERS,
  body: obj({ reason: str() }, ['reason']),
  ok: [200, 'Nota cancelada', ref('Invoice')],
  errors: [409],
});

/* Chat */
add('get', '/chat/unread-count', {
  tag: 'Chat',
  summary: 'Mensagens não lidas',
  ok: [200, 'OK', obj({ count: int(), conversations: int() })],
});
add('get', '/chat/conversations/mine', {
  tag: 'Chat',
  summary: 'Conversa do usuário do aplicativo com a oficina',
  description: 'Criada automaticamente no primeiro acesso.',
  roles: 'CLIENT, REQUESTER',
  ok: [200, 'OK', ref('Conversation')],
});
add('get', '/chat/conversations', {
  tag: 'Chat',
  summary: 'Caixa de entrada da equipe',
  roles: STAFF,
  query: { ...paging, search, unread: bool },
  ok: [200, 'OK', page('Conversation')],
});
add('post', '/chat/conversations', {
  tag: 'Chat',
  summary: 'Equipe inicia a conversa com um usuário do aplicativo',
  roles: STAFF,
  body: obj({ userId: uuid }, ['userId']),
  ok: [201, 'Conversa criada ou reaberta', ref('Conversation')],
});
add('get', '/chat/conversations/{id}', { tag: 'Chat', summary: 'Detalhe da conversa', ok: [200, 'OK', ref('Conversation')] });
add('get', '/chat/conversations/{id}/messages', {
  tag: 'Chat',
  summary: 'Mensagens da conversa',
  description:
    'Sem parâmetros: as mais recentes. `before` carrega as anteriores; `after` traz só as novas (use no polling). Sempre em ordem cronológica.',
  query: { after: dateTime, before: dateTime, limit: int({ minimum: 1, maximum: 100, default: 50 }) },
  ok: [200, 'OK', obj({ items: arr(ref('ChatMessage')), conversation: ref('Conversation') })],
});
add('post', '/chat/conversations/{id}/messages', {
  tag: 'Chat',
  summary: 'Envia uma mensagem',
  body: obj({ body: str({ maxLength: 4000 }) }, ['body']),
  ok: [201, 'Mensagem enviada', ref('ChatMessage')],
});
add('post', '/chat/conversations/{id}/read', {
  tag: 'Chat',
  summary: 'Marca as mensagens recebidas como lidas',
  description: 'Também marca como lidas as notificações de "nova mensagem" desta conversa.',
  ok: [204, 'Feito'],
});

/* Notificações */
add('get', '/notifications', {
  tag: 'Notificações',
  summary: 'Notificações do usuário',
  query: { ...paging, unread: bool },
  ok: [200, 'OK', { allOf: [page('Notification'), obj({ unreadCount: int() })] }],
});
add('get', '/notifications/unread-count', { tag: 'Notificações', summary: 'Contador de não lidas', ok: [200, 'OK', obj({ count: int() })] });
add('patch', '/notifications/read-all', { tag: 'Notificações', summary: 'Marca todas como lidas', ok: [200, 'OK', obj({ updated: int() })] });
add('patch', '/notifications/{id}/read', { tag: 'Notificações', summary: 'Marca como lida', ok: [200, 'OK', ref('Notification')] });
add('delete', '/notifications/{id}', { tag: 'Notificações', summary: 'Remove', ok: [204, 'Removida'] });

/* Configurações */
add('get', '/settings/company', { tag: 'Configurações', summary: 'Dados da oficina', ok: [200, 'OK', ref('CompanySettings')] });
add('put', '/settings/company', {
  tag: 'Configurações',
  summary: 'Atualiza os dados da oficina',
  description: 'Aparecem no cabeçalho das notas e na tela de contato do aplicativo.',
  roles: MANAGERS,
  body: obj({ name: str(), document: nullable(str()), email: nullable(str()), phone: nullable(str()), address: nullable(str()), invoiceFooter: nullable(str()) }),
  ok: [200, 'OK', ref('CompanySettings')],
});

/* Relatórios */
add('get', '/reports/summary', { tag: 'Relatórios', summary: 'Resumo do estoque e das solicitações', roles: STAFF });
add('get', '/reports/movements-series', {
  tag: 'Relatórios',
  summary: 'Série de entradas e saídas',
  roles: STAFF,
  query: { granularity: oneOf('day', 'week', 'month'), points: int(), tz: str({ example: 'America/Manaus' }) },
});
add('get', '/reports/top-products', {
  tag: 'Relatórios',
  summary: 'Produtos mais movimentados',
  roles: STAFF,
  query: { days: int(), limit: int(), type: oneOf('IN', 'OUT', 'ADJUSTMENT') },
});
add('get', '/reports/my-requests', { tag: 'Relatórios', summary: 'Solicitações do usuário, por status', roles: INTERNAL });

export function buildOpenApiDocument(serverUrl: string) {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Stokar API',
      version: API_VERSION,
      description: [
        'API do **Stokar**: estoque (entradas e saídas), oficina (clientes, contratos, catálogo de serviços, solicitações e notas) e chat com clientes.',
        '',
        '**Autenticação:** faça `POST /auth/login`, copie o `accessToken` e use o botão **Authorize**. O token dura 15 minutos; renove com `POST /auth/refresh`.',
        '',
        '**Perfis:** `ADMIN` (tudo), `MANAGER` (cadastros, aprovações, contratos e notas), `OPERATOR` (estoque e atendimento), `REQUESTER` (solicitações internas) e `CLIENT` (cliente da oficina, pelo aplicativo).',
        '',
        '**Erros:** sempre no formato `{ "error": { "status", "message", "details" } }`.',
        '',
        '**Listas:** `page` e `limit` na query; a resposta traz `items` e `meta`.',
      ].join('\n'),
    },
    servers: [{ url: serverUrl }],
    tags: [
      'Autenticação',
      'Usuários',
      'Clientes',
      'Veículos',
      'Catálogo de serviços',
      'Contratos',
      'Solicitações de serviço',
      'Notas de serviço',
      'Chat',
      'Notificações',
      'Estoque · Produtos',
      'Estoque · Categorias',
      'Estoque · Fornecedores',
      'Estoque · Movimentações',
      'Relatórios',
      'Configurações',
      'Sistema',
    ].map((name) => ({ name })),
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      schemas,
    },
    security: [{ bearerAuth: [] }],
    paths,
  };
}
