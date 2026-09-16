import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  X,
  CheckCheck,
  Wrench,
  AlertTriangle,
  AlertCircle,
  ShoppingBag,
  FileWarning,
  Laptop,
  CheckCircle2,
  Clock,
  ExternalLink,
  Trash2,
  Filter,
  ShieldAlert,
  Inbox,
  Sparkles,
  Info,
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  category: 'alerts' | 'purchases' | 'maintenance' | 'system';
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  timestamp: string;
  rawDate: number;
  tabTarget?: string;
  targetId?: string;
  actionLabel?: string;
}

import { STORAGE_READ_KEY, STORAGE_DISMISSED_KEY } from './useNotificationStats';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    computers,
    serviceRecords,
    purchases,
    assets,
    employees,
    auditLogs,
    assetRequests,
    simRequests,
    simCards,
    setActiveTab,
    setSelectedComputerId,
    setSelectedEmployeeId,
    setHighlightedRequestId,
    setSimManagementSubTab,
    setHighlightedSimRequestId,
    currentUser,
    userRole,
  } = useApp();

  const isEmployee = currentUser?.role === 'employee' || userRole === 'employee';

  const [activeFilter, setActiveFilter] = useState<'all' | 'alerts' | 'purchases' | 'maintenance' | 'system'>('all');
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_READ_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DISMISSED_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync to local storage
  const persistReadIds = (newSet: Set<string>) => {
    setReadIds(newSet);
    try {
      localStorage.setItem(STORAGE_READ_KEY, JSON.stringify(Array.from(newSet)));
    } catch (e) {
      console.warn('Could not persist read notifications:', e);
    }
  };

  const persistDismissedIds = (newSet: Set<string>) => {
    setDismissedIds(newSet);
    try {
      localStorage.setItem(STORAGE_DISMISSED_KEY, JSON.stringify(Array.from(newSet)));
    } catch (e) {
      console.warn('Could not persist dismissed notifications:', e);
    }
  };

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const timeout = setTimeout(() => {
      window.addEventListener('mousedown', handleClickOutside);
    }, 10);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(timeout);
    };
  }, [isOpen, onClose]);

  // Dynamically compute notification feed based on current system state
  const rawNotifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];
    const now = Date.now();

    // 0. Workforce Equipment Requisitions & Requests
    assetRequests.forEach(req => {
      const shouldShow = isEmployee ? (req.employeeId === (currentUser?.id || currentUser?.employeeId)) : true;
      if (!shouldShow) return;

      const totalItems = req.items.reduce((s, i) => s + (i.quantity || 1), 0);
      const itemsSummary = req.items.map(i => `${i.quantity}x ${i.assetType}`).join(', ');
      const isPending = req.status === 'Pending';
      const severity = req.urgency === 'Critical' ? 'critical' : (req.urgency === 'High' ? 'warning' : 'info');

      // Date parsing
      const reqDateMillis = req.createdAt ? new Date(req.createdAt).getTime() : new Date(req.requestDate).getTime();
      const dateDisplay = req.createdAt
        ? new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : req.requestDate;

      items.push({
        id: `req-${req.id}`,
        category: 'alerts',
        severity: isPending ? severity : 'success',
        title: isPending
          ? `New Request: ${req.employeeName} (${req.department})`
          : `Request ${req.status}: ${req.employeeName}`,
        description: `Requested ${totalItems} item(s): ${itemsSummary}. Urgency: ${req.urgency}. Reason: ${req.reason.substring(0, 75)}${req.reason.length > 75 ? '...' : ''}`,
        timestamp: dateDisplay || 'Recent',
        rawDate: isNaN(reqDateMillis) ? now : reqDateMillis,
        tabTarget: 'requests',
        targetId: req.id,
        actionLabel: isPending ? 'Review Request' : 'View Requisition',
      });
    });

    // 0.5. SIM Requisitions & Suspension Requests
    simRequests.forEach(req => {
      const shouldShow = isEmployee ? (req.employeeId === (currentUser?.id || currentUser?.employeeId)) : true;
      if (!shouldShow) return;

      const isPending = req.status === 'Pending' || req.status === 'In Progress';
      const isSuspension = req.requestType === 'Suspend SIM';
      const isIssue = req.requestType === 'Report Issue';
      const isUrgent = req.urgency === 'Urgent';
      const reqDateMillis = req.createdAt ? new Date(req.createdAt).getTime() : now;
      const dateDisplay = req.createdAt
        ? new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Recent';

      let title = `SIM Request ${req.status}: ${req.employeeName}`;
      let severity: 'critical' | 'warning' | 'info' | 'success' = req.status === 'Approved' || req.status === 'Resolved' ? 'success' : 'info';

      if (isPending) {
        if (isIssue) {
          title = `🔴 SIM Issue (${req.issueType || 'Issue'}): ${req.employeeName}`;
          severity = isUrgent ? 'critical' : 'warning';
        } else if (isSuspension) {
          title = `⚠️ SIM Suspension Requested: ${req.employeeName}`;
          severity = 'warning';
        } else {
          title = `📱 SIM Requisition: ${req.employeeName}`;
          severity = 'info';
        }
      }

      let description = `Requested new SIM for ${req.purpose || 'Calling'}. Purpose/Remarks: ${req.reason}`;
      if (isIssue) {
        description = `SIM: ${req.contactNumber || 'N/A'} | Project: ${req.project || 'General'} | Priority: ${req.urgency || 'Normal'}. Description: ${req.reason}`;
      } else if (isSuspension) {
        description = `Suspension requested for SIM ${req.contactNumber || ''}. Mandatory Reason: ${req.reason}`;
      }

      items.push({
        id: `sim-req-${req.id}`,
        category: 'alerts',
        severity,
        title,
        description,
        timestamp: dateDisplay || 'Recent',
        rawDate: isNaN(reqDateMillis) ? now : reqDateMillis,
        tabTarget: 'sim-management',
        targetId: req.id,
        actionLabel: isPending ? 'Take Action' : 'View SIM Records',
      });
    });

    // 1. Maintenance & Service Tickets
    serviceRecords.forEach(s => {
      if (s.serviceStatus === 'In Progress' || s.serviceStatus === 'Pending Parts') {
        items.push({
          id: `srv-${s.id}`,
          category: 'maintenance',
          severity: s.serviceStatus === 'In Progress' ? 'warning' : 'info',
          title: `Active Service: ${s.deviceName || s.assetNumber}`,
          description: `Ticket ${s.id} (${s.problemCategory || 'Repair'}) is currently ${s.serviceStatus}. Technician: ${s.technician || 'IT Support'}.`,
          timestamp: s.serviceDate || 'Recent',
          rawDate: new Date(s.serviceDate).getTime() || now,
          tabTarget: 'services',
          targetId: s.id,
          actionLabel: 'View Ticket',
        });
      }
    });

    // 2. Computers Under Service
    computers.forEach(c => {
      if (c.status === 'Under Service') {
        items.push({
          id: `comp-srv-${c.id}`,
          category: 'maintenance',
          severity: 'warning',
          title: `Workstation In Maintenance: ${c.assetNumber}`,
          description: `${c.deviceName} (${c.manufacturer} ${c.model}) is currently tagged Under Service.`,
          timestamp: 'Live Status',
          rawDate: now - 3600000,
          tabTarget: 'services',
          targetId: c.id,
          actionLabel: 'Service Details',
        });
      }

      // Damaged/Defective
      if (c.condition === 'Damaged') {
        items.push({
          id: `comp-dmg-${c.id}`,
          category: 'alerts',
          severity: 'critical',
          title: `Damaged Hardware Reported: ${c.assetNumber}`,
          description: `${c.deviceName} is marked as Damaged. Inspection or replacement required immediately.`,
          timestamp: 'Urgent',
          rawDate: now - 1800000,
          tabTarget: 'computers',
          targetId: c.id,
          actionLabel: 'Inspect Workstation',
        });
      }
    });

    // 3. Peripheral Assets Damaged
    assets.forEach(a => {
      if (a.condition === 'Damaged' || a.status === 'Damaged') {
        items.push({
          id: `asset-dmg-${a.id}`,
          category: 'alerts',
          severity: 'critical',
          title: `Damaged Peripheral: ${a.assetType} (${a.assetNumber})`,
          description: `${a.brand} ${a.model} is damaged. Needs replacement or repair disposal.`,
          timestamp: 'Action Needed',
          rawDate: now - 7200000,
          tabTarget: 'assets',
          targetId: a.id,
          actionLabel: 'View Asset',
        });
      }
    });

    // 4. Purchases Without Invoice Receipts
    purchases.forEach(p => {
      const hasReceipt = !!p.invoiceFileUrl || (p.invoiceNumber && p.invoiceNumber.trim() !== '');
      if (!hasReceipt) {
        items.push({
          id: `pur-noreceipt-${p.id}`,
          category: 'purchases',
          severity: 'warning',
          title: `Missing Invoice Receipt: PO #${p.purchaseNumber}`,
          description: `${p.brand} ${p.modelName} purchased for ₹${Number(p.grandTotalCost || 0).toLocaleString('en-IN')} has no bill/receipt uploaded.`,
          timestamp: p.purchaseDate || 'Pending',
          rawDate: new Date(p.purchaseDate).getTime() || now,
          tabTarget: 'purchases',
          targetId: p.id,
          actionLabel: 'Upload Bill',
        });
      }
    });

    // 5. High-Value Buffer Inventory Spares Available
    const availableLaptops = computers.filter(c => c.status === 'Available');
    if (availableLaptops.length > 0) {
      items.push({
        id: 'fleet-buffer-available',
        category: 'system',
        severity: 'info',
        title: `Buffer Stock Ready: ${availableLaptops.length} Available PC/Laptop${availableLaptops.length > 1 ? 's' : ''}`,
        description: `Unassigned workstations in reserve ready for new onboarding or replacement deployment.`,
        timestamp: 'Inventory Reserve',
        rawDate: now - 86400000,
        tabTarget: 'computers',
        actionLabel: 'View Available',
      });
    }

    // 6. Recent System Activity & Audit Logs (Last 5 critical/notable events)
    if (!isEmployee) {
      auditLogs.slice(0, 5).forEach((log, index) => {
        items.push({
          id: `audit-${log.id || index}-${log.timestamp}`,
          category: 'system',
          severity: 'info',
          title: `${log.action}: ${log.actor || 'Admin'}`,
          description: log.details,
          timestamp: log.timestamp ? log.timestamp.substring(11, 16) || log.timestamp : 'Recent',
          rawDate: new Date(log.timestamp).getTime() || (now - (index + 1) * 3600000),
          tabTarget: 'audit',
          actionLabel: 'Audit Hub',
        });
      });
    }

    // Sort by latest/highest priority
    return items.sort((a, b) => {
      // Prioritize critical first
      const severityScore = { critical: 4, warning: 3, info: 2, success: 1 };
      const scoreDiff = severityScore[b.severity] - severityScore[a.severity];
      if (scoreDiff !== 0) return scoreDiff;
      return b.rawDate - a.rawDate;
    });
  }, [computers, serviceRecords, purchases, assets, auditLogs, assetRequests, simRequests, simCards, isEmployee, currentUser]);

  // Filter out dismissed
  const visibleNotifications = useMemo(() => {
    return rawNotifications.filter(item => !dismissedIds.has(item.id));
  }, [rawNotifications, dismissedIds]);

  // Tab filtering
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return visibleNotifications;
    return visibleNotifications.filter(item => item.category === activeFilter);
  }, [visibleNotifications, activeFilter]);

  // Unread count
  const unreadCount = useMemo(() => {
    return visibleNotifications.filter(item => !readIds.has(item.id)).length;
  }, [visibleNotifications, readIds]);

  // Actions
  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = new Set(readIds);
    next.add(id);
    persistReadIds(next);
  };

  const handleDismiss = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = new Set(dismissedIds);
    next.add(id);
    persistDismissedIds(next);
  };

  const handleMarkAllRead = () => {
    const next = new Set(readIds);
    visibleNotifications.forEach(n => next.add(n.id));
    persistReadIds(next);
  };

  const handleClearAll = () => {
    const next = new Set(dismissedIds);
    visibleNotifications.forEach(n => next.add(n.id));
    persistDismissedIds(next);
  };

  const handleItemClick = (item: NotificationItem) => {
    // Mark as read
    handleMarkAsRead(item.id);

    // Navigate to target view
    if (item.tabTarget) {
      setActiveTab(item.tabTarget);
      if (item.targetId) {
        if (item.tabTarget === 'computers') {
          setSelectedComputerId(item.targetId);
        } else if (item.tabTarget === 'employees') {
          setSelectedEmployeeId(item.targetId);
        } else if (item.tabTarget === 'requests') {
          setHighlightedRequestId(item.targetId);
        } else if (item.tabTarget === 'sim-management') {
          setSimManagementSubTab('requests');
          setHighlightedSimRequestId(item.targetId);
        }
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  const counts = {
    all: visibleNotifications.length,
    alerts: visibleNotifications.filter(n => n.category === 'alerts').length,
    purchases: visibleNotifications.filter(n => n.category === 'purchases').length,
    maintenance: visibleNotifications.filter(n => n.category === 'maintenance').length,
    system: visibleNotifications.filter(n => n.category === 'system').length,
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-[390px] sm:w-[460px] max-w-[calc(100vw-24px)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 z-[9999] overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[620px] animate-in fade-in slide-in-from-top-2 duration-200"
      style={{ transformOrigin: 'top right' }}
    >
      {/* Header Bar */}
      <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                Notifications &amp; Alerts
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500 text-white leading-none">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Live hardware telemetry &amp; action center
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-2 py-1 rounded-md text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors flex items-center gap-1 cursor-pointer"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mark read</span>
            </button>
          )}

          {visibleNotifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Clear all notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-[11px]">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All ({counts.all})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('alerts')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
            activeFilter === 'alerts'
              ? 'bg-rose-600 text-white font-bold shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlertCircle className="w-3 h-3" />
          <span>Alerts ({counts.alerts})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('maintenance')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
            activeFilter === 'maintenance'
              ? 'bg-amber-600 text-white font-bold shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Wrench className="w-3 h-3" />
          <span>Repairs ({counts.maintenance})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('purchases')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
            activeFilter === 'purchases'
              ? 'bg-emerald-600 text-white font-bold shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShoppingBag className="w-3 h-3" />
          <span>Purchases ({counts.purchases})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('system')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
            activeFilter === 'system'
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Info className="w-3 h-3" />
          <span>System ({counts.system})</span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1.5 space-y-1">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-white">
              All caught up!
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[240px] mt-1">
              No pending alerts or required actions under this category.
            </p>
          </div>
        ) : (
          filteredNotifications.map(item => {
            const isRead = readIds.has(item.id);

            // Icon & colors based on severity & category
            const getIconConfig = () => {
              if (item.category === 'maintenance') {
                return {
                  icon: Wrench,
                  bgColor: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
                };
              }
              if (item.category === 'purchases') {
                return {
                  icon: FileWarning,
                  bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
                };
              }
              if (item.severity === 'critical') {
                return {
                  icon: AlertTriangle,
                  bgColor: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30',
                };
              }
              return {
                icon: Info,
                bgColor: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
              };
            };

            const config = getIconConfig();
            const IconComponent = config.icon;

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`group relative p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 text-left ${
                  isRead
                    ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-80 hover:opacity-100'
                    : 'bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-blue-200/40 dark:border-blue-900/30'
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border ${config.bgColor}`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {item.title}
                    </span>
                    {!isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.timestamp}
                    </span>
                    {item.actionLabel && (
                      <span className="inline-flex items-center gap-0.5 font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                        <span>{item.actionLabel}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Dismiss Button */}
                <button
                  type="button"
                  onClick={e => handleDismiss(item.id, e)}
                  className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer bar */}
      <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
        <span className="flex items-center gap-1 font-mono text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time fleet events active</span>
        </span>

        <button
          type="button"
          onClick={() => {
            setActiveTab('audit');
            onClose();
          }}
          className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer flex items-center gap-1"
        >
          <span>View Audit History</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

