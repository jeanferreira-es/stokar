// Cria (ou promove) o usuário administrador: npm run seed
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { Service, ServiceType, User, UserRole } from '../entities';
import { getDataSource } from './data-source';

async function seed(): Promise<void> {
  const ds = await getDataSource();
  const users = ds.getRepository(User);

  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@exemplo.com').toLowerCase();
  const name = process.env.SEED_ADMIN_NAME || 'Administrador';

  const existing = await users.findOne({ where: { email } });
  if (existing) {
    if (existing.role !== UserRole.ADMIN || !existing.active) {
      await users.update(existing.id, { role: UserRole.ADMIN, active: true });
      console.log(`Usuário ${email} promovido a ADMIN.`);
    } else {
      console.log(`Administrador ${email} já existe. Nada a fazer.`);
    }
  } else {
    const generated = !process.env.SEED_ADMIN_PASSWORD;
    const password = process.env.SEED_ADMIN_PASSWORD || randomBytes(9).toString('base64url');
    await users.save(
      users.create({ name, email, role: UserRole.ADMIN, passwordHash: await bcrypt.hash(password, 10) }),
    );
    console.log(`Administrador criado: ${email}`);
    if (generated) console.log(`Senha gerada (troque após o primeiro login): ${password}`);
  }

  if (['true', '1', 'yes'].includes((process.env.SEED_SAMPLE_CATALOG || '').toLowerCase())) {
    await seedCatalog(ds);
  }

  await ds.destroy();
}

/** Catálogo de exemplo, com valores zerados para a oficina preencher. Só roda com o catálogo vazio. */
async function seedCatalog(ds: Awaited<ReturnType<typeof getDataSource>>): Promise<void> {
  const types = ds.getRepository(ServiceType);
  if ((await types.count()) > 0) {
    console.log('O catálogo de serviços já tem registros. Nada a fazer.');
    return;
  }
  const sample: Record<string, string[]> = {
    Pneus: ['Trocar pneu', 'Alinhamento e balanceamento'],
    'Funilaria e pintura': ['Realizar pintura', 'Polimento'],
    Mecânica: ['Troca de óleo e filtro', 'Revisão de freios'],
  };
  for (const [typeName, names] of Object.entries(sample)) {
    const type = await types.save(types.create({ name: typeName }));
    await ds.getRepository(Service).save(names.map((name) => ({ name, price: 0, serviceTypeId: type.id })));
  }
  console.log('Catálogo de exemplo criado (valores zerados: ajuste em Serviços).');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
