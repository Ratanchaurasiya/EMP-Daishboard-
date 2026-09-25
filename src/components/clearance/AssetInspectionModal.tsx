import React, { useState, useEffect } from 'react';
import {
  ExitClearanceAssetItem,
  LiabilityPolicy,
  AssetCondition,
} from '../../types';
import { formatDateDisplay, formatCurrency } from '../../utils/formatters';
import {
  X,
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Shield,
  Eye,
  Trash2,
  HelpCircle,
  IndianRupee,
} from 'lucide-react';

interface AssetInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ExitClearanceAssetItem | null;
  clearanceId: string;
  onSave: (
    clearanceId: string,
    itemId: string,
    updates: Partial<ExitClearanceAssetItem>,
    auditDetail: string
  ) => void;
}

export const AssetInspectionModal: React.FC<AssetInspectionModalProps> = ({
  isOpen,
  onClose,
  item,
  clearanceId,
  onSave,
}) => {
  const [submissionDate, setSubmissionDate] = useState<string>('');
  const [inspectionCondition, setInspectionCondition] = useState<
    'Good' | 'Fair' | 'Minor Wear' | 'Damaged' | 'Missing'
  >('Good');
  const [damageReason, setDamageReason] = useState<string>('');
  const [repairRequired, setRepairRequired] = useState<boolean>(false);
  const [repairCost, setRepairCost] = useState<number>(0);
  const [missingReplacementCost, setMissingReplacementCost] = useState<number>(0);
  const [liabilityPolicy, setLiabilityPolicy] = useState<LiabilityPolicy>('Company Absorbed');
  const [customLiabilityAmount, setCustomLiabilityAmount] = useState<number>(0);
  const [fineWaived, setFineWaived] = useState<boolean>(false);
  const [fineWaiveReason, setFineWaiveReason] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [inspectionPhotos, setInspectionPhotos] = useState<string[]>([]);
  const [inspectionNotes, setInspectionNotes] = useState<string>('');

  useEffect(() => {
    if (item) {
      const todayStr = new Date().toISOString().split('T')[0];
      setSubmissionDate(item.submissionDate || todayStr);
      setInspectionCondition(
        (item.inspectionCondition as any) ||
          (item.returnStatus === 'Damaged'
            ? 'Damaged'
            : item.returnStatus === 'Missing'
            ? 'Missing'
            : 'Good')
      );
      setDamageReason(item.damageReason || '');
      setRepairRequired(item.repairRequired || false);
      setRepairCost(item.repairCost || 0);
      setMissingReplacementCost(item.missingReplacementCost || 0);
      setLiabilityPolicy(item.liabilityPolicy || 'Company Absorbed');
      setCustomLiabilityAmount(item.liabilityAmount || 0);
      setFineWaived(item.fineWaived || false);
      setFineWaiveReason(item.fineWaiveReason || '');
      setReceiptFileName(item.repairReceiptFileName || '');
      setReceiptUrl(item.repairReceiptUrl || '');
      setInspectionPhotos(item.inspectionPhotos || []);
      setInspectionNotes(item.inspectionNotes || '');
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  // Compute late days dynamically
  const calculateLate = () => {
    if (!item.deadlineDate || !submissionDate) return { isLate: false, days: 0, fine: 0 };
    const deadline = new Date(item.deadlineDate);
    deadline.setHours(23, 59, 59, 999);
    const subDate = new Date(submissionDate);
    if (isNaN(deadline.getTime()) || isNaN(subDate.getTime())) return { isLate: false, days: 0, fine: 0 };
    if (subDate <= deadline) return { isLate: false, days: 0, fine: 0 };
    const diff = subDate.getTime() - deadline.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const fine = fineWaived ? 0 : days * (item.lateFinePerDay || 500);
    return { isLate: days > 0, days, fine };
  };

  const lateCalc = calculateLate();

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = event => {
        const base64 = event.target?.result as string;
        if (base64) {
          setInspectionPhotos(prev => [...prev, base64]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle Receipt Upload
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = event => {
      const base64 = event.target?.result as string;
      if (base64) {
        setReceiptUrl(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (index: number) => {
    setInspectionPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Determine final status
    let finalReturnStatus = item.returnStatus;
    if (inspectionCondition === 'Good' || inspectionCondition === 'Fair' || inspectionCondition === 'Minor Wear') {
      finalReturnStatus = 'Verified';
    } else if (inspectionCondition === 'Damaged') {
      finalReturnStatus = 'Damaged';
    } else if (inspectionCondition === 'Missing') {
      finalReturnStatus = 'Missing';
    }

    const updates: Partial<ExitClearanceAssetItem> = {
      submissionDate,
      isLate: lateCalc.isLate,
      lateDays: lateCalc.days,
      lateFineAmount: lateCalc.fine,
      fineWaived,
      fineWaiveReason: fineWaived ? fineWaiveReason : '',
      inspectionCondition: inspectionCondition as any,
      damageReason: inspectionCondition === 'Damaged' ? damageReason : '',
      repairRequired: inspectionCondition === 'Damaged' ? repairRequired : false,
      repairCost: inspectionCondition === 'Damaged' ? repairCost : 0,
      missingReplacementCost: inspectionCondition === 'Missing' ? missingReplacementCost : 0,
      liabilityPolicy,
      repairReceiptFileName: receiptFileName,
      repairReceiptUrl: receiptUrl,
      inspectionPhotos,
      inspectionNotes,
      returnStatus: finalReturnStatus,
      inspectedAt: new Date().toISOString(),
    };

    const auditDetail = `Asset ${item.assetNumber} inspected. Condition: ${inspectionCondition}, Status: ${finalReturnStatus}, Late: ${lateCalc.days}d (Fine: ₹${lateCalc.fine}), Liability Policy: ${liabilityPolicy}.`;

    onSave(clearanceId, item.id, updates, auditDetail);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#101726] rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in my-auto text-xs max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                {item.assetNumber}
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Asset Physical Inspection & Handover
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {item.deviceName} • {item.assetType} {item.serialNumber ? `• SN: ${item.serialNumber}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pt-3.5 pr-1">
          {/* Submission Date & Deadline Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Asset Handover / Submission Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={submissionDate}
                onChange={e => setSubmissionDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Agreed Return Deadline: <strong className="text-slate-700 dark:text-slate-300">{formatDateDisplay(item.deadlineDate)}</strong>
              </span>
            </div>

            {/* Late Fine Preview & Waiver Option */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Late Return Penalty (₹500 / Day)
                </span>
                {lateCalc.isLate ? (
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-amber-700 dark:text-amber-300">
                        {lateCalc.days} Days Late
                      </span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Fine: {lateCalc.days} × ₹500 = <strong className="text-amber-600 dark:text-amber-400">{formatCurrency(lateCalc.days * 500)}</strong>
                      </p>
                    </div>
                    {fineWaived ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        WAIVED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-mono">
                        {formatCurrency(lateCalc.fine)}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Submitted On-Time • No Late Fine</span>
                  </div>
                )}
              </div>

              {lateCalc.isLate && (
                <div className="mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600 dark:text-slate-400 font-medium select-none">
                    <input
                      type="checkbox"
                      checked={fineWaived}
                      onChange={e => setFineWaived(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Waive late return fine</span>
                  </label>
                  {fineWaived && (
                    <input
                      type="text"
                      placeholder="Waiver reason (HR Approval)..."
                      value={fineWaiveReason}
                      onChange={e => setFineWaiveReason(e.target.value)}
                      className="flex-1 px-2 py-1 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 rounded text-[10px] text-slate-900 dark:text-slate-100"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Condition Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block mb-2">
              Physical Asset Condition at Return <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { label: 'Good', value: 'Good', desc: 'Working perfectly', color: 'border-emerald-500 text-emerald-600 bg-emerald-500/10' },
                { label: 'Fair / Normal', value: 'Fair', desc: 'Standard wear', color: 'border-blue-500 text-blue-600 bg-blue-500/10' },
                { label: 'Minor Wear', value: 'Minor Wear', desc: 'Small scuffs', color: 'border-slate-500 text-slate-600 bg-slate-500/10' },
                { label: 'Damaged', value: 'Damaged', desc: 'Broken / Faulty', color: 'border-amber-500 text-amber-600 bg-amber-500/10' },
                { label: 'Missing', value: 'Missing', desc: 'Not returned / Lost', color: 'border-rose-500 text-rose-600 bg-rose-500/10' },
              ].map(opt => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setInspectionCondition(opt.value as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    inspectionCondition === opt.value
                      ? `${opt.color} font-bold shadow-xs ring-1 ring-offset-1`
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 bg-white dark:bg-[#090d16]'
                  }`}
                >
                  <span className="block font-semibold text-xs">{opt.label}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Damaged Section */}
          {inspectionCondition === 'Damaged' && (
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Damage & Repair Assessment</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Damage Reason / Issue Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={damageReason}
                    onChange={e => setDamageReason(e.target.value)}
                    placeholder="e.g. Screen cracked, keyboard water spill, hinge broken"
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Actual / Estimated Repair Cost (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-semibold">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={repairCost || ''}
                      onChange={e => setRepairCost(Number(e.target.value) || 0)}
                      placeholder="0"
                      required
                      className="w-full pl-7 pr-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Company Policy & Liability Responsibility Selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Cost Recovery & Responsibility Policy <span className="text-red-500">*</span>
                </label>
                <select
                  value={liabilityPolicy}
                  onChange={e => setLiabilityPolicy(e.target.value as LiabilityPolicy)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                >
                  <option value="Company Absorbed">
                    Company Absorbed (Normal wear & tear / Company Covers — ₹0 Employee Dues)
                  </option>
                  <option value="Employee Liability">
                    Employee Liability (Chargeable as per company exit policy — Full & Final deduction)
                  </option>
                  <option value="Shared 50-50">
                    Shared 50-50 (50% Company Absorption, 50% Employee Responsibility)
                  </option>
                  <option value="Warranty Covered">
                    Warranty / Vendor Covered (Covered under OEM active warranty — ₹0)
                  </option>
                  <option value="Waived">
                    Management Waiver (Special approval / Ex-gratia waiver — ₹0)
                  </option>
                  <option value="Under Review">
                    Under Review (Pending HR / IT Management Determination)
                  </option>
                </select>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Flexible policy compliance: EASH will not blindly charge employee without admin's recorded policy determination.
                </p>
              </div>

              {/* Upload Service Receipt / Invoice Proof */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Service Repair Receipt / Workshop Estimate (Optional Proof)
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090d16] hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors">
                    <UploadCloud className="w-3.5 h-3.5 text-blue-500" />
                    <span>Upload Receipt / Bill</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleReceiptUpload}
                      className="hidden"
                    />
                  </label>
                  {receiptFileName && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-xs">
                      ✓ {receiptFileName}
                    </span>
                  )}
                  {receiptUrl && (
                    <a
                      href={receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <Eye className="w-3 h-3" /> View
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Missing Section */}
          {inspectionCondition === 'Missing' && (
            <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Missing / Unaccounted Asset Recovery</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Asset Replacement / Recovery Cost (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-semibold">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={missingReplacementCost || ''}
                      onChange={e => setMissingReplacementCost(Number(e.target.value) || 0)}
                      placeholder="0"
                      required
                      className="w-full pl-7 pr-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Recovery Determination <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={liabilityPolicy}
                    onChange={e => setLiabilityPolicy(e.target.value as LiabilityPolicy)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="Employee Liability">
                      Employee Liability (Deductible from Full & Final Settlement)
                    </option>
                    <option value="Company Absorbed">
                      Company Absorbed (Asset Written-Off by Management)
                    </option>
                    <option value="Shared 50-50">Shared 50-50 Split</option>
                    <option value="Waived">Ex-Gratia Waived</option>
                    <option value="Under Review">Pending Police/HR FIR Review</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Photo Evidence Upload */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Inspection Photos & Visual Evidence (Upload Photos)
            </label>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors">
                <Camera className="w-3.5 h-3.5 text-blue-500" />
                <span>Add Evidence Photos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              <span className="text-[10px] text-slate-400">
                ({inspectionPhotos.length} photo{inspectionPhotos.length !== 1 ? 's' : ''} attached)
              </span>
            </div>

            {inspectionPhotos.length > 0 && (
              <div className="flex items-center gap-2.5 overflow-x-auto p-2 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
                {inspectionPhotos.map((photo, idx) => (
                  <div key={idx} className="relative group shrink-0">
                    <img
                      src={photo}
                      alt={`Inspection proof ${idx + 1}`}
                      className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs hover:bg-red-500 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admin Inspection Notes */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Admin Inspection Remarks & Handover Notes
            </label>
            <textarea
              rows={2}
              value={inspectionNotes}
              onChange={e => setInspectionNotes(e.target.value)}
              placeholder="e.g. Device received with original adapter and box. Screen tested OK, no cosmetic faults."
              className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record & Save Inspection</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
