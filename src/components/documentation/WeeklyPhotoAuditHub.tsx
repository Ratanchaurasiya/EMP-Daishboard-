import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Camera,
  FolderOpen,
  Plus,
  Search,
  Users,
  Calendar,
  Layers,
  Filter,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { WeeklyPhotoCard } from './WeeklyPhotoCard';
import { WeeklyPhotoUploadModal } from './WeeklyPhotoUploadModal';
import { WeeklyAssetPhotoRecord } from '../../types';

interface WeeklyPhotoAuditHubProps {
  onSelectEmployee?: (employeeId: string) => void;
}

export const WeeklyPhotoAuditHub: React.FC<WeeklyPhotoAuditHubProps> = ({
  onSelectEmployee,
}) => {
  const { weeklyPhotoRecords, employees, deleteWeeklyPhotoRecord, userRole, currentUser } = useApp();
  const isAdmin = userRole === 'admin' && currentUser?.role !== 'employee';

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEmpFilter, setSelectedEmpFilter] = useState<string>(() => {
    if (!isAdmin && currentUser) {
      return currentUser.id || currentUser.employeeId || 'all';
    }
    return 'all';
  });
  const [selectedAssetType, setSelectedAssetType] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<WeeklyAssetPhotoRecord | null>(null);

  // Extract all asset types present in records
  const availableAssetTypes = useMemo<string[]>(() => {
    const types = new Set<string>();
    weeklyPhotoRecords.forEach(r => {
      r.assetPhotos.forEach(p => {
        if (p.assetType) types.add(p.assetType);
      });
    });
    return Array.from(types).sort();
  }, [weeklyPhotoRecords]);

  // Statistics
  const totalAudits = weeklyPhotoRecords.length;
  const totalPhotos = weeklyPhotoRecords.reduce((sum, r) => sum + r.assetPhotos.length, 0);
  const uniqueEmployees = new Set(weeklyPhotoRecords.map(r => r.employeeId)).size;
  const auditsWithDrive = weeklyPhotoRecords.filter(r => !!r.googleDriveLink).length;

  // Filter records
  const filteredRecords = weeklyPhotoRecords.filter(record => {
    // Employee filter
    if (selectedEmpFilter !== 'all') {
      if (record.employeeId !== selectedEmpFilter && record.employeeCode !== selectedEmpFilter) {
        return false;
      }
    }

    // Asset Type filter
    if (selectedAssetType !== 'all') {
      const hasType = record.assetPhotos.some(
        p => p.assetType.toLowerCase() === selectedAssetType.toLowerCase()
      );
      if (!hasType) return false;
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchEmp =
        record.employeeName.toLowerCase().includes(q) ||
        record.employeeCode.toLowerCase().includes(q) ||
        record.weekLabel.toLowerCase().includes(q);

      const matchAsset = record.assetPhotos.some(
        p =>
          p.assetNumber.toLowerCase().includes(q) ||
          p.assetName.toLowerCase().includes(q) ||
          p.assetType.toLowerCase().includes(q)
      );

      if (!matchEmp && !matchAsset) return false;
    }

    return true;
  });

  const handleOpenEdit = (record: WeeklyAssetPhotoRecord) => {
    setEditingRecord(record);
    setIsUploadModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsUploadModalOpen(false);
    setEditingRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-transparent border border-blue-200/60 dark:border-blue-900/40">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-600 text-white shadow-sm">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Weekly Asset Photo Documentation & Audit Hub
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visual condition tracking and Google Drive archive records for company-issued laptops, phones, and peripherals.
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setEditingRecord(null);
              setIsUploadModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Weekly Photo Audit</span>
          </button>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Weekly Audits Conducted
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {totalAudits}
            </span>
            <span className="text-xs text-slate-400">records</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Assets Photographed
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {totalPhotos}
            </span>
            <span className="text-xs text-slate-400">items</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Employees Audited
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {uniqueEmployees}
            </span>
            <span className="text-xs text-slate-400">/ {employees.length} staff</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Google Drive Folders
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {auditsWithDrive}
            </span>
            <span className="text-xs text-slate-400">attached</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search employee, week, or asset tag..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-500 shrink-0">Employee:</label>
            <select
              value={selectedEmpFilter}
              onChange={e => setSelectedEmpFilter(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden w-full sm:w-44"
            >
              <option value="all">All Employees ({employees.length})</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-500 shrink-0">Asset Type:</label>
            <select
              value={selectedAssetType}
              onChange={e => setSelectedAssetType(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden w-full sm:w-36"
            >
              <option value="all">All Assets</option>
              {availableAssetTypes.map((type: string) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {(searchTerm || selectedEmpFilter !== 'all' || selectedAssetType !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedEmpFilter('all');
                setSelectedAssetType('all');
              }}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Audit Records Timeline / Grid */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800">
            <Camera className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              No Weekly Photo Audits Found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              {searchTerm || selectedEmpFilter !== 'all' || selectedAssetType !== 'all'
                ? 'No weekly photo records match your search filters.'
                : 'No weekly photo records have been uploaded yet. Click below to conduct the first weekly audit.'}
            </p>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setEditingRecord(null);
                  setIsUploadModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Upload First Weekly Audit</span>
              </button>
            )}
          </div>
        ) : (
          filteredRecords.map(record => (
            <WeeklyPhotoCard
              key={record.id}
              record={record}
              showEmployeeHeader={true}
              filterAssetNumber={selectedAssetType !== 'all' ? selectedAssetType : undefined}
              onEdit={handleOpenEdit}
              onDelete={deleteWeeklyPhotoRecord}
            />
          ))
        )}
      </div>

      {/* Upload / Edit Modal */}
      {isUploadModalOpen && (
        <WeeklyPhotoUploadModal
          isOpen={isUploadModalOpen}
          onClose={handleCloseModal}
          editingRecord={editingRecord}
        />
      )}
    </div>
  );
};
