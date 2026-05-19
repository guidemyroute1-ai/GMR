'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import {
  MapPin,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  X,
  ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  addDestination,
  deleteDestination,
  toggleDestinationPopular,
} from '@/lib/actions';

interface Destination {
  id: string;
  name: string;
  state: string;
  image_url: string;
  is_popular: boolean;
  created_at: string;
}

interface Props {
  destinations: Destination[];
}

export default function DestinationsClient({ destinations: initial }: Props) {
  const [destinations, setDestinations] = useState<Destination[]>(initial);
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    state: '',
    image_url: '',
    is_popular: true,
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.state.trim() || !form.image_url.trim()) {
      setFormError('All fields are required.');
      return;
    }
    setFormError('');
    setIsSubmitting(true);

    startTransition(async () => {
      const result = await addDestination(form);
      setIsSubmitting(false);
      if (result.error) {
        showToast(result.error, 'error');
      } else {
        showToast('Destination added!', 'success');
        setShowModal(false);
        setForm({ name: '', state: '', image_url: '', is_popular: true });
        // Optimistically add a placeholder — page will revalidate on next visit
        // For immediate UX, just reload
        window.location.reload();
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this destination?')) return;
    startTransition(async () => {
      const result = await deleteDestination(id);
      if (result.error) {
        showToast(result.error, 'error');
      } else {
        setDestinations((prev) => prev.filter((d) => d.id !== id));
        showToast('Destination deleted.', 'success');
      }
    });
  };

  const handleToggle = (id: string, current: boolean) => {
    startTransition(async () => {
      const result = await toggleDestinationPopular(id, !current);
      if (result.error) {
        showToast(result.error, 'error');
      } else {
        setDestinations((prev) =>
          prev.map((d) => (d.id === id ? { ...d, is_popular: !current } : d))
        );
      }
    });
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all
            ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-green-600" />
          <h1 className="text-lg font-semibold text-gray-900">
            Popular Destinations
          </h1>
          <span className="ml-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
            {destinations.length} total
          </span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Destination
        </button>
      </div>

      {/* Grid */}
      <div className="p-8">
        {destinations.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No destinations yet</p>
            <p className="text-sm mt-1">Click "Add Destination" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {destinations.map((dest) => (
              <div
                key={dest.id}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
              >
                {/* Image */}
                <div className="relative h-44 bg-gray-100">
                  {dest.image_url ? (
                    <img
                      src={dest.image_url}
                      alt={dest.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="w-10 h-10 text-gray-300" />
                    </div>
                  )}

                  {/* Popular badge */}
                  <div
                    className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full
                      ${dest.is_popular
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'}`}
                  >
                    {dest.is_popular ? 'Popular' : 'Hidden'}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="font-semibold text-gray-900">{dest.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{dest.state}</p>

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(dest.id, dest.is_popular)}
                      disabled={isPending}
                      title={dest.is_popular ? 'Hide from app' : 'Show in app'}
                      className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-lg border transition-colors
                        ${dest.is_popular
                          ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                          : 'border-gray-200 text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
                    >
                      {dest.is_popular ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                      {dest.is_popular ? 'Visible' : 'Hidden'}
                    </button>

                    <button
                      onClick={() => handleDelete(dest.id)}
                      disabled={isPending}
                      title="Delete destination"
                      className="p-1.5 rounded-lg border border-red-100 text-red-400 bg-red-50 hover:bg-red-100 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add New Destination</h2>
              <button
                onClick={() => { setShowModal(false); setFormError(''); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  City / Place Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rishikesh"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Uttarakhand"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Image URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Use any public image URL (Unsplash, etc.)
                </p>
              </div>

              {/* Preview */}
              {form.image_url && (
                <div className="rounded-xl overflow-hidden h-36 bg-gray-100">
                  <img
                    src={form.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                    }}
                  />
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_popular: !form.is_popular })}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors
                    ${form.is_popular ? 'bg-green-500' : 'bg-gray-200'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                      ${form.is_popular ? 'translate-x-5' : 'translate-x-1'}`}
                  />
                </button>
                <span className="text-sm text-gray-700 font-medium">
                  Show as Popular Destination
                </span>
              </div>

              {formError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {formError}
                </p>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setShowModal(false); setFormError(''); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Destination
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
