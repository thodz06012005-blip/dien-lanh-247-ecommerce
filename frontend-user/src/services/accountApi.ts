import api from './api';
import type { User } from '@/store/authStore';

export interface Address {
  id: number;
  label: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  note?: string | null;
  isDefault: boolean | number;
  createdAt: string;
  updatedAt: string;
}

export interface AccountOverview {
  user: User;
  defaultAddress: Address | null;
  stats: {
    services: number;
    orders: number;
    unreadNotifications: number;
    activeSessions: number;
  };
}

export interface AccountNotification {
  id: string | number;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
}

export interface AccountSession {
  id: string;
  userAgent?: string | null;
  createdAt: string;
  lastUsedAt?: string | null;
  rotatedAt?: string | null;
  expiresAt: string;
  current: boolean;
}

export const getAccountOverview = async () => (await api.get('/account')).data.data as AccountOverview;
export const updateProfile = async (payload: { firstName: string; lastName: string; phone: string }) =>
  (await api.patch('/account/profile', payload)).data.data as User;
export const listAddresses = async () => (await api.get('/account/addresses')).data.data as Address[];
export const createAddress = async (payload: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>) =>
  (await api.post('/account/addresses', payload)).data.data as Address;
export const updateAddress = async (id: number, payload: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>) =>
  (await api.patch(`/account/addresses/${id}`, payload)).data.data as Address;
export const deleteAddress = async (id: number) => (await api.delete(`/account/addresses/${id}`)).data.data;
export const changePassword = async (payload: { currentPassword: string; newPassword: string }) =>
  (await api.post('/account/change-password', payload)).data.data;
export const listAccountOrders = async () => (await api.get('/account/orders')).data.data;
export const listAccountServiceRequests = async () => (await api.get('/account/service-requests')).data.data;
export const claimServiceRequest = async (payload: { code: string; phone: string }) =>
  (await api.post('/account/service-requests/claim', payload)).data.data;
export const listNotifications = async () => (await api.get('/account/notifications')).data.data as AccountNotification[];
export const markNotificationRead = async (id: string | number) =>
  (await api.patch(`/account/notifications/${id}/read`)).data.data;
export const markAllNotificationsRead = async () =>
  (await api.patch('/account/notifications/read-all')).data.data;
export const listSessions = async () => (await api.get('/account/sessions')).data.data as AccountSession[];
export const revokeSession = async (id: string) => (await api.delete(`/account/sessions/${id}`)).data.data;
