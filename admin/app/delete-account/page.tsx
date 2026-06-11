'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { requestDataDeletion } from '@/lib/actions';

export default function DeleteAccountPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    
    try {
      await requestDataDeletion(email);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-8">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Delete Your Account</h1>
          <p className="text-gray-500 mb-6 text-sm">
            Submit a request to permanently delete your account and all associated data from our servers. 
            This action cannot be undone.
          </p>

          {submitted ? (
            <div className="bg-green-50 rounded-xl p-6 text-center border border-green-100">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-green-800 mb-1">Request Received</h3>
              <p className="text-green-600 text-sm">
                Your data deletion request has been successfully submitted. Our team will process it within 7-14 business days.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="bg-orange-50 rounded-lg p-4 flex gap-3 border border-orange-100">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-orange-800">
                  By submitting this form, you understand that your profile, bookings, listings, and all personal data will be permanently erased.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className={`w-full py-3 px-4 rounded-xl text-white font-medium transition-all flex justify-center items-center gap-2
                  ${loading || !email 
                    ? 'bg-red-300 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700 active:transform active:scale-[0.98]'
                  }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Request Deletion'
                )}
              </button>
            </form>
          )}
        </div>
        
        <div className="bg-gray-50 border-t border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-400">
            For further assistance, please contact support at support@guidemyroute.com
          </p>
        </div>
      </div>
    </div>
  );
}
