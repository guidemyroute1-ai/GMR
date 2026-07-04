'use client';

import { useState, useTransition } from 'react';
import { ArrowLeft, CheckCircle, MapPin, Building, CreditCard, Shield, Smartphone, Mail, Briefcase, FileText, Video, Calendar, User, ChevronDown, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { approvePartner, rejectPartner } from '../actions';

export default function PartnerDetailClient({ partner }: { partner: any }) {
  const router = useRouter();
  const [approvalStatus, setApprovalStatus] = useState(partner.status);
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      const res = await approvePartner(partner.id);
      if (res.success) {
        alert('Partner Approved!');
        setApprovalStatus('verified');
      } else {
        alert(res.error || 'Something went wrong');
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const res = await rejectPartner(partner.id);
      if (res.success) {
        alert('Partner Rejected!');
        setApprovalStatus('suspended');
      } else {
        alert(res.error || 'Something went wrong');
      }
    });
  };

  const profileData = partner.profileData || {};

  const knownKeys = ['avatar', 'emergencyContact', 'gender', 'jobType', 'category', 'experience', 'city', 'zone', 'address', 'aadharNumber', 'panNumber', 'bankAccount', 'ifscCode', 'bankNumber', 'upiId'];
  const dynamicRows = Object.entries(profileData).filter(([k, v]) => !knownKeys.includes(k) && v !== undefined && v !== null && v !== '');

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 bg-[#f8fafc] min-h-screen">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-2">
        <Link href="/partners" className="group flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 text-sm font-medium">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Partners
        </Link>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-400 font-mono bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">ID: {partner.id}</div>
        </div>
      </div>

      {/* Header Banner & Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-red-600 via-rose-500 to-orange-500 relative">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl opacity-0"></div>
          {approvalStatus === 'verified' && (
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-white text-xs font-medium border border-white/30 shadow-sm">
              <CheckCircle className="w-4 h-4" /> KYC Verified
            </div>
          )}
        </div>
        
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-12 mb-6">
            <div className="w-28 h-28 rounded-2xl bg-white p-1 shadow-lg relative z-10">
              <div className="w-full h-full rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                {profileData.avatar || partner.photoUrl ? (
                  <img src={profileData.avatar || partner.photoUrl} alt={partner.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full ${partner.avatarColor || 'bg-gray-200 text-gray-600'} flex items-center justify-center text-3xl font-bold`}>
                    {partner.avatarInitials || partner.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 space-y-1.5 pt-12 sm:pt-0">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{partner.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {partner.businessName && (
                  <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                    <Briefcase className="w-4 h-4 text-gray-400"/> {partner.businessName}
                  </span>
                )}
                {partner.location && (
                  <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                    <MapPin className="w-4 h-4 text-gray-400"/> {partner.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                    <Calendar className="w-4 h-4 text-gray-400"/> Joined {new Date(partner.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="w-full sm:w-auto flex flex-col gap-2 mt-4 sm:mt-0">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Status</label>
              <div className="relative">
                <select
                  value={approvalStatus}
                  onChange={(e) => setApprovalStatus(e.target.value)}
                  className={`appearance-none border text-sm rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium transition-colors w-full sm:w-56 shadow-sm
                    ${approvalStatus === 'verified' ? 'bg-green-50 border-green-200 text-green-700' :
                      approvalStatus === 'pending' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                      'bg-red-50 border-red-200 text-red-700'}`}
                >
                  <option value="pending">⏳ Pending Review</option>
                  <option value="verified">✅ Verified Partner</option>
                  <option value="suspended">🚫 Suspended / Rejected</option>
                </select>
                <ChevronDown className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none
                  ${approvalStatus === 'verified' ? 'text-green-500' : approvalStatus === 'pending' ? 'text-amber-500' : 'text-red-500'}
                `} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Contact & Bank Details) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-4">
              <User className="w-5 h-5 text-red-500" /> Contact Info
            </h2>
            <div className="space-y-3">
              <DataItem label="Mobile Number" value={partner.phone} icon={Smartphone} />
              <DataItem label="Email Address" value={partner.email} icon={Mail} />
              <DataItem label="Emergency Contact" value={profileData.emergencyContact} icon={Smartphone} />
            </div>
          </div>

          {/* Bank Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-4">
              <Building className="w-5 h-5 text-red-500" /> Bank Details
            </h2>
            <div className="space-y-3">
              <DataItem label="Bank Account Number" value={profileData.bankAccount} icon={CreditCard} />
              <DataItem label="IFSC Code" value={profileData.ifscCode} icon={Building} />
              <DataItem label="UPI ID" value={profileData.upiId} icon={Smartphone} />
            </div>
          </div>
        </div>

        {/* Right Column (KYC, Business Profile) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* KYC Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6 border-b border-gray-50 pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" /> KYC Verification
              </h2>
              {approvalStatus === 'pending' && (
                <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md text-xs font-semibold border border-amber-100">
                  <AlertCircle className="w-3.5 h-3.5" /> Action Required
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <DataItem label="Aadhar Number" value={profileData.aadharNumber} icon={FileText} />
              <DataItem label="PAN Number" value={profileData.panNumber} icon={FileText} />
            </div>

            <div className="space-y-3 mb-6">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Uploaded Documents</label>
              {partner.documents && partner.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {partner.documents.map((docUrl: string, index: number) => (
                    <div key={index} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-3 transition-all hover:shadow-md hover:border-gray-300 hover:bg-white flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden shadow-sm flex-shrink-0 border border-gray-100">
                        <img src={docUrl} alt={`Document ${index + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      </div>
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="font-semibold text-gray-900 text-sm truncate">Document {index + 1}</span>
                        <a href={docUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 mt-1 hover:text-blue-800 font-medium w-fit">View Original</a>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                  <p className="text-sm text-gray-500">No documents uploaded</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Demo Video Verification</label>
              {partner.kycVideoUrl ? (
                <div className="rounded-xl border border-gray-200 overflow-hidden bg-black/5 aspect-video w-full max-w-lg relative group">
                  <video src={partner.kycVideoUrl} controls className="w-full h-full object-contain" preload="metadata" />
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded text-white text-xs font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Video className="w-3.5 h-3.5" /> Video Demo
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                  <p className="text-sm text-gray-500">No demo video uploaded</p>
                </div>
              )}
            </div>
          </div>

          {/* Business Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
             <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-4 mb-5">
              <Briefcase className="w-5 h-5 text-red-500" /> Professional Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <DataItem label="Work Experience" value={profileData.experience} />
              <DataItem label="City" value={profileData.city} />
              <DataItem label="Zone" value={profileData.zone} />
            </div>
            
            <div className="mt-4">
               <DataItem label="Full Address" value={profileData.address} isTextArea />
            </div>

            {dynamicRows.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-50">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Additional Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {dynamicRows.map(([key, value]) => {
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
                    const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
                    const isLongText = displayValue.length > 50;
                    return (
                      <div key={key} className={isLongText ? "sm:col-span-2" : ""}>
                         <DataItem label={label} value={displayValue} isTextArea={isLongText} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons Footer */}
      {approvalStatus === 'pending' && (
        <div className="sticky bottom-0 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 mt-6 px-4 sm:px-6 py-4 bg-white/90 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">Review Partner Application</p>
              <p className="text-xs text-gray-500">Please review all KYC documents before approving.</p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={handleReject}
                className="flex-1 sm:flex-none px-6 py-2.5 text-red-600 font-semibold bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors"
              >
                Reject Application
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 sm:flex-none px-8 py-2.5 text-white font-semibold bg-red-600 rounded-xl hover:bg-red-700 hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Approve Partner
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

// Reusable Data Display Component
function DataItem({ label, value, icon: Icon, isTextArea = false }: { label: string; value?: string; icon?: any, isTextArea?: boolean }) {
  if (!value) value = 'N/A';
  return (
    <div className={`flex flex-col gap-1.5 p-3.5 rounded-xl border border-gray-100/80 bg-gray-50/50 hover:bg-white hover:border-gray-200 transition-colors ${isTextArea ? 'w-full' : ''}`}>
      <div className="flex items-center gap-2 text-gray-500">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-gray-900 text-sm font-medium ${isTextArea ? 'whitespace-pre-wrap leading-relaxed' : 'truncate'}`}>
        {value}
      </div>
    </div>
  );
}
