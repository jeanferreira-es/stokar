import { Router } from 'express';
import { INTERNAL_ROLES } from './entities';
import { authenticate, authorize } from './middlewares/auth';
import authRoutes from './modules/auth.routes';
import { servicesRouter, serviceTypesRouter } from './modules/catalog.routes';
import categoriesRoutes from './modules/categories.routes';
import chatRoutes from './modules/chat.routes';
import contractsRoutes from './modules/contracts.routes';
import customersRoutes from './modules/customers.routes';
import invoicesRoutes from './modules/invoices.routes';
import notificationsRoutes from './modules/notifications.routes';
import productsRoutes from './modules/products.routes';
import reportsRoutes from './modules/reports.routes';
import serviceRequestsRoutes from './modules/service-requests.routes';
import settingsRoutes from './modules/settings.routes';
import stockRoutes from './modules/stock.routes';
import suppliersRoutes from './modules/suppliers.routes';
import usersRoutes from './modules/users.routes';
import vehiclesRoutes from './modules/vehicles.routes';

const router = Router();

// Público (as rotas /me, /logout e /change-password se protegem internamente)
router.use('/auth', authRoutes);

// Daqui para baixo, tudo exige JWT
router.use(authenticate);

// Estoque e cadastros internos: o cliente do aplicativo (perfil CLIENT) não acessa
const internal = authorize(...INTERNAL_ROLES);
router.use('/users', internal, usersRoutes);
router.use('/categories', internal, categoriesRoutes);
router.use('/suppliers', internal, suppliersRoutes);
router.use('/products', internal, productsRoutes);
router.use('/stock', internal, stockRoutes);
router.use('/reports', internal, reportsRoutes);

// Oficina: clientes, veículos, catálogo de serviços, contratos, solicitações e notas.
// Cada módulo aplica as próprias regras (o cliente só enxerga o que é dele).
router.use('/customers', customersRoutes);
router.use('/vehicles', vehiclesRoutes);
router.use('/service-types', serviceTypesRouter);
router.use('/services', servicesRouter);
router.use('/contracts', contractsRoutes);
router.use('/service-requests', serviceRequestsRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/chat', chatRoutes);
router.use('/settings', settingsRoutes);
router.use('/notifications', notificationsRoutes);

export default router;
