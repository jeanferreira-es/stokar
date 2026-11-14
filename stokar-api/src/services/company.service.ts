import { AppDataSource } from '../database/data-source';
import { CompanySettings } from '../entities';

const SETTINGS_ID = 1;

/** Dados da oficina; cria o registro único com valores padrão no primeiro acesso. */
export async function getCompanySettings(): Promise<CompanySettings> {
  const repo = AppDataSource.getRepository(CompanySettings);
  const found = await repo.findOne({ where: { id: SETTINGS_ID } });
  if (found) return found;
  await repo
    .createQueryBuilder()
    .insert()
    .values({ id: SETTINGS_ID, name: 'Stokar' })
    .orIgnore()
    .execute();
  return repo.findOneOrFail({ where: { id: SETTINGS_ID } });
}

export async function updateCompanySettings(changes: Partial<CompanySettings>): Promise<CompanySettings> {
  const current = await getCompanySettings();
  return AppDataSource.getRepository(CompanySettings).save(Object.assign(current, changes, { id: SETTINGS_ID }));
}
