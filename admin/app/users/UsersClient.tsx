'use client';

import { useState, useMemo } from 'react';
import { Search, Eye, Ban, Users, UserCheck, UserPlus, UserX } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable, { Column } from '@/components/ui/DataTable';
import { User } from '@/lib/mockData';

interface UsersClientProps {
  users: User[];
}

export default function UsersClient({ users }: UsersClientProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Active Today', value: users.filter(u => u.status === 'active').length, icon: UserCheck, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { label: 'New This Week', value: users.length > 0 ? 3 : 0, icon: UserPlus, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { label: 'Blocked', value: users.filter(u => u.status === 'blocked').length, icon: UserX, iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  ];

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [statusFilter, roleFilter, search, users]);

  const columns: Column<User>[] = [
    {
      key: 'sno',
      header: 'S.No',
      render: (u) => (
        <span className="text-gray-400 text-xs font-mono"></span>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full ${u.avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
            {u.avatarInitials}
          </div>
          <div>
            <div className="font-medium text-gray-800">{u.name}</div>
            <div className="text-xs text-gray-400">{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <span className={`capitalize text-xs font-semibold px-2.5 py-1 rounded-full
          ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
            u.role === 'guide' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-600'}`}>
          {u.role}
        </span>
      ),
    },
    {
      key: 'joinedDate',
      header: 'Joined Date',
      render: (u) => (
        <span className="text-gray-500 text-sm">
          {u.joinedDate !== 'N/A' ? new Date(u.joinedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => <StatusBadge status={u.status as any} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: () => (
        <div className="flex items-center justify-end gap-2">
          <button
            title="View"
            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            title="Block"
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Ban className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const columnsWithIndex: Column<User>[] = columns.map((col) =>
    col.key === 'sno'
      ? { ...col, render: (u: User) => <span className="text-gray-400 text-xs font-mono">{filtered.indexOf(u) + 1}</span> }
      : col
  );

  return (
    <div className="p-6 pb-10 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-700 min-w-[140px]"
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-700 min-w-[130px]"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="guide">Guide</option>
          </select>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <span className="text-sm text-gray-400 ml-auto">{filtered.length} of {users.length} users</span>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columnsWithIndex}
        data={filtered}
        keyExtractor={(u) => u.id}
      />
    </div>
  );
}
