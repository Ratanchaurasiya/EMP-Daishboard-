import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const STORAGE_READ_KEY = 'assetcore_read_notifications_v1';
export const STORAGE_DISMISSED_KEY = 'assetcore_dismissed_notifications_v1';

export function useNotificationStats() {
  const { computers, serviceRecords, purchases, assets, auditLogs, assetRequests, currentUser, userRole } = useApp();
  const isEmployee = currentUser?.role === 'employee' || userRole === 'employee';

  const [stats, setStats] = useState({ unreadCount: 0, hasCritical: false, totalCount: 0 });
  const [syncVersion, setSyncVersion] = useState(0);

  // Listen to cross-tab storage changes and custom request events for instant badge updates
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === STORAGE_READ_KEY ||
        e.key === STORAGE_DISMISSED_KEY ||
        e.key === 'assetcore_request_broadcast' ||
        (e.key && e.key.endsWith('_ASSET_REQUESTS'))
      ) {
        setSyncVersion(v => v + 1);
      }
    };

    const handleCustomReq = () => {
      setSyncVersion(v => v + 1);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('assetcore:new_request', handleCustomReq);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('assetcore:new_request', handleCustomReq);
    };
  }, []);

  useEffect(() => {
    try {
      const readSaved = localStorage.getItem(STORAGE_READ_KEY);
      const readIds = readSaved ? new Set(JSON.parse(readSaved)) : new Set<string>();

      const dismissedSaved = localStorage.getItem(STORAGE_DISMISSED_KEY);
      const dismissedIds = dismissedSaved ? new Set(JSON.parse(dismissedSaved)) : new Set<string>();

      let total = 0;
      let unread = 0;
      let hasCrit = false;

      // 0. Equipment & Asset Requests (Requisitions)
      assetRequests.forEach(req => {
        const shouldCount = isEmployee ? (req.employeeId === (currentUser?.id || currentUser?.employeeId)) : true;
        if (!shouldCount) return;

        if (req.status === 'Pending') {
          const id = `req-${req.id}`;
          if (!dismissedIds.has(id)) {
            total++;
            if (req.urgency === 'Critical' || req.urgency === 'High') {
              hasCrit = true;
            }
            if (!readIds.has(id)) unread++;
          }
        }
      });

      // 1. Services
      serviceRecords.forEach(s => {
        if (s.serviceStatus === 'In Progress' || s.serviceStatus === 'Pending Parts') {
          const id = `srv-${s.id}`;
          if (!dismissedIds.has(id)) {
            total++;
            if (!readIds.has(id)) unread++;
          }
        }
      });

      // 2. Computers
      computers.forEach(c => {
        if (c.status === 'Under Service') {
          const id = `comp-srv-${c.id}`;
          if (!dismissedIds.has(id)) {
            total++;
            if (!readIds.has(id)) unread++;
          }
        }
        if (c.condition === 'Damaged') {
          const id = `comp-dmg-${c.id}`;
          if (!dismissedIds.has(id)) {
            total++;
            hasCrit = true;
            if (!readIds.has(id)) unread++;
          }
        }
      });

      // 3. Assets
      assets.forEach(a => {
        if (a.condition === 'Damaged' || a.status === 'Damaged') {
          const id = `asset-dmg-${a.id}`;
          if (!dismissedIds.has(id)) {
            total++;
            hasCrit = true;
            if (!readIds.has(id)) unread++;
          }
        }
      });

      // 4. Purchases missing receipts
      purchases.forEach(p => {
        const hasReceipt = !!p.invoiceFileUrl || (p.invoiceNumber && p.invoiceNumber.trim() !== '');
        if (!hasReceipt) {
          const id = `pur-noreceipt-${p.id}`;
          if (!dismissedIds.has(id)) {
            total++;
            if (!readIds.has(id)) unread++;
          }
        }
      });

      // 5. Buffer Stock
      const availableLaptops = computers.filter(c => c.status === 'Available');
      if (availableLaptops.length > 0) {
        const id = 'fleet-buffer-available';
        if (!dismissedIds.has(id)) {
          total++;
          if (!readIds.has(id)) unread++;
        }
      }

      // 6. Audit Logs
      if (!isEmployee) {
        auditLogs.slice(0, 5).forEach((log, index) => {
          const id = `audit-${log.id || index}-${log.timestamp}`;
          if (!dismissedIds.has(id)) {
            total++;
            if (!readIds.has(id)) unread++;
          }
        });
      }

      setStats({ unreadCount: unread, hasCritical: hasCrit, totalCount: total });
    } catch {
      // Fallback safe default
    }
  }, [computers, serviceRecords, purchases, assets, auditLogs, assetRequests, isEmployee, currentUser, syncVersion]);

  return stats;
}
