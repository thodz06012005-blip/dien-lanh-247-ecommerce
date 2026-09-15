import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
// Accept string[] to support both UserRole (@prisma/client) and AdminRole (local enum).
// The RolesGuard compares user.role (string from JWT payload) against these values.
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
