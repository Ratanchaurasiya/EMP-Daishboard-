import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Camera,
  Plus,
  FolderOpen,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Laptop,
  Smartphone,
  Headphones,
  Keyboard,
  Mouse,
  Monitor,
  CheckCircle2,
  Clock,
  Filter,
  FileImage,
  Sparkles,
} from 'lucide-react';
import { WeeklyPhotoCard } from './WeeklyPhotoCard';
import { WeeklyPhotoUploadModal } from './WeeklyPhotoUploadModal';
import { WeeklyAssetPhotoRecord, AssetCondition, AssetType } from '../../types';
import { getEmployeeAssignedCompanyAssets } from '../../utils/assetUtils';
import { formatDateDisplay } from '../../utils/formatters';

interface EmployeeWeeklyPhotoSectionProps {
  employeeId: string;
  employeeName: string;
}

interface AssetTrackedItem {
  assetNumber: string;
  assetName: string;
  assetType: AssetType | string;
  isCurrentlyAssigned: boolean;
  auditCount: number;
  latestAuditDate?: string;
  latestCondition?: AssetCondition;
  latestPhotoUrl?: string;
}

export const EmployeeWeeklyPhotoSection: React.FC<EmployeeWeeklyPhotoSectionProps> = ({
  employeeId,
  employeeName,
}) => {
  const {
    weeklyPhotoRecords,
    employees,
    computers,
    assets,
    deleteWeeklyPhotoRecord,
    userRole,
    currentUser,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<WeeklyAssetPhotoRecord | null>(null);
  const [selectedAssetFilter, setSelectedAssetFilter] = useState<string>('all');
  const [targetAssetForUpload, setTargetAssetForUpload] = useState<string | undefined>(undefined);

  // Robust matching: check both internal UUID id and employeeId string (e.g. EMP001 / EMP0108)
  const emp = employees.find(e => e.id === employeeId || e.employeeId === employeeId);
  const targetIds = new Set([employeeId, emp?.id, emp?.employeeId].filter(Boolean));

  // Filter records for this employee
  const employeeRecords = useMemo(() => {
    return weeklyPhotoRecords.filter(
      r => targetIds.has(r.employeeId) || targetIds.has(r.employeeCode)
    );
  }, [weeklyPhotoRecords, targetIds]);

  // Discover currently assigned assets
  const assignedAssets = useMemo(() => {
    return getEmployeeAssignedCompanyAssets(emp || null, computers, assets);
  }, [emp, computers, assets]);

  // Build unified list of all assets for this employee (Current + Audited History)
  const trackedAssets = useMemo(() => {
    const map = new Map<string, AssetTrackedItem>();

    // 1. Current assigned assets
    assignedAssets.forEach(a => {
      const num = a.assetNumber?.trim() || a.id;
      map.set(num.toLowerCase(), {
        assetNumber: a.assetNumber,
        assetName: a.deviceName || `${a.brand} ${a.model}`,
        assetType: a.assetType,
        isCurrentlyAssigned: true,
        auditCount: 0,
      });
    });

    // 2. Scan historical records for audits & missing historical assets
    (employeeRecords || []).forEach(r => {
      (r?.assetPhotos || []).forEach(p => {
        if (!p) return;
        const key = (p.assetNumber?.trim() || p.assetName || p.assetType || '').toLowerCase();
        if (!key) return;
        let existing = map.get(key);
        if (!existing) {
          existing = {
            assetNumber: p.assetNumber || 'UNTAGGED',
            assetName: p.assetName || p.assetType || 'Asset',
            assetType: p.assetType,
            isCurrentlyAssigned: false,
            auditCount: 0,
          };
          map.set(key, existing);
        }

        existing.auditCount += 1;
        if (!existing.latestAuditDate || r.inspectionDate > existing.latestAuditDate) {
          existing.latestAuditDate = r.inspectionDate;
          existing.latestCondition = p.condition;
          existing.latestPhotoUrl = p.photoUrl;
        }
      });
    });

    return Array.from(map.values());
  }, [assignedAssets, employeeRecords]);

  // Determine displayed records based on selected asset filter
  const displayedRecords = useMemo(() => {
    if (selectedAssetFilter === 'all') {
      return employeeRecords || [];
    }
    const filterLower = selectedAssetFilter.toLowerCase();
    return (employeeRecords || []).filter(r =>
      (r?.assetPhotos || []).some(
        p =>
          p?.assetNumber?.toLowerCase() === filterLower ||
          p?.assetType?.toLowerCase() === filterLower ||
          p?.assetName?.toLowerCase().includes(filterLower)
      )
    );
  }, [employeeRecords, selectedAssetFilter]);

  const activeAssetObj = useMemo(() => {
    if (selectedAssetFilter === 'all') return null;
    return trackedAssets.find(
      a => a.assetNumber.toLowerCase() === selectedAssetFilter.toLowerCase()
    );
  }, [trackedAssets, selectedAssetFilter]);

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'Laptop':
      case 'Desktop':
        return <Laptop className="w-4 h-4 text-blue-500" />;
      case 'Mobile Phone':
        return <Smartphone className="w-4 h-4 text-pink-500" />;
      case 'Keyboard':
        return <Keyboard className="w-4 h-4 text-amber-500" />;
      case 'Mouse':
        return <Mouse className="w-4 h-4 text-purple-500" />;
      case 'Headset':
        return <Headphones className="w-4 h-4 text-emerald-500" />;
      case 'Monitor':
        return <Monitor className="w-4 h-4 text-indigo-500" />;
      default:
        return <FileImage className="w-4 h-4 text-cyan-500" />;
    }
  };

  const handleOpenEdit = (record: WeeklyAssetPhotoRecord) => {
    setEditingRecord(record);
    setTargetAssetForUpload(undefined);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    setTargetAssetForUpload(undefined);
  };

  const handleOpenUploadForAsset = (assetNumber?: string) => {
    setEditingRecord(null);
    setTargetAssetForUpload(assetNumber);
    setIsModalOpen(true);
  };

  // Find any records flagged as 'Needs Attention' by admin
  const needsAttentionRecords = useMemo(() => {
    return employeeRecords.filter(
      r => r.status === 'Needs Attention' || r.reviewStatus === 'Needs Attention'
    );
  }, [employeeRecords]);

  return (
    <div className="bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Section Header */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
        <div className="flex items-center gap-2 flex-wrap">
          <Camera className="w-4 h-4 text-blue-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <span>Weekly Asset Documentation & Audit History</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
              {employeeRecords.length}
            </span>
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
            {assignedAssets.length > 0
              ? `${assignedAssets.length} Assigned ${assignedAssets.length === 1 ? 'Asset' : 'Assets'}`
              : 'General Verification Active'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleOpenUploadForAsset(undefined)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors cursor-pointer"
          title="Upload weekly asset verification documentation"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>
            {assignedAssets.length > 0
              ? `Upload Weekly Documentation (${assignedAssets.length} ${assignedAssets.length === 1 ? 'Asset' : 'Assets'})`
              : 'Upload Weekly Verification File'}
          </span>
        </button>
      </div>

      {/* Admin Needs Attention Banner (if admin flagged any upload) */}
      {needsAttentionRecords.length > 0 && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider text-[11px]">
                Administrator Feedback - Action Required ({needsAttentionRecords.length} upload{needsAttentionRecords.length === 1 ? '' : 's'})
              </span>
            </div>
            <p className="text-rose-800 dark:text-rose-300 mt-1">
              {needsAttentionRecords[0].adminRemarks
                ? `Admin Remarks for ${needsAttentionRecords[0].weekLabel}: "${needsAttentionRecords[0].adminRemarks}"`
                : `Your weekly upload for ${needsAttentionRecords[0].weekLabel} has been flagged for review. Please check or re-upload your verification file.`}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenEdit(needsAttentionRecords[0])}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-2xs cursor-pointer"
              >
                <span>Update / Re-upload Documentation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Filter Tabs Bar */}
      {trackedAssets.length > 0 && (
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/20">
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Asset Filter:</span>
            </span>

            {/* All Assets Tab */}
            <button
              type="button"
              onClick={() => setSelectedAssetFilter('all')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedAssetFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <span>All Assets</span>
              <span
                className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedAssetFilter === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {employeeRecords.length}
              </span>
            </button>

            {/* Per-Asset Tabs */}
            {trackedAssets.map(asset => {
              const isSelected =
                selectedAssetFilter.toLowerCase() === asset.assetNumber.toLowerCase();
              return (
                <button
                  key={asset.assetNumber}
                  type="button"
                  onClick={() => setSelectedAssetFilter(asset.assetNumber)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400/30'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {getAssetIcon(asset.assetType)}
                  <span>{asset.assetType}</span>
                  <span className="font-mono text-[10px] opacity-85">({asset.assetNumber})</span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : asset.auditCount > 0
                        ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                    }`}
                  >
                    {asset.auditCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-Asset Dedicated Telemetry Card (When an asset is selected) */}
      {activeAssetObj && (
        <div className="m-5 mb-0 p-4 rounded-xl bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-transparent dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-transparent border border-blue-200/80 dark:border-blue-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs shrink-0 mt-0.5">
              {getAssetIcon(activeAssetObj.assetType)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                  {activeAssetObj.assetNumber}
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {activeAssetObj.assetName}
                </h4>
                {activeAssetObj.isCurrentlyAssigned ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                    Currently Assigned
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                    Historical / Previous Asset
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3.5 mt-2 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                <span className="flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                  <strong>{activeAssetObj.auditCount}</strong> Weekly Audits Recorded
                </span>
                {activeAssetObj.latestAuditDate && (
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Latest Audit: <strong>{formatDateDisplay(activeAssetObj.latestAuditDate)}</strong>
                  </span>
                )}
                {activeAssetObj.latestCondition && (
                  <span className="flex items-center gap-1 font-medium">
                    Condition: <strong className="text-emerald-600 dark:text-emerald-400">{activeAssetObj.latestCondition}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenUploadForAsset(activeAssetObj.assetNumber)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-blue-300 dark:border-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Upload Documentation for this Asset</span>
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="p-5 space-y-4">
        {employeeRecords.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs space-y-2">
            <Camera className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              No weekly asset photo audits recorded yet for {employeeName}.
            </p>
            {assignedAssets.length === 0 ? (
              <div className="space-y-2 mt-2">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  No company hardware is currently assigned. You can still upload your weekly verification photo, workstation setup, or documents.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenUploadForAsset()}
                  className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Weekly Verification File</span>
                </button>
              </div>
            ) : (
              <>
                <p className="text-[11px] text-slate-400">
                  {assignedAssets.length} {assignedAssets.length === 1 ? 'asset is' : 'assets are'} assigned ({assignedAssets.map(a => a.deviceName || a.assetType).join(', ')}). Exactly {assignedAssets.length} photo upload {assignedAssets.length === 1 ? 'option is' : 'options are'} available.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenUploadForAsset()}
                  className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload First Weekly Photo Documentation ({assignedAssets.length} {assignedAssets.length === 1 ? 'Photo' : 'Photos'})</span>
                </button>
              </>
            )}
          </div>
        ) : displayedRecords.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
            <Camera className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              No weekly audits recorded yet for {activeAssetObj?.assetName || selectedAssetFilter} ({selectedAssetFilter}).
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Upload physical verification photos and Google Drive backup links for this specific asset.
            </p>
            <button
              type="button"
              onClick={() => handleOpenUploadForAsset(selectedAssetFilter)}
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Documentation for this Asset</span>
            </button>
          </div>
        ) : (
          displayedRecords.map(record => (
            <WeeklyPhotoCard
              key={record.id}
              record={record}
              showEmployeeHeader={true}
              filterAssetNumber={selectedAssetFilter}
              onEdit={handleOpenEdit}
              onDelete={deleteWeeklyPhotoRecord}
            />
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <WeeklyPhotoUploadModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          initialEmployeeId={employeeId}
          initialAssetNumber={targetAssetForUpload}
          editingRecord={editingRecord}
        />
      )}
    </div>
  );
};
