'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Eye, Briefcase, CheckCircle, Clock, AlertTriangle, Plus } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable, { Column } from '@/components/ui/DataTable';
import { Partner } from '@/lib/mockData';

interface PartnersClientProps {
  partners: Partner[];
}

export default function PartnersClient({ partners }: PartnersClientProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const stats = [
    { label: 'Total Partners', value: partners.length, icon: Briefcase, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Verified', value: partners.filter(p => p.status === 'verified').length, icon: CheckCircle, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { label: 'Pending', value: partners.filter(p => p.status === 'pending').length, icon: Clock, iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
    { label: 'Suspended', value: partners.filter(p => p.status === 'suspended').length, icon: AlertTriangle, iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  ];

  const filtered = useMemo(() => {
    return partners
      .filter((p) => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.businessName.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.joinedDate === 'N/A') return 1;
        if (b.joinedDate === 'N/A') return -1;
        return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
      });
  }, [statusFilter, search, partners]);

  const columns: Column<Partner>[] = [
    {
      key: 'sno',
      header: 'S.No',
      render: (p) => <span className="text-gray-400 text-xs font-mono">{filtered.indexOf(p) + 1}</span>,
    },
    {
      key: 'partner',
      header: 'Partner',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full ${p.avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
            {p.avatarInitials}
          </div>
          <span className="font-medium text-gray-800">{p.name}</span>
        </div>
      ),
    },
    {
      key: 'businessName',
      header: 'Business Name',
      render: (p) => <span className="text-gray-700">{p.businessName}</span>,
    },
    {
      key: 'location',
      header: 'Location',
      render: (p) => <span className="text-gray-500 text-sm">{p.location}</span>,
    },
    {
      key: 'listings',
      header: 'Listings',
      render: (p) => (
        <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${p.listings > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-400'}`}>
          {p.listings}
        </span>
      ),
    },
    {
      key: 'joinedDate',
      header: 'Joined',
      render: (p) => (
        <span className="text-gray-500 text-sm">
          {p.joinedDate !== 'N/A' ? new Date(p.joinedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <StatusBadge status={p.status as any} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (p) => (
        <Link href={`/partners/${p.id}`}>
          <button
            title="View"
            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </Link>
      ),
    },
  ];

  return (
    <div className="p-6 pb-10 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Filters + Add Button */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-700 min-w-[150px]"
          >
            <option value="all">All Partners</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search partner or business..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors ml-auto">
            <Plus className="w-4 h-4" />
            Add Partner
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={filtered} keyExtractor={(p) => p.id} />
    </div>
  );
}
