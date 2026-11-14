import { MANAGER_ROLES, STAFF_ROLES, User, UserRole } from '../entities';
import { forbidden } from '../utils/http';

export const isStaff = (user: User): boolean => STAFF_ROLES.includes(user.role);
export const isManager = (user: User): boolean => MANAGER_ROLES.includes(user.role);
export const isClient = (user: User): boolean => user.role === UserRole.CLIENT;

/** Cliente (cadastro) que o usuário do aplicativo representa. */
export function customerIdOf(user: User): string {
  if (!isClient(user) || !user.customerId) {
    throw forbidden('Seu usuário não está vinculado a um cadastro de cliente. Fale com a oficina');
  }
  return user.customerId;
}
