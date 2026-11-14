import { Router } from 'express';
import { z } from 'zod';
import { MANAGER_ROLES, PixKeyType } from '../entities';
import { authorize } from '../middlewares/auth';
import { getCompanySettings, updateCompanySettings } from '../services/company.service';
import { badRequest, compact } from '../utils/http';
import { documentField, optionalEmail, optionalText } from '../utils/schemas';

const router = Router();

const companySchema = z.object({
  name: z.string().trim().min(2).max(160),
  document: documentField,
  email: optionalEmail,
  phone: optionalText(30),
  address: optionalText(255),
  invoiceFooter: optionalText(2000),
  pixKeyType: z.nativeEnum(PixKeyType).nullable().optional(),
  pixKey: optionalText(140),
  pixCity: optionalText(60),
  paymentInstructions: optionalText(2000),
  requirePaymentToComplete: z.boolean().optional(),
});

/** GET /api/settings/company — dados da oficina (cabeçalho das notas e contato no aplicativo) */
router.get('/company', async (_req, res) => {
  res.json(await getCompanySettings());
});

/** Confere o formato da chave conforme o tipo escolhido (evita PIX que o banco recusa). */
function assertPixKey(type: PixKeyType | null | undefined, key: string | null | undefined): void {
  if (!key) return;
  const digits = key.replace(/\D/g, '');
  const valid: Record<PixKeyType, boolean> = {
    CPF: digits.length === 11,
    CNPJ: digits.length === 14,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key.trim()),
    PHONE: digits.length >= 10 && digits.length <= 13,
    RANDOM: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key.trim()),
  };
  if (type && !valid[type]) throw badRequest('A chave PIX não corresponde ao tipo escolhido', { field: 'pixKey' });
}

/** PUT /api/settings/company — gestores */
router.put('/company', authorize(...MANAGER_ROLES), async (req, res) => {
  const dto = compact(companySchema.partial().parse(req.body));
  const current = await getCompanySettings();
  assertPixKey(
    dto.pixKeyType !== undefined ? dto.pixKeyType : current.pixKeyType,
    dto.pixKey !== undefined ? dto.pixKey : current.pixKey,
  );
  res.json(await updateCompanySettings(dto));
});

export default router;
