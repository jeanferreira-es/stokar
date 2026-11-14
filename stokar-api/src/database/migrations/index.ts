import { InitialSchema1794530493554 } from './1794530493554-InitialSchema';
import { WorkshopModule1794541594276 } from './1794541594276-WorkshopModule';
import { Payments1794700000000 } from './1794700000000-Payments';

// Registre aqui cada nova migration gerada (lista explícita, sem glob,
// para funcionar no bundle serverless da Vercel).
export const migrations = [InitialSchema1794530493554, WorkshopModule1794541594276, Payments1794700000000];
