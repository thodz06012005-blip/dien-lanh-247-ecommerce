import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Laptop, ShieldCheck, Smartphone, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDataTable, { type AdminDataColumn } from '@/components/admin/AdminDataTable';
import AdminFormShell from '@/components/admin/AdminFormShell';
import { ADMIN_PERMISSIONS } from '@/config/adminPermissions';
import api, { getApiErrorMessage } from '@/services/api';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import type { AdminSession, AdminSessionPayload } from '@/types/admin';

const inputClass = 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-blue-100';

export default function AdminProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { admin, setSession, clearAuth, hasPermission } = useAdminAuthStore();
  const [profile, setProfile] = useState({ firstName: '', lastName: '', phone: '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!admin) return;
    setProfile({ firstName: admin.firstName || '', lastName: admin.lastName || '', phone: admin.phone || '' });
  }, [admin]);

  const sessionsQuery = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: async () => (await api.get('/admin/auth/sessions')).data.data as AdminSession[],
  });

  const originalProfile = useMemo(() => ({
    firstName: admin?.firstName || '',
    lastName: admin?.lastName || '',
    phone: admin?.phone || '',
  }), [admin]);
  const profileDirty = JSON.stringify(profile) !== JSON.stringify(originalProfile);

  const profileMutation = useMutation({
    mutationFn: async () => (await api.patch('/admin/auth/profile', profile)).data.data as AdminSessionPayload,
    onSuccess: (payload) => {
      setSession(payload);
      setMessage({ tone: 'success', text: 'Hồ sơ quản trị đã được cập nhật.' });
    },
    onError: (error) => setMessage({ tone: 'error', text: getApiErrorMessage(error) }),
  });

  const passwordMutation = useMutation({
    mutationFn: () => api.post('/admin/auth/change-password', {
      currentPassword: password.currentPassword,
      newPassword: password.newPassword,
    }),
    onSuccess: () => {
      clearAuth();
      navigate('/login', { replace: true });
    },
    onError: (error) => setMessage({ tone: 'error', text: getApiErrorMessage(error) }),
  });

  const revokeMutation = useMutation({
    mutationFn: async (session: AdminSession) => {
      await api.delete(`/admin/auth/sessions/${session.id}`);
      return session;
    },
    onSuccess: (session) => {
      if (session.current) {
        clearAuth();
        navigate('/login', { replace: true });
      } else {
        void queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
        setMessage({ tone: 'success', text: 'Phiên đăng nhập đã được thu hồi.' });
      }
    },
    onError: (error) => setMessage({ tone: 'error', text: getApiErrorMessage(error) }),
  });

  const sessionColumns: AdminDataColumn<AdminSession>[] = [
    {
      key: 'device',
      header: 'Thiết bị',
      accessor: (session) => session.userAgent || '',
      sortable: true,
      render: (session) => (
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-slate-100 p-2 text-slate-500">
            {session.userAgent?.toLowerCase().includes('mobile') ? <Smartphone className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-sm text-slate-900">{session.current ? 'Thiết bị hiện tại' : 'Phiên quản trị'}</strong>
              {session.current && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">HIỆN TẠI</span>}
              {!session.active && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">ĐÃ THU HỒI</span>}
            </div>
            <p className="mt-1 max-w-md truncate text-xs text-slate-500">{session.userAgent || 'Không xác định trình duyệt'}</p>
          </div>
        </div>
      ),
      exportValue: (session) => session.userAgent || 'Không xác định',
    },
    { key: 'createdAt', header: 'Đăng nhập lúc', accessor: 'createdAt', sortable: true, render: (session) => new Date(session.createdAt).toLocaleString('vi-VN') },
    { key: 'expiresAt', header: 'Hết hạn', accessor: 'expiresAt', sortable: true, render: (session) => new Date(session.expiresAt).toLocaleString('vi-VN') },
    {
      key: 'actions',
      header: 'Hành động',
      align: 'right',
      render: (session) => session.active ? (
        <button type="button" onClick={() => revokeMutation.mutate(session)} className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100">
          Thu hồi
        </button>
      ) : <span className="text-xs text-slate-400">Không khả dụng</span>,
    },
  ];

  if (!admin) return null;
  const canManage = hasPermission(ADMIN_PERMISSIONS.PROFILE_MANAGE);

  return (
    <div className="space-y-6 pb-12">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl sm:p-9">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 text-2xl font-black shadow-xl shadow-cyan-500/20">{admin.name.charAt(0).toUpperCase()}</div>
            <div><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Admin Profile</p><h1 className="mt-2 text-3xl font-black">{admin.name}</h1><p className="mt-1 text-sm text-slate-400">{admin.email}</p></div>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-200"><ShieldCheck className="h-4 w-4" />{admin.role.toUpperCase()} · {admin.permissions.length} quyền</div>
        </div>
      </section>

      {message && <div className={`rounded-2xl border p-4 text-sm font-semibold ${message.tone === 'success' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-red-100 bg-red-50 text-red-700'}`}>{message.text}</div>}

      <AdminFormShell
        title="Thông tin cá nhân"
        description="Thông tin hiển thị trong nhật ký thao tác, header và các hoạt động quản trị."
        isDirty={profileDirty}
        isSubmitting={profileMutation.isPending}
        error={profileMutation.isError ? getApiErrorMessage(profileMutation.error) : null}
        onSubmit={() => profileMutation.mutateAsync()}
        onCancel={() => setProfile(originalProfile)}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2"><span className="text-xs font-black uppercase tracking-wider text-slate-500">Họ</span><input className={inputClass} value={profile.lastName} disabled={!canManage} onChange={(event) => setProfile({ ...profile, lastName: event.target.value })} /></label>
          <label className="space-y-2"><span className="text-xs font-black uppercase tracking-wider text-slate-500">Tên</span><input className={inputClass} value={profile.firstName} disabled={!canManage} onChange={(event) => setProfile({ ...profile, firstName: event.target.value })} /></label>
          <label className="space-y-2"><span className="text-xs font-black uppercase tracking-wider text-slate-500">Email đăng nhập</span><input className={`${inputClass} bg-slate-50`} value={admin.email} disabled /></label>
          <label className="space-y-2"><span className="text-xs font-black uppercase tracking-wider text-slate-500">Số điện thoại</span><input className={inputClass} value={profile.phone} disabled={!canManage} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label>
        </div>
      </AdminFormShell>

      {canManage && (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-amber-50 p-2.5 text-amber-600"><KeyRound className="h-5 w-5" /></div><div><h2 className="text-xl font-black text-slate-950">Đổi mật khẩu quản trị</h2><p className="mt-1 text-sm text-slate-500">Tất cả phiên sẽ bị thu hồi ngay sau khi đổi mật khẩu.</p></div></div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <input type="password" className={inputClass} placeholder="Mật khẩu hiện tại" value={password.currentPassword} onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })} />
            <input type="password" className={inputClass} placeholder="Mật khẩu mới" value={password.newPassword} onChange={(event) => setPassword({ ...password, newPassword: event.target.value })} />
            <input type="password" className={inputClass} placeholder="Xác nhận mật khẩu mới" value={password.confirmPassword} onChange={(event) => setPassword({ ...password, confirmPassword: event.target.value })} />
          </div>
          <div className="mt-5 flex justify-end"><button type="button" disabled={passwordMutation.isPending} onClick={() => { if (password.newPassword !== password.confirmPassword) return setMessage({ tone: 'error', text: 'Mật khẩu xác nhận không khớp.' }); passwordMutation.mutate(); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-50"><KeyRound className="h-4 w-4" />Đổi mật khẩu</button></div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between"><div><div className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary-600" /><h2 className="text-xl font-black text-slate-950">Thiết bị đăng nhập</h2></div><p className="mt-1 text-sm text-slate-500">Kiểm tra và thu hồi các phiên không còn sử dụng.</p></div></div>
        <AdminDataTable
          rows={sessionsQuery.data || []}
          columns={sessionColumns}
          rowKey={(session) => session.id}
          searchFields={[(session) => session.userAgent || '']}
          searchPlaceholder="Tìm trình duyệt hoặc thiết bị..."
          filters={[{ key: 'active', label: 'Trạng thái', options: [{ label: 'Đang hoạt động', value: 'active' }, { label: 'Đã thu hồi', value: 'revoked' }], predicate: (session, value) => value === 'active' ? session.active : !session.active }]}
          exportFileName="admin-sessions.csv"
          defaultPageSize={10}
          isLoading={sessionsQuery.isLoading}
        />
      </section>
    </div>
  );
}
