export type AdminPermission =
  | 'dashboard.view'
  | 'orders.view'
  | 'orders.manage'
  | 'products.view'
  | 'products.manage'
  | 'customers.view'
  | 'customers.manage'
  | 'services.view'
  | 'services.manage'
  | 'technicians.view'
  | 'technicians.manage'
  | 'operations.view'
  | 'operations.manage'
  | 'content.view'
  | 'content.manage'
  | 'settings.view'
  | 'settings.manage'
  | 'design-system.view'
  | 'profile.view'
  | 'profile.manage'
  | 'audit.view';

export interface AdminUser {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  permissions: AdminPermission[];
  lastLoginAt?: string | null;
  passwordChangedAt?: string | null;
}

export interface AdminSessionPayload {
  admin: AdminUser;
  permissions: AdminPermission[];
  expiresAt?: number;
}

export interface AdminSession {
  id: string;
  userAgent?: string | null;
  createdAt: string;
  lastUsedAt?: string | null;
  rotatedAt?: string | null;
  expiresAt: string;
  revokedAt?: string | null;
  current: boolean;
  active: boolean;
}
