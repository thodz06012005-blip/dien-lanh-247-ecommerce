import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import Card from '../components/ui/Card';
import Table, { type TableColumn } from '../components/ui/Table';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import { Search } from 'lucide-react';

interface Customer {
  key: string;
  id: string;
  name: string;
  phone: string;
  email: string;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
}

export default function Customers() {
  const [searchText, setSearchText] = useState('');

  // Fetch customers
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      const res = await api.get('/admin/customers');
      return res.data;
    }
  });

  const customersList = data?.data || [];

  // Filter customers based on search text
  const filteredCustomers = customersList.filter((c: Customer) => {
    const searchLower = searchText.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(searchLower) ||
      (c.phone || '').includes(searchText) ||
      (c.email || '').toLowerCase().includes(searchLower)
    );
  });

  const columns: TableColumn<Customer>[] = [
    {
      title: 'Họ tên',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-sm flex items-center justify-center font-bold text-sm select-none shrink-0">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-slate-900">{row.name}</span>
        </div>
      )
    },
    {
      title: 'Số điện thoại',
      key: 'phone',
      render: (row) => <span className="font-medium text-slate-700">{row.phone}</span>
    },
    {
      title: 'Email',
      key: 'email',
      render: (row) => row.email ? <span className="text-sm text-slate-500">{row.email}</span> : <span className="text-xs text-slate-400 italic">Không có</span>
    },
    {
      title: 'Số đơn hàng',
      key: 'orderCount',
      render: (row) => <Badge variant="primary" pill>{row.orderCount || 0} đơn</Badge>
    },
    {
      title: 'Tổng chi tiêu',
      key: 'totalSpent',
      className: 'text-right',
      render: (row) => (
        <strong className="text-blue-600 font-bold text-sm">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.totalSpent || 0)}
        </strong>
      )
    },
    {
      title: 'Ngày tham gia',
      key: 'createdAt',
      render: (row) => {
        try {
          return <span className="text-slate-500 font-medium text-xs">{new Date(row.createdAt).toLocaleDateString('vi-VN')}</span>;
        } catch {
          return row.createdAt;
        }
      }
    }
  ];

  if (isLoading) {
    return <LoadingState message="Đang tải danh sách khách hàng..." />;
  }

  if (error || !data?.success) {
    return (
      <EmptyState
        message="Lỗi kết nối dữ liệu"
        subMessage="Không thể tải danh sách khách hàng từ Mock API Server."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Quản lý khách hàng
          </h1>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Danh sách khách mua hàng trên hệ thống Điện Lạnh 247.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Input
            placeholder="Tìm theo tên, SĐT, Email..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10 h-10 bg-white shadow-sm border-slate-200"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>
      </div>

      <Card noPadding className="overflow-hidden shadow-sm border-slate-200/60">
        <Table
          columns={columns}
          dataSource={filteredCustomers.map((c: Customer, index: number) => ({ ...c, key: c.id || index }))}
          emptyText="Không tìm thấy khách hàng nào khớp với tìm kiếm."
        />
      </Card>
    </div>
  );
}
