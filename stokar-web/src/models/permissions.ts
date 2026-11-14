import type { User, UserRole } from './types';

/** Mesmos grupos de perfis usados pela API (entities/enums.ts). */
export const STAFF_ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'OPERATOR'];
export const MANAGER_ROLES: UserRole[] = ['ADMIN', 'MANAGER'];

export const isStaff = (user?: User | null) => !!user && STAFF_ROLES.includes(user.role);
export const isManager = (user?: User | null) => !!user && MANAGER_ROLES.includes(user.role);
export const isAdmin = (user?: User | null) => user?.role === 'ADMIN';
