import React, { useState, useEffect } from 'react';
import { X, Send, Smartphone, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SimPurpose, SimRequestType, RequestUrgency, SIM_PURPOSES } from '../../types';
import { generateSimRequestWhatsAppUrl } from '../../utils/simUtils';

interface RequestSimModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: SimRequestType;
  preselectedEmployeeId?: string;
}

export const RequestSimModal: React.FC<RequestSimModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'Additional SIM',
  preselectedEmployeeId,
}) => {
  const { employees, simCards, currentUser, submitSimRequest } = useApp();

  const [selectedEmpId, setSelectedEmpId] = useState<string>(() => {
    if (preselectedEmployeeId) return preselectedEmployeeId;
    if (currentUser?.role === 'employee') return currentUser.employeeId || currentUser.id;
    return employees[0]?.id || employees[0]?.employeeId || '';
  });
  const [requestType, setRequestType] = useState<SimRequestType>(defaultType);
  const [selectedSimId, setSelectedSimId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [project, setProject] = useState('');
  const [purpose, setPurpose] = useState<SimPurpose>('WhatsApp');
  const [customPurpose, setCustomPurpose] = useState('');
  const [urgency, setUrgency] = useState<RequestUrgency>('Normal');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittedWhatsAppUrl, setSubmittedWhatsAppUrl] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedEmployeeId) {
      setSelectedEmpId(preselectedEmployeeId);
    } else if (currentUser?.role === 'employee') {
      setSelectedEmpId(currentUser.employeeId || currentUser.id);
    } else if (employees.length > 0 && !selectedEmpId) {
      setSelectedEmpId(employees[0].id);
    }
  }, [preselectedEmployeeId, currentUser, employees, isOpen]);

  if (!isOpen) return null;

  // Find effective employee record
  const currentEmp = selectedEmpId
    ? employees.find(e => e.id === selectedEmpId || e.employeeId === selectedEmpId) || employees[0]
    : currentUser?.role === 'employee'
    ? employees.find(e => e.id === currentUser.id || e.employeeId === currentUser.employeeId) || employees[0]
    : employees[0];

  const employeeAssignedSims = simCards.filter(
    s => s.assignedEmployeeId === currentEmp?.id || s.assignedEmployeeId === currentEmp?.employeeId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError('Please provide a mandatory justification / business reason for this request.');
      return;
    }

    if (requestType === 'Additional SIM' && !project.trim()) {
      setError('Please specify the Project for which the SIM is required.');
      return;
    }

    if (requestType === 'Additional SIM' && purpose === 'Other' && !customPurpose.trim()) {
      setError('Please specify the exact purpose.');
      return;
    }

    if (requestType === 'Suspend SIM' && !selectedSimId && employeeAssignedSims.length > 0) {
      setError('Please select which SIM you want to request suspension for.');
      return;
    }

    const targetSim = simCards.find(s => s.id === selectedSimId);

    const payload = {
      employeeId: currentEmp?.employeeId || currentEmp?.id || 'EMP001',
      employeeName: currentEmp?.name || currentUser?.name || 'Employee',
      companyEmployeeNumber: currentEmp?.companyEmployeeNumber,
      employeeEmail: currentEmp?.email || currentUser?.email,
      employeePhone: currentEmp?.phone,
      quantity: requestType === 'Additional SIM' ? Math.max(1, quantity) : 1,
      project: requestType === 'Additional SIM' ? project.trim() : (targetSim?.project || project.trim() || 'General Operations'),
      requestType,
      simId: requestType === 'Suspend SIM' ? targetSim?.id : undefined,
      contactNumber: requestType === 'Suspend SIM' ? targetSim?.contactNumber : undefined,
      purpose: requestType === 'Additional SIM' ? purpose : undefined,
      customPurpose: requestType === 'Additional SIM' && purpose === 'Other' ? customPurpose.trim() : undefined,
      urgency,
      reason: reason.trim(),
      remarks: remarks.trim() || undefined,
      targetWhatsAppNumber: '9328594724',
      whatsAppStatus: sendWhatsApp ? ('Sent' as const) : ('Pending' as const),
      status: 'Pending' as const,
    };

    const res = submitSimRequest(payload);
    if (res && !res.success) {
      setError(res.error || 'Failed to submit SIM request.');
      return;
    }

    // Open WhatsApp link targeted to 9328594724
    if (sendWhatsApp && res.requestId) {
      const fullReq = {
        ...payload,
        id: res.requestId,
        createdAt: new Date().toISOString(),
      };
      const waUrl = generateSimRequestWhatsAppUrl(fullReq, '9328594724');
      setSubmittedWhatsAppUrl(waUrl);
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }

    setReason('');
    setCustomPurpose('');
    setRemarks('');
    setProject('');
    setQuantity(1);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {requestType === 'Additional SIM' ? 'Request Additional SIM Card' : 'Request SIM Suspension'}
              </h2>
              <p className="text-xs text-zinc-400">
                Submit telecom requisition to IT Administration with live notification routing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Employee Selector for Admin */}
          {currentUser?.role === 'admin' && !preselectedEmployeeId && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Target Employee <span className="text-orange-500">*</span>
              </label>
              <select
                value={selectedEmpId}
                onChange={e => setSelectedEmpId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeId}) — {emp.department}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Request Type Selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Requisition Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRequestType('Additional SIM')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  requestType === 'Additional SIM'
                    ? 'border-orange-500 bg-orange-500/10 text-orange-400 shadow-sm'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-white'
                }`}
              >
                📱 Additional SIM Requisition
              </button>
              <button
                type="button"
                onClick={() => setRequestType('Suspend SIM')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  requestType === 'Suspend SIM'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-400 shadow-sm'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-white'
                }`}
              >
                ⚠️ Suspend Active SIM
              </button>
            </div>
          </div>

          {requestType === 'Additional SIM' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Required SIM Quantity */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Quantity <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                {/* Intended Purpose */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Purpose <span className="text-orange-500">*</span>
                  </label>
                  <select
                    value={purpose}
                    onChange={e => setPurpose(e.target.value as SimPurpose)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  >
                    {SIM_PURPOSES.map(p => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Urgency */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Urgency Level
                  </label>
                  <select
                    value={urgency}
                    onChange={e => setUrgency(e.target.value as RequestUrgency)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical (Immediate Need)</option>
                  </select>
                </div>
              </div>

              {/* Project for which SIM is required */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Project Name <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABC Project, Lead Generation, Field Ops"
                  value={project}
                  onChange={e => setProject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Target SIM Selector for Suspension */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Select SIM Number to Suspend <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedSimId}
                  onChange={e => setSelectedSimId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                >
                  <option value="">-- Choose Assigned SIM --</option>
                  {(employeeAssignedSims.length > 0 ? employeeAssignedSims : simCards).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.contactNumber} — {s.purpose} {s.project ? `(${s.project})` : ''} [{s.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Project (Optional Reference)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABC Project"
                  value={project}
                  onChange={e => setProject(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          )}

          {/* Custom Purpose If Other */}
          {requestType === 'Additional SIM' && purpose === 'Other' && (
            <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <label className="block text-xs font-medium text-orange-400 mb-1.5">
                Please specify the purpose <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter exact purpose of the SIM card..."
                value={customPurpose}
                onChange={e => setCustomPurpose(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-orange-500/30 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          )}

          {/* Reason / Requirement Details */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Reason / Requirement Details <span className="text-orange-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="Enter why this SIM is needed or why suspension is requested (mandatory)..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors resize-none"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="Any additional notes or instructions..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full px-3.5 py-2 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <label className="flex items-center space-x-2.5 cursor-pointer select-none text-xs text-zinc-300 pt-1">
            <input
              type="checkbox"
              checked={sendWhatsApp}
              onChange={e => setSendWhatsApp(e.target.checked)}
              className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 bg-zinc-950"
            />
            <span className="flex items-center space-x-1.5 text-emerald-400">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send WhatsApp notification link to IT Administrator immediately</span>
            </span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium shadow-lg shadow-orange-600/20 transition-all flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit Requisition</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
