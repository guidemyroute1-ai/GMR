'use client';

import { useState } from 'react';
import { TripOrganizerApplication } from '@/lib/tripOrganizersData';
import { approveOrganizerAction, rejectOrganizerAction } from './actions';
import { Check, X, Clock, Briefcase, CheckCircle, AlertTriangle } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';

interface OrganizersClientProps {
  applications: TripOrganizerApplication[];
}

export default function OrganizersClient({ applications }: OrganizersClientProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const stats = [
    { label: 'Total Applications', value: applications.length, icon: Briefcase, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Approved', value: applications.filter(a => a.status === 'approved').length, icon: CheckCircle, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { label: 'Pending', value: applications.filter(a => a.status === 'pending').length, icon: Clock, iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
    { label: 'Rejected', value: applications.filter(a => a.status === 'rejected').length, icon: AlertTriangle, iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  ];

  const handleApprove = async (id: string, userId: string) => {
    if (!confirm('Approve this organizer?')) return;
    setLoadingId(id);
    const res = await approveOrganizerAction(id, userId);
    setLoadingId(null);
    if (!res.success) alert(res.error);
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this organizer?')) return;
    setLoadingId(id);
    const res = await rejectOrganizerAction(id);
    setLoadingId(null);
    if (!res.success) alert(res.error);
  };

  const columns: Column<TripOrganizerApplication>[] = [
    {
      key: 'user',
      header: 'User',
      render: (a) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
            {a.user?.name ? a.user.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <div className="font-medium text-gray-800">{a.user?.name || 'Unknown'}</div>
            <div className="text-xs text-gray-500">{a.user?.email || 'No email'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'payment',
      header: 'Payment ID',
      render: (a) => <span className="text-gray-500 text-sm font-mono">{a.payment_id || 'N/A'}</span>
    },
    {
      key: 'amount',
      header: 'Amount Paid',
      render: (a) => <span className="font-semibold text-gray-700">₹{a.amount_paid}</span>
    },
    {
      key: 'date',
      header: 'Date',
      render: (a) => <span className="text-gray-500 text-sm">{new Date(a.created_at).toLocaleDateString()}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <StatusBadge status={a.status as any} />
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (a) => (
        <div className="flex justify-end gap-2">
          {a.status === 'pending' ? (
            <>
              <button
                onClick={() => handleApprove(a.id, a.user_id)}
                disabled={loadingId === a.id}
                className="p-1.5 rounded-md bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50"
                title="Approve"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleReject(a.id)}
                disabled={loadingId === a.id}
                className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                title="Reject"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <span className="text-xs text-gray-400 italic">No actions</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-6 pb-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Trip Organizers</h1>
          <p className="text-gray-500 mt-1">Manage applications from users wanting to host trips.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <DataTable columns={columns} data={applications} keyExtractor={(a) => a.id} />
    </div>
  );
}
