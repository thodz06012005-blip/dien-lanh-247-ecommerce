import type { AdminPermission } from '@/types/admin';

export const ADMIN_PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  ORDERS_VIEW: 'orders.view',
  ORDERS_MANAGE: 'orders.manage',
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_MANAGE: 'products.manage',
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_MANAGE: 'customers.manage',
  SERVICES_VIEW: 'services.view',
  SERVICES_MANAGE: 'services.manage',
  TECHNICIANS_VIEW: 'technicians.view',
  TECHNICIANS_MANAGE: 'technicians.manage',
  OPERATIONS_VIEW: 'operations.view',
  OPERATIONS_MANAGE: 'operations.manage',
  CONTENT_VIEW: 'content.view',
  CONTENT_MANAGE: 'content.manage',
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_MANAGE: 'settings.manage',
  DESIGN_SYSTEM_VIEW: 'design-system.view',
  PROFILE_VIEW: 'profile.view',
  PROFILE_MANAGE: 'profile.manage',
  AUDIT_VIEW: 'audit.view',
} as const satisfies Record<string, AdminPermission>;

export function canAccess(
  granted: readonly AdminPermission[],
  required?: AdminPermission | readonly AdminPermission[],
  mode: 'all' | 'any' = 'all',
) {
  if (!required) return true;
  const list = Array.isArray(required) ? required : [required];
  if (!list.length) return true;
  const permissionSet = new Set(granted);
  return mode === 'any'
    ? list.some((permission) => permissionSet.has(permission))
    : list.every((permission) => permissionSet.has(permission));
}
