import {
  FileText,
  LayoutDashboard,
  Package,
  Palette,
  Settings,
  ShoppingBag,
  UserRound,
  Users,
  Workflow,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { ADMIN_PERMISSIONS } from './adminPermissions';
import type { AdminPermission } from '@/types/admin';

export interface AdminNavigationItem {
  path: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  permission: AdminPermission;
  exact?: boolean;
  keywords?: string[];
}

export interface AdminNavigationGroup {
  title: string;
  items: AdminNavigationItem[];
}

export const adminNavigation: AdminNavigationGroup[] = [
  {
    title: 'Điều hành',
    items: [
      { path: '/', label: 'Tổng quan hệ thống', shortLabel: 'Tổng quan', icon: LayoutDashboard, permission: ADMIN_PERMISSIONS.DASHBOARD_VIEW, exact: true, keywords: ['dashboard', 'kpi'] },
      { path: '/operations', label: 'Trung tâm điều phối', shortLabel: 'Điều phối', icon: Workflow, permission: ADMIN_PERMISSIONS.OPERATIONS_VIEW, keywords: ['sla', 'báo giá', 'bảo hành', 'kỹ thuật viên', 'thiết bị'] },
      { path: '/orders', label: 'Quản lý đơn hàng', shortLabel: 'Đơn hàng', icon: ShoppingBag, permission: ADMIN_PERMISSIONS.ORDERS_VIEW, keywords: ['giao hàng', 'thanh toán'] },
      { path: '/service-requests', label: 'Yêu cầu sửa chữa', shortLabel: 'Dịch vụ', icon: Wrench, permission: ADMIN_PERMISSIONS.SERVICES_VIEW, keywords: ['yêu cầu', 'trạng thái'] },
    ],
  },
  {
    title: 'Danh mục',
    items: [
      { path: '/products', label: 'Quản lý sản phẩm', shortLabel: 'Sản phẩm', icon: Package, permission: ADMIN_PERMISSIONS.PRODUCTS_VIEW, keywords: ['tồn kho', 'sku'] },
      { path: '/customers', label: 'Quản lý khách hàng', shortLabel: 'Khách hàng', icon: Users, permission: ADMIN_PERMISSIONS.CUSTOMERS_VIEW, keywords: ['crm', 'tài khoản'] },
      { path: '/technicians', label: 'Quản lý kỹ thuật viên', shortLabel: 'Kỹ thuật viên', icon: UserRound, permission: ADMIN_PERMISSIONS.TECHNICIANS_VIEW, keywords: ['thợ', 'phân công'] },
      { path: '/content', label: 'Nội dung website', shortLabel: 'Nội dung', icon: FileText, permission: ADMIN_PERMISSIONS.CONTENT_VIEW, keywords: ['bài viết', 'dự án'] },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { path: '/settings', label: 'Cài đặt hệ thống', shortLabel: 'Cài đặt', icon: Settings, permission: ADMIN_PERMISSIONS.SETTINGS_VIEW, keywords: ['cấu hình'] },
      { path: '/design-system', label: 'Thư viện giao diện', shortLabel: 'Design system', icon: Palette, permission: ADMIN_PERMISSIONS.DESIGN_SYSTEM_VIEW, keywords: ['component', 'ui'] },
    ],
  },
];

export const flatAdminNavigation = adminNavigation.flatMap((group) => group.items);

export function getAdminRouteMeta(pathname: string) {
  const normalized = pathname === '' ? '/' : pathname;
  const exact = flatAdminNavigation.find((item) => item.exact && item.path === normalized);
  const nested = flatAdminNavigation
    .filter((item) => !item.exact && normalized.startsWith(item.path))
    .sort((left, right) => right.path.length - left.path.length)[0];
  if (normalized.startsWith('/profile')) {
    return { label: 'Hồ sơ quản trị', path: '/profile', permission: ADMIN_PERMISSIONS.PROFILE_VIEW };
  }
  return exact ?? nested ?? { label: 'Trang quản trị', path: normalized, permission: undefined };
}
