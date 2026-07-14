import { SetMetadata } from '@nestjs/common';
import type { AdminPermission } from '../auth/admin-permissions';

export const PERMISSIONS_KEY = 'admin_permissions';
export const PERMISSION_MODE_KEY = 'admin_permission_mode';

export const Permissions = (...permissions: AdminPermission[]) => SetMetadata(PERMISSIONS_KEY, permissions);
export const PermissionMode = (mode: 'all' | 'any') => SetMetadata(PERMISSION_MODE_KEY, mode);
