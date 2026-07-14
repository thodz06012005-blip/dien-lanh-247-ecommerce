import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  KeyRound,
  Laptop,
  Link2,
  LogOut,
  MapPin,
  Package,
  Plus,
  Save,
  ShieldCheck,
  Smartphone,
  Trash2,
  User,
  Wrench,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Breadcrumb from '@/components/common/Breadcrumb';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  changePassword,
  claimServiceRequest,
  createAddress,
  deleteAddress,
  getAccountOverview,
  listAccountOrders,
  listAccountServiceRequests,
  listAddresses,
  listNotifications,
  listSessions,
  markAllNotificationsRead,
  markNotificationRead,
  revokeSession,
  updateProfile,
  type AccountNotification,
  type AccountSession,
  type Address,
} from '@/services/accountApi';
import api, { getApiErrorMessage } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';

type Tab = 'overview' | 'profile' | 'addresses' | 'services' | 'orders' | 'notifications' | 'security';
interface AccountOrder {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number | string;
  createdAt: string;
  items?: Array<{ id: number; productName: string; quantity: number }>;
}
interface AccountServiceRequest {
  id: string;
  status: string;
  priority: string;
  applianceType: string;
  preferredDate: string;
  serviceCategoryName: string;
  finalPrice: number | string;
  createdAt: string;
}

const tabs: Array<{ id: Tab; label: string; icon: typeof User }> = [
  { id: 'overview', label: 'Tổng quan', icon: ShieldCheck },
  { id: 'profile', label: 'Hồ sơ cá nhân', icon: User },
  { id: 'addresses', label: 'Sổ địa chỉ', icon: MapPin },
  { id: 'services', label: 'Lịch sử dịch vụ', icon: Wrench },
  { id: 'orders', label: 'Đơn hàng', icon: Package },
  { id: 'notifications', label: 'Thông báo', icon: Bell },
  { id: 'security', label: 'Bảo mật & thiết bị', icon: KeyRound },
];

const formatMoney = (value: number | string | undefined) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString('vi-VN') : 'Chưa có';

export default function Account() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, setUser, clearSession } = useAuthStore();
  const { showSuccess, showError } = useToastStore();
  const requestedTab = searchParams.get('tab') as Tab | null;
  const activeTab: Tab = tabs.some((item) => item.id === requestedTab) ? requestedTab! : 'overview';
  const [profile, setProfile] = useState({ firstName: '', lastName: '', phone: '' });
  const [addressForm, setAddressForm] = useState({ label: 'Nhà riêng', fullName: '', phone: '', province: '', district: '', ward: '', streetAddress: '', note: '', isDefault: false });
  const [claim, setClaim] = useState({ code: '', phone: '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const overviewQuery = useQuery({ queryKey: ['account-overview'], queryFn: getAccountOverview });
  const addressesQuery = useQuery({ queryKey: ['account-addresses'], queryFn: listAddresses, enabled: activeTab === 'addresses' || activeTab === 'overview' });
  const servicesQuery = useQuery({ queryKey: ['account-services'], queryFn: listAccountServiceRequests, enabled: activeTab === 'services' || activeTab === 'overview' });
  const ordersQuery = useQuery({ queryKey: ['account-orders'], queryFn: listAccountOrders, enabled: activeTab === 'orders' || activeTab === 'overview' });
  const notificationsQuery = useQuery({ queryKey: ['account-notifications'], queryFn: listNotifications, enabled: activeTab === 'notifications' || activeTab === 'overview' });
  const sessionsQuery = useQuery({ queryKey: ['account-sessions'], queryFn: listSessions, enabled: activeTab === 'security' || activeTab === 'overview' });

  useEffect(() => {
    const accountUser = overviewQuery.data?.user ?? user;
    if (!accountUser) return;
    setProfile({ firstName: accountUser.firstName || '', lastName: accountUser.lastName || '', phone: accountUser.phone || '' });
    setAddressForm((current) => ({ ...current, fullName: `${accountUser.lastName || ''} ${accountUser.firstName || ''}`.trim(), phone: accountUser.phone || '' }));
    setClaim((current) => ({ ...current, phone: accountUser.phone || '' }));
  }, [overviewQuery.data?.user, user]);

  const refreshAccount = () => {
    void queryClient.invalidateQueries({ queryKey: ['account-overview'] });
    void queryClient.invalidateQueries({ queryKey: ['account-addresses'] });
    void queryClient.invalidateQueries({ queryKey: ['account-services'] });
    void queryClient.invalidateQueries({ queryKey: ['account-orders'] });
    void queryClient.invalidateQueries({ queryKey: ['account-notifications'] });
    void queryClient.invalidateQueries({ queryKey: ['account-sessions'] });
  };

  const profileMutation = useMutation({
    mutationFn: () => updateProfile(profile),
    onSuccess: (updated) => { setUser(updated); refreshAccount(); showSuccess('Hồ sơ đã được cập nhật.'); },
    onError: (error) => showError(getApiErrorMessage(error)),
  });
  const addressMutation = useMutation({
    mutationFn: () => createAddress(addressForm),
    onSuccess: () => { refreshAccount(); showSuccess('Đã thêm địa chỉ mới.'); setAddressForm((value) => ({ ...value, province: '', district: '', ward: '', streetAddress: '', note: '', isDefault: false })); },
    onError: (error) => showError(getApiErrorMessage(error)),
  });
  const deleteAddressMutation = useMutation({
    mutationFn: (id: number) => deleteAddress(id),
    onSuccess: () => { refreshAccount(); showSuccess('Đã xóa địa chỉ.'); },
    onError: (error) => showError(getApiErrorMessage(error)),
  });
  const claimMutation = useMutation({
    mutationFn: () => claimServiceRequest(claim),
    onSuccess: () => { refreshAccount(); setClaim((value) => ({ ...value, code: '' })); showSuccess('Yêu cầu đã được liên kết với tài khoản.'); },
    onError: (error) => showError(getApiErrorMessage(error)),
  });
  const passwordMutation = useMutation({
    mutationFn: () => changePassword({ currentPassword: password.currentPassword, newPassword: password.newPassword }),
    onSuccess: () => { clearSession(); showSuccess('Mật khẩu đã đổi. Tất cả phiên cũ đã bị thu hồi.'); navigate('/login', { replace: true }); },
    onError: (error) => showError(getApiErrorMessage(error)),
  });
  const revokeMutation = useMutation({
    mutationFn: (session: AccountSession) => revokeSession(session.id).then(() => session),
    onSuccess: (session) => { if (session.current) { clearSession(); navigate('/login', { replace: true }); } else { void sessionsQuery.refetch(); } showSuccess('Phiên đăng nhập đã được thu hồi.'); },
    onError: (error) => showError(getApiErrorMessage(error)),
  });

  const account = overviewQuery.data;
  const accountUser = account?.user ?? user;
  const notifications = (notificationsQuery.data || []) as AccountNotification[];
  const unread = notifications.filter((item) => !item.readAt).length;
  const recentServices = useMemo(() => ((servicesQuery.data || []) as AccountServiceRequest[]).slice(0, 3), [servicesQuery.data]);
  const recentOrders = useMemo(() => ((ordersQuery.data || []) as AccountOrder[]).slice(0, 3), [ordersQuery.data]);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { /* cookie may already be expired */ }
    clearSession();
    navigate('/', { replace: true });
  };

  if (overviewQuery.isLoading || !accountUser) {
    return <div className="mx-auto min-h-[60vh] max-w-7xl px-4 py-16"><div className="h-48 animate-pulse rounded-[2rem] bg-slate-100 motion-reduce:animate-none" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      <section className="relative overflow-hidden bg-[#061527] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(14,165,233,0.2),transparent_32%),radial-gradient(circle_at_90%_30%,rgba(249,115,22,0.14),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
          <Breadcrumb items={[{ name: 'Tài khoản cá nhân' }]} />
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-5"><div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 text-2xl font-black shadow-xl shadow-cyan-500/20">{(accountUser.firstName || accountUser.email).charAt(0).toUpperCase()}</div><div><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Customer Hub</p><h1 className="mt-2 text-3xl font-black">{accountUser.lastName} {accountUser.firstName}</h1><p className="mt-1 text-sm text-slate-400">{accountUser.email}</p></div></div>
            <div className="flex flex-wrap gap-3"><VerificationBadge verified={Boolean(accountUser.emailVerified)} label="Email" /><VerificationBadge verified={Boolean(accountUser.phoneVerified)} label="Điện thoại" /></div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-32">
          <nav className="space-y-1" aria-label="Khu vực tài khoản">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setSearchParams({ tab: id })} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${activeTab === id ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}><Icon className="h-4 w-4" /><span className="flex-1">{label}</span>{id === 'notifications' && unread > 0 && <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] text-white">{unread}</span>}<ChevronRight className="h-4 w-4 opacity-50" /></button>
            ))}
            <button type="button" onClick={handleLogout} className="mt-3 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />Đăng xuất</button>
          </nav>
        </aside>

        <main className="min-w-0">
          {activeTab === 'overview' && <Overview account={account} recentServices={recentServices} recentOrders={recentOrders} notifications={notifications.slice(0, 3)} onTab={(tab) => setSearchParams({ tab })} />}
          {activeTab === 'profile' && (
            <Panel title="Hồ sơ cá nhân" subtitle="Thông tin này được dùng để điền nhanh biểu mẫu và xác minh quyền sở hữu.">
              {!accountUser.emailVerified && <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-100 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between"><div><strong className="text-amber-950">Email chưa được xác minh</strong><p className="mt-1 text-sm text-amber-800">Xác minh email để tự động liên kết các yêu cầu cũ cùng địa chỉ email.</p></div><Button variant="outline" onClick={async () => { try { await api.post('/auth/verify-email/resend'); showSuccess('Đã gửi lại email xác minh.'); } catch (error) { showError(getApiErrorMessage(error)); } }}>Gửi lại email</Button></div>}
              <div className="grid gap-5 sm:grid-cols-2"><Input label="Họ" value={profile.lastName} onChange={(event) => setProfile({ ...profile, lastName: event.target.value })} /><Input label="Tên" value={profile.firstName} onChange={(event) => setProfile({ ...profile, firstName: event.target.value })} /></div>
              <div className="mt-5 grid gap-5 sm:grid-cols-2"><Input label="Email" value={accountUser.email} disabled helperText="Đổi email cần quy trình xác minh riêng." /><Input label="Số điện thoại" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} helperText={accountUser.phoneVerified ? 'Đã xác minh' : 'Thay đổi số sẽ yêu cầu xác minh lại'} /></div>
              <div className="mt-6 flex justify-end"><Button leftIcon={<Save className="h-4 w-4" />} isLoading={profileMutation.isPending} onClick={() => profileMutation.mutate()}>Lưu hồ sơ</Button></div>
            </Panel>
          )}
          {activeTab === 'addresses' && (
            <div className="space-y-6"><Panel title="Sổ địa chỉ" subtitle="Lưu nhiều địa chỉ; dữ liệu chỉ được trả về cho chủ tài khoản."><div className="grid gap-4 md:grid-cols-2">{(addressesQuery.data || []).map((address: Address) => <AddressCard key={address.id} address={address} onDelete={() => deleteAddressMutation.mutate(address.id)} />)}{!addressesQuery.data?.length && <Empty icon={MapPin} title="Chưa có địa chỉ" body="Thêm địa chỉ đầu tiên để rút ngắn quá trình đặt hàng và đặt dịch vụ." />}</div></Panel><Panel title="Thêm địa chỉ mới" subtitle="Địa chỉ đầu tiên sẽ tự động trở thành mặc định."><div className="grid gap-4 sm:grid-cols-2"><Input label="Nhãn địa chỉ" value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} /><Input label="Người nhận" value={addressForm.fullName} onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} /><Input label="Số điện thoại" value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} /><Input label="Tỉnh / Thành phố" value={addressForm.province} onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })} /><Input label="Quận / Huyện" value={addressForm.district} onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })} /><Input label="Phường / Xã" value={addressForm.ward} onChange={(e) => setAddressForm({ ...addressForm, ward: e.target.value })} /></div><div className="mt-4 grid gap-4"><Input label="Địa chỉ chi tiết" value={addressForm.streetAddress} onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })} /><Input label="Ghi chú giao nhận" value={addressForm.note} onChange={(e) => setAddressForm({ ...addressForm, note: e.target.value })} /></div><label className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-600"><input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} />Đặt làm địa chỉ mặc định</label><div className="mt-6 flex justify-end"><Button leftIcon={<Plus className="h-4 w-4" />} isLoading={addressMutation.isPending} onClick={() => addressMutation.mutate()}>Thêm địa chỉ</Button></div></Panel></div>
          )}
          {activeTab === 'services' && (
            <div className="space-y-6"><Panel title="Lịch sử dịch vụ" subtitle="Chỉ các yêu cầu đã liên kết với tài khoản mới xuất hiện."><div className="space-y-3">{((servicesQuery.data || []) as AccountServiceRequest[]).map((request) => <button key={request.id} type="button" onClick={() => navigate(`/my-services/${request.id}`)} className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200 p-5 text-left transition hover:border-primary-200 hover:shadow-md sm:flex-row sm:items-center"><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="font-mono text-sm text-slate-950">{request.id}</strong><StatusBadge value={request.status} /></div><p className="mt-2 text-sm font-bold text-slate-700">{request.serviceCategoryName} · {request.applianceType}</p><p className="mt-1 text-xs text-slate-400">Lịch mong muốn: {request.preferredDate}</p></div><div className="text-right"><strong className="text-sm text-slate-950">{formatMoney(request.finalPrice)}</strong><ChevronRight className="ml-auto mt-2 h-4 w-4 text-slate-400" /></div></button>)}{!servicesQuery.data?.length && <Empty icon={Wrench} title="Chưa có yêu cầu được liên kết" body="Bạn có thể xác nhận một yêu cầu cũ bằng mã và số điện thoại." />}</div></Panel><Panel title="Liên kết yêu cầu đã tạo trước đây" subtitle="Mã và số điện thoại phải khớp chính xác. Hệ thống không tiết lộ yêu cầu thuộc tài khoản khác."><div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]"><Input label="Mã yêu cầu" value={claim.code} onChange={(e) => setClaim({ ...claim, code: e.target.value.toUpperCase() })} placeholder="DL247-..." /><Input label="Số điện thoại" value={claim.phone} onChange={(e) => setClaim({ ...claim, phone: e.target.value })} /><Button className="self-end" leftIcon={<Link2 className="h-4 w-4" />} isLoading={claimMutation.isPending} onClick={() => claimMutation.mutate()}>Liên kết</Button></div></Panel></div>
          )}
          {activeTab === 'orders' && <Panel title="Lịch sử đơn hàng" subtitle="API xác định chủ sở hữu bằng userId trong JWT, không bằng số điện thoại truyền từ trình duyệt."><div className="space-y-3">{((ordersQuery.data || []) as AccountOrder[]).map((order) => <div key={order.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 sm:flex-row sm:items-center"><div className="flex-1"><div className="flex items-center gap-2"><strong className="font-mono text-sm">{order.orderNumber}</strong><StatusBadge value={order.status} /></div><p className="mt-2 text-xs text-slate-400">{formatDate(order.createdAt)} · {order.items?.length || 0} dòng sản phẩm</p></div><strong className="text-primary-700">{formatMoney(order.totalAmount)}</strong></div>)}{!ordersQuery.data?.length && <Empty icon={Package} title="Chưa có đơn hàng" body="Các đơn hàng của đúng tài khoản sẽ xuất hiện tại đây." />}</div></Panel>}
          {activeTab === 'notifications' && <Panel title="Thông báo" subtitle="Cập nhật tài khoản, dịch vụ và bảo mật theo thời gian thực."><div className="mb-5 flex justify-end"><Button variant="outline" onClick={async () => { await markAllNotificationsRead(); void notificationsQuery.refetch(); refreshAccount(); }}>Đánh dấu đã đọc tất cả</Button></div><div className="space-y-3">{notifications.map((notification) => <button type="button" key={String(notification.id)} onClick={async () => { if (!notification.readAt) { await markNotificationRead(notification.id); void notificationsQuery.refetch(); refreshAccount(); } }} className={`w-full rounded-2xl border p-5 text-left ${notification.readAt ? 'border-slate-200 bg-white' : 'border-blue-100 bg-blue-50/70'}`}><div className="flex items-start gap-3"><div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-500" /><div><strong className="text-sm text-slate-950">{notification.title}</strong><p className="mt-1 text-sm leading-6 text-slate-600">{notification.body}</p><span className="mt-2 block text-xs text-slate-400">{formatDate(notification.createdAt)}</span></div></div></button>)}{!notifications.length && <Empty icon={Bell} title="Không có thông báo" body="Thông báo mới sẽ xuất hiện tại đây." />}</div></Panel>}
          {activeTab === 'security' && <div className="space-y-6"><Panel title="Thay đổi mật khẩu" subtitle="Sau khi đổi, tất cả phiên đăng nhập sẽ bị thu hồi."><div className="grid gap-4 sm:grid-cols-3"><Input label="Mật khẩu hiện tại" type="password" value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })} /><Input label="Mật khẩu mới" type="password" value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} /><Input label="Xác nhận mật khẩu" type="password" value={password.confirmPassword} onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })} /></div><div className="mt-5 flex justify-end"><Button leftIcon={<KeyRound className="h-4 w-4" />} isLoading={passwordMutation.isPending} onClick={() => { if (password.newPassword !== password.confirmPassword) return showError('Mật khẩu xác nhận không khớp'); passwordMutation.mutate(); }}>Đổi mật khẩu</Button></div></Panel><Panel title="Thiết bị đang đăng nhập" subtitle="Thu hồi bất kỳ phiên nào bạn không nhận ra."><div className="space-y-3">{(sessionsQuery.data || []).map((session: AccountSession) => <div key={session.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 sm:flex-row sm:items-center"><div className="flex flex-1 items-start gap-3"><div className="rounded-xl bg-slate-100 p-2 text-slate-600">{session.userAgent?.toLowerCase().includes('mobile') ? <Smartphone className="h-5 w-5" /> : <Laptop className="h-5 w-5" />}</div><div><div className="flex items-center gap-2"><strong className="text-sm">{session.current ? 'Thiết bị hiện tại' : 'Phiên đăng nhập'}</strong>{session.current && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">HIỆN TẠI</span>}</div><p className="mt-1 max-w-xl truncate text-xs text-slate-500">{session.userAgent || 'Không xác định trình duyệt'}</p><p className="mt-1 text-xs text-slate-400">Tạo: {formatDate(session.createdAt)} · Hết hạn: {formatDate(session.expiresAt)}</p></div></div><Button variant="outline" isLoading={revokeMutation.isPending} onClick={() => revokeMutation.mutate(session)}>Thu hồi</Button></div>)}</div></Panel></div>}
        </main>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="mb-6"><h2 className="text-xl font-black text-slate-950">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p></div>{children}</section>;
}
function VerificationBadge({ verified, label }: { verified: boolean; label: string }) {
  return <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${verified ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`}><CheckCircle2 className="h-3.5 w-3.5" />{label}: {verified ? 'Đã xác minh' : 'Chưa xác minh'}</span>;
}
function StatusBadge({ value }: { value: string }) {
  return <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-primary-700">{value.replaceAll('_', ' ')}</span>;
}
function AddressCard({ address, onDelete }: { address: Address; onDelete: () => void }) {
  return <article className="rounded-2xl border border-slate-200 p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><strong className="text-sm text-slate-950">{address.label}</strong>{Boolean(address.isDefault) && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">MẶC ĐỊNH</span>}</div><p className="mt-3 text-sm font-bold text-slate-700">{address.fullName} · {address.phone}</p><p className="mt-1 text-sm leading-6 text-slate-500">{address.streetAddress}, {address.ward}, {address.district}, {address.province}</p>{address.note && <p className="mt-2 text-xs text-slate-400">{address.note}</p>}</div><button type="button" onClick={onDelete} className="rounded-xl p-2 text-red-500 hover:bg-red-50" aria-label="Xóa địa chỉ"><Trash2 className="h-4 w-4" /></button></div></article>;
}
function Empty({ icon: Icon, title, body }: { icon: typeof User; title: string; body: string }) {
  return <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><Icon className="mx-auto h-8 w-8 text-slate-300" /><strong className="mt-3 block text-sm text-slate-700">{title}</strong><p className="mt-1 text-xs leading-5 text-slate-500">{body}</p></div>;
}
function Overview({ account, recentServices, recentOrders, notifications, onTab }: { account: ReturnType<typeof useAccountShape>; recentServices: AccountServiceRequest[]; recentOrders: AccountOrder[]; notifications: AccountNotification[]; onTab: (tab: Tab) => void }) {
  const stats = account?.stats;
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[[Wrench, 'Dịch vụ', stats?.services || 0, 'services'], [Package, 'Đơn hàng', stats?.orders || 0, 'orders'], [Bell, 'Chưa đọc', stats?.unreadNotifications || 0, 'notifications'], [Laptop, 'Phiên hoạt động', stats?.activeSessions || 0, 'security']].map(([Icon, label, value, tab]) => <button type="button" key={String(label)} onClick={() => onTab(tab as Tab)} className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-primary-600"><Icon className="h-5 w-5" /></div><strong className="mt-5 block text-3xl font-black text-slate-950">{String(value)}</strong><span className="text-sm font-bold text-slate-500">{String(label)}</span></button>)}</div><div className="grid gap-6 xl:grid-cols-2"><Panel title="Dịch vụ gần đây" subtitle="Các yêu cầu mới nhất của tài khoản.">{recentServices.length ? recentServices.map((item) => <div key={item.id} className="mb-3 rounded-2xl bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><strong className="font-mono text-xs">{item.id}</strong><StatusBadge value={item.status} /></div><p className="mt-2 text-sm font-bold text-slate-700">{item.serviceCategoryName}</p></div>) : <Empty icon={Wrench} title="Chưa có dịch vụ" body="Liên kết yêu cầu cũ hoặc tạo lịch mới." />}</Panel><Panel title="Đơn hàng gần đây" subtitle="Đơn mua sản phẩm và vật tư.">{recentOrders.length ? recentOrders.map((item) => <div key={item.id} className="mb-3 flex items-center justify-between rounded-2xl bg-slate-50 p-4"><div><strong className="font-mono text-xs">{item.orderNumber}</strong><p className="mt-1 text-xs text-slate-400">{formatDate(item.createdAt)}</p></div><strong className="text-sm text-primary-700">{formatMoney(item.totalAmount)}</strong></div>) : <Empty icon={ClipboardList} title="Chưa có đơn hàng" body="Đơn hàng của bạn sẽ xuất hiện tại đây." />}</Panel></div><Panel title="Thông báo mới" subtitle="Các cập nhật gần nhất liên quan đến tài khoản.">{notifications.length ? notifications.map((item) => <div key={String(item.id)} className="mb-3 rounded-2xl border border-slate-100 p-4"><strong className="text-sm">{item.title}</strong><p className="mt-1 text-sm text-slate-500">{item.body}</p></div>) : <Empty icon={Bell} title="Không có thông báo mới" body="Bạn đã cập nhật hết thông tin." />}</Panel></div>;
}
function useAccountShape() { return undefined as Awaited<ReturnType<typeof getAccountOverview>> | undefined; }
