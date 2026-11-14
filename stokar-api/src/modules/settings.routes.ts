import { Router } from 'express';
import { z } from 'zod';
import { MANAGER_ROLES } from '../entities';
import { authorize } from '../middlewares/auth';
import { getCompanySettings, updateCompanySettings } from '../services/company.service';
import { compact } from '../utils/http';
import { documentField, optionalEmail, optionalText } from '../utils/schemas';

const router = Router();

const companySchema = z.object({
  name: z.string().trim().min(2).max(160),
  document: documentField,
  email: optionalEmail,
  phone: optionalText(30),
  address: optionalText(255),
  invoiceFooter: optionalText(2000),
});

/** GET /api/settings/company — dados da oficina (cabeçalho das notas e contato no aplicativo) */
router.get('/company', async (_req, res) => {
  res.json(await getCompanySettings());
});

/** PUT /api/settings/company — gestores */
router.put('/company', authorize(...MANAGER_ROLES), async (req, res) => {
  const dto = compact(companySchema.partial().parse(req.body));
  res.json(await updateCompanySettings(dto));
});

export default router;
