export type AdminRole = 'staff' | 'admin' | 'superadmin';
export type Permission =
  | 'dashboard.read' | 'requests.read' | 'requests.update' | 'technicians.read'
  | 'technicians.manage' | 'technicians.delete' | 'assignment.manage' | 'customers.read' | 'finance.read'
  | 'finance.correct' | 'settings.manage' | 'audit.read' | 'users.manage' | 'pin.reset';

const rolePermissions: Record<AdminRole, readonly Permission[]> = {
  staff: ['dashboard.read', 'requests.read', 'requests.update', 'technicians.read'],
  admin: ['dashboard.read', 'requests.read', 'requests.update', 'technicians.read', 'technicians.manage', 'assignment.manage', 'customers.read', 'finance.read'],
  superadmin: ['dashboard.read', 'requests.read', 'requests.update', 'technicians.read', 'technicians.manage', 'technicians.delete', 'assignment.manage', 'customers.read', 'finance.read', 'finance.correct', 'settings.manage', 'audit.read', 'users.manage', 'pin.reset'],
};
export const normalizeRole = (role?: string): AdminRole | null => role === 'owner' ? 'superadmin' : role && role in rolePermissions ? role as AdminRole : null;
export const can = (role: string | undefined, permission: Permission) => { const normalized = normalizeRole(role); return normalized ? rolePermissions[normalized].includes(permission) : false; };
export const permissionsFor = (role?: string) => { const normalized = normalizeRole(role); return normalized ? rolePermissions[normalized] : []; };
