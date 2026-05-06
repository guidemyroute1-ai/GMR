'use client';

import { useMemo, useState } from 'react';
import {
  Search,
  Eye,
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable, { Column } from '@/components/ui/DataTable';
import { Booking } from '@/lib/mockData';

const ITEMS_PER_PAGE = 5;

export default function BookingsClient({ bookings }: { bookings: Booking[] }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const stats = [
    { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length, icon: CheckCircle2, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length, icon: Clock, iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
    { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, icon: CalendarCheck, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, icon: XCircle, iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  ];

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return bookings.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (
        query &&
        !b.client.toLowerCase().includes(query) &&
        !b.listing.toLowerCase().includes(query) &&
        !b.id.toLowerCase().includes(query)
      )
        return false;
      return true;
    });
  }, [bookings, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const goTo = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const columns: Column<Booking>[] = [
    {
      key: 'sno',
      header: 'S.No',
      render: (b) => <span className="text-gray-400 text-xs font-mono">#{b.id}</span>,
    },
    {
      key: 'client',
      header: 'Client',
      render: (b) => <span className="font-medium text-gray-800">{b.client}</span>,
    },
    {
      key: 'partner',
      header: 'Partner',
      render: (b) => <span className="text-gray-600 text-sm">{b.partner}</span>,
    },
    {
      key: 'listing',
      header: 'Listing',
      render: (b) => <span className="text-gray-600 text-sm max-w-[140px] truncate block">{b.listing}</span>,
    },
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (b) => (
        <div className="flex items-center gap-1.5 text-gray-500 text-sm">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          {b.dateTime}
        </div>
      ),
    },
    {
      key: 'guests',
      header: 'Guests',
      render: (b) => (
        <span className="text-sm font-semibold text-gray-700 bg-gray-50 px-2.5 py-1 rounded-full">
          {b.guests}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (b) => <span className="font-semibold text-gray-800">{b.amount}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (b) => <StatusBadge status={b.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: () => (
        <button
          title="View"
          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 pb-10 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-700 min-w-[150px]"
          >
            <option value="all">All Bookings</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search client, listing, or ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <span className="text-sm text-gray-400 ml-auto">
            {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <DataTable columns={columns} data={paginated} keyExtractor={(b) => b.id} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
          <p className="text-sm text-gray-500">
            Showing{' '}
            <span className="font-medium text-gray-700">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
            </span>{' '}
            of <span className="font-medium text-gray-700">{filtered.length}</span> bookings
          </p>

          <div className="flex items-center gap-1">
            <button onClick={() => goTo(1)} disabled={currentPage === 1} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button onClick={() => goTo(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers().map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 py-1 text-gray-400 text-sm">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goTo(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === p ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button onClick={() => goTo(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => goTo(totalPages)} disabled={currentPage === totalPages} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
