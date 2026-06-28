'use client';

import { useState } from 'react';
import { Trip } from '@/lib/tripsData';
import { deleteTripAction, toggleFeaturedAction } from './actions';
import { Trash2, Star, CheckCircle, Clock, Search, Briefcase } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';

interface TripsClientProps {
  trips: Trip[];
}

export default function TripsClient({ trips }: TripsClientProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  const filteredTrips = trips.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.city.toLowerCase().includes(search.toLowerCase()));

  const stats = [
    { label: 'Total Trips', value: trips.length, icon: Briefcase, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Active', value: trips.filter(t => t.is_active).length, icon: CheckCircle, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { label: 'Featured', value: trips.filter(t => t.is_featured).length, icon: Star, iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
  ];

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this trip? This action cannot be undone.')) return;
    setLoadingId(id);
    const res = await deleteTripAction(id);
    setLoadingId(null);
    if (!res.success) alert(res.error);
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    setLoadingId(id);
    const res = await toggleFeaturedAction(id, current);
    setLoadingId(null);
    if (!res.success) alert(res.error);
  };

  const columns: Column<Trip>[] = [
    {
      key: 'title',
      header: 'Trip',
      render: (t) => (
        <div>
          <div className="font-medium text-gray-800">{t.title}</div>
          <div className="text-xs text-gray-500">{t.city}</div>
        </div>
      )
    },
    {
      key: 'organizer',
      header: 'Organizer',
      render: (t) => (
        <span className="text-sm text-gray-600">{t.organizer?.name || 'Unknown'}</span>
      )
    },
    {
      key: 'price',
      header: 'Price',
      render: (t) => <span className="font-semibold text-gray-700">₹{t.price}</span>
    },
    {
      key: 'capacity',
      header: 'Joined / Capacity',
      render: (t) => <span className="text-sm text-gray-600">{t.joined_count} / {t.capacity}</span>
    },
    {
      key: 'date',
      header: 'Date',
      render: (t) => <span className="text-sm text-gray-500">{new Date(t.trip_date).toLocaleDateString()}</span>
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (t) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleToggleFeatured(t.id, t.is_featured)}
            disabled={loadingId === t.id}
            className={`p-1.5 rounded-md ${t.is_featured ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
            title={t.is_featured ? 'Remove Featured' : 'Feature Trip'}
          >
            <Star className="w-4 h-4" fill={t.is_featured ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => handleDelete(t.id)}
            disabled={loadingId === t.id}
            className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
            title="Delete Trip"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 pb-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Trips</h1>
          <p className="text-gray-500 mt-1">Manage all trips created by organizers.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={filteredTrips} keyExtractor={(t) => t.id} />
    </div>
  );
}
