'use client';

import { useState, useMemo, useTransition } from 'react';
import { Search, Eye, BookOpen, CheckCircle, FileText, Clock, Archive, X, Pencil, Loader2 } from 'lucide-react';
import { updateListing } from '@/lib/actions';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable, { Column } from '@/components/ui/DataTable';
import { Listing, ListingCategory } from '@/lib/mockData';

const categories: Array<ListingCategory | 'all'> = ['all', 'Tour', 'Hotel', 'Car Rental', 'Adventure', 'Cultural', 'Food'];

interface ListingsClientProps {
  listings: Listing[];
}

export default function ListingsClient({ listings }: ListingsClientProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [localListings, setLocalListings] = useState<Listing[]>(listings);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const stats = [
    { label: 'Active', value: localListings.filter(l => l.status === 'active').length, icon: CheckCircle, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { label: 'Draft', value: localListings.filter(l => l.status === 'draft').length, icon: FileText, iconBg: 'bg-gray-100', iconColor: 'text-gray-600' },
    { label: 'Under Review', value: localListings.filter(l => l.status === 'under_review').length, icon: Clock, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Archived', value: localListings.filter(l => l.status === 'archived').length, icon: Archive, iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
  ];

  const uniqueLocations = useMemo(() => {
    const locs = Array.from(new Set(localListings.map(l => l.location.split(',')[1]?.trim() ?? l.location)));
    return locs;
  }, [localListings]);

  const filtered = useMemo(() => {
    return localListings.filter((l) => {
      if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (locationFilter !== 'all' && !l.location.includes(locationFilter)) return false;
      if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.partner.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [categoryFilter, statusFilter, locationFilter, search, localListings]);

  const categoryColors: Record<ListingCategory, string> = {
    Tour: 'bg-green-100 text-green-700',
    Hotel: 'bg-blue-100 text-blue-700',
    'Car Rental': 'bg-orange-100 text-orange-700',
    Adventure: 'bg-purple-100 text-purple-700',
    Cultural: 'bg-yellow-100 text-yellow-700',
    Food: 'bg-red-100 text-red-700',
  };

  const columns: Column<Listing>[] = [
    {
      key: 'sno',
      header: 'S.No',
      render: (l) => <span className="text-gray-400 text-xs font-mono">{filtered.indexOf(l) + 1}</span>,
    },
    {
      key: 'name',
      header: 'Listing Name',
      render: (l) => <span className="font-medium text-gray-800">{l.name}</span>,
    },
    {
      key: 'partner',
      header: 'Partner',
      render: (l) => <span className="text-gray-600 text-sm">{l.partner}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (l) => (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColors[l.category as ListingCategory] || 'bg-gray-100 text-gray-700'}`}>
          {l.category}
        </span>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (l) => <span className="text-gray-500 text-sm">{l.location}</span>,
    },
    {
      key: 'price',
      header: 'Price',
      render: (l) => <span className="font-semibold text-gray-800 text-sm">{l.price}</span>,
    },
    {
      key: 'details',
      header: 'Technical Details',
      render: (l) => {
        if (!l.details || Object.keys(l.details).length === 0) return <span className="text-gray-300">-</span>;
        return (
          <div className="flex flex-wrap gap-1 max-w-[250px]">
            {Object.entries(l.details).map(([k, v]) => {
              if (!v || typeof v !== 'string' || k === 'rating' || k === 'reviews') return null;
              return (
                <span key={k} className="bg-gray-50 border border-gray-100 text-[10px] px-1.5 py-0.5 rounded text-gray-500">
                  <span className="font-medium uppercase opacity-60">{k}:</span> {v}
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (l) => <StatusBadge status={l.status as any} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (l) => (
        <div className="flex justify-end gap-1">
          <button
            title="Edit"
            onClick={() => setEditingListing(l)}
            className="p-2 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            title="View"
            onClick={() => setSelectedListing(l)}
            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 pb-10 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-700 min-w-[130px]"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
            ))}
          </select>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-700 min-w-[130px]"
          >
            <option value="all">All Locations</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-700 min-w-[130px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="under_review">Under Review</option>
            <option value="archived">Archived</option>
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search listings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <span className="text-sm text-gray-400 ml-auto">{filtered.length} of {localListings.length}</span>
        </div>
      </div>

      <DataTable columns={columns} data={filtered} keyExtractor={(l) => l.id} />

      {/* Listing Detail Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-600" />
                Listing Details
              </h2>
              <button onClick={() => setSelectedListing(null)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Listing Name</h3>
                  <p className="text-gray-900 font-semibold text-base">{selectedListing.name}</p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Partner</h3>
                  <p className="text-gray-900 text-base">{selectedListing.partner}</p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</h3>
                  <div>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${categoryColors[selectedListing.category as ListingCategory] || 'bg-gray-100 text-gray-700'}`}>
                      {selectedListing.category}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</h3>
                  <p className="text-gray-900 text-base">{selectedListing.location}</p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</h3>
                  <p className="text-gray-900 font-semibold text-base text-green-700">{selectedListing.price}</p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</h3>
                  <div>
                    <StatusBadge status={selectedListing.status as any} />
                  </div>
                </div>
              </div>

              {selectedListing.details && Object.keys(selectedListing.details).length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    Technical Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(selectedListing.details).map(([key, value]) => {
                      if (!value || key === 'rating' || key === 'reviews') return null;
                      return (
                        <div key={key} className="bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-sm">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-sm text-gray-800 font-medium">{String(value)}</span>
                        </div>
                      );
                    })}
                    
                    {/* Render rating/reviews nicely if present */}
                    {selectedListing.details.rating && (
                      <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 shadow-sm">
                        <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block mb-1">Rating</span>
                        <span className="text-sm text-orange-800 font-bold flex items-center gap-1">
                          ★ {selectedListing.details.rating}
                          {selectedListing.details.reviews && <span className="text-xs text-orange-600 font-normal ml-1">({selectedListing.details.reviews} reviews)</span>}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex justify-end">
              <button 
                onClick={() => setSelectedListing(null)}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Listing Modal */}
      {editingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-orange-600" />
                Edit Listing
              </h2>
              <button onClick={() => setEditingListing(null)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Listing Name</label>
                  <input
                    type="text"
                    value={editingListing.name}
                    onChange={(e) => setEditingListing({ ...editingListing, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                {/* Partner */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Partner</label>
                  <input
                    type="text"
                    value={editingListing.partner}
                    onChange={(e) => setEditingListing({ ...editingListing, partner: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                {/* Category */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Category</label>
                  <select
                    value={editingListing.category}
                    onChange={(e) => setEditingListing({ ...editingListing, category: e.target.value as ListingCategory })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    {categories.filter(c => c !== 'all').map((c) => (
                      <option key={c} value={c as string}>{c}</option>
                    ))}
                  </select>
                </div>
                {/* Location */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Location</label>
                  <input
                    type="text"
                    value={editingListing.location}
                    onChange={(e) => setEditingListing({ ...editingListing, location: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                {/* Price */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Price</label>
                  <input
                    type="text"
                    value={editingListing.price}
                    onChange={(e) => setEditingListing({ ...editingListing, price: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g. ₹4,500/night"
                  />
                </div>
                {/* Status */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Status</label>
                  <select
                    value={editingListing.status}
                    onChange={(e) => setEditingListing({ ...editingListing, status: e.target.value as any })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="under_review">Under Review</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Technical Details Editor */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    Technical Details
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const newKey = `field_${Date.now()}`;
                      setEditingListing({
                        ...editingListing,
                        details: { ...(editingListing.details || {}), [newKey]: '' },
                      });
                    }}
                    className="text-xs px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg hover:bg-orange-100 font-medium transition-colors"
                  >
                    + Add Field
                  </button>
                </div>

                {editingListing.details && Object.keys(editingListing.details).length > 0 ? (
                  <div className="space-y-2.5">
                    {/* Header row */}
                    <div className="grid grid-cols-[1fr_2fr_auto] gap-2 px-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Key</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Value</span>
                    </div>
                    {Object.entries(editingListing.details).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-center group">
                        <input
                          type="text"
                          defaultValue={key}
                          onBlur={(e) => {
                            const newKey = e.target.value.trim();
                            if (!newKey || newKey === key) return;
                            const entries = Object.entries(editingListing.details);
                            const rebuilt: Record<string, any> = {};
                            entries.forEach(([k, v]) => { rebuilt[k === key ? newKey : k] = v; });
                            setEditingListing({ ...editingListing, details: rebuilt });
                          }}
                          placeholder="field name"
                          className="border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 text-gray-600"
                        />
                        <input
                          type="text"
                          value={String(value ?? '')}
                          onChange={(e) =>
                            setEditingListing({
                              ...editingListing,
                              details: { ...editingListing.details, [key]: e.target.value },
                            })
                          }
                          placeholder="value"
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const { [key]: _, ...rest } = editingListing.details;
                            setEditingListing({ ...editingListing, details: rest });
                          }}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove field"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    No technical details yet. Click <span className="font-semibold text-orange-500">+ Add Field</span> to add one.
                  </p>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-3">
              {saveError && (
                <p className="text-xs text-red-600 mr-auto flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  {saveError}
                </p>
              )}
              <button 
                disabled={isPending}
                onClick={() => { setSaveError(null); setEditingListing(null); }}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                disabled={isPending}
                onClick={() => {
                  setSaveError(null);
                  // Optimistic update — show changes instantly in the table
                  setLocalListings(localListings.map(l => l.id === editingListing.id ? editingListing : l));
                  startTransition(async () => {
                    const result = await updateListing(editingListing.id, {
                      name: editingListing.name,
                      partner: editingListing.partner,
                      category: editingListing.category,
                      location: editingListing.location,
                      price: editingListing.price,
                      status: editingListing.status,
                      details: editingListing.details,
                    });
                    if (result.error) {
                      // Roll back optimistic update on failure
                      setLocalListings(localListings);
                      setSaveError(result.error);
                    } else {
                      setEditingListing(null);
                    }
                  });
                }}
                className="px-6 py-2 bg-orange-600 border border-transparent text-white rounded-xl font-medium hover:bg-orange-700 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-60 flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
