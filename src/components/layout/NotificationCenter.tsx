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
import { isActiveAssignedSim } from '../../utils/simUtils';

import { STORAGE_READ_KEY, STORAGE_DISMISSED_KEY } from './useNotificationStats';
import { generateSystemNotifications, NotificationItem } from './notificationUtils';

export type { NotificationItem };

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
    simRecharges,
    assetQueries,
    setActiveTab,
    setSelectedComputerId,
    setSelectedEmployeeId,
    setHighlightedRequestId,
    setSimManagementSubTab,
    setHighlightedSimRequestId,
    setHighlightedServiceId,
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
    return generateSystemNotifications({
      computers,
      serviceRecords,
      purchases,
      assets,
      auditLogs,
      assetRequests,
      simRequests,
      simCards,
      simRecharges,
      assetQueries,
      employees,
      currentUser,
      userRole,
    });
  }, [computers, serviceRecords, purchases, assets, auditLogs, assetRequests, simRequests, simCards, simRecharges, assetQueries, employees, currentUser, userRole]);

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
        } else if (item.tabTarget === 'services' || item.tabTarget === 'maintenance') {
          setHighlightedServiceId(item.targetId);
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

