import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { generateSystemNotifications } from './notificationUtils';

export const STORAGE_READ_KEY = 'assetcore_read_notifications_v1';
export const STORAGE_DISMISSED_KEY = 'assetcore_dismissed_notifications_v1';

export function useNotificationStats() {
  const {
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
  } = useApp();

  const [stats, setStats] = useState({ unreadCount: 0, hasCritical: false, totalCount: 0 });
  const [syncVersion, setSyncVersion] = useState(0);

  // Listen to cross-tab storage changes and custom request events for instant badge updates
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === STORAGE_READ_KEY ||
        e.key === STORAGE_DISMISSED_KEY ||
        e.key === 'assetcore_request_broadcast' ||
        e.key === 'assetcore_sim_request_broadcast' ||
        e.key === 'assetcore_service_broadcast' ||
        e.key === 'assetcore_photo_broadcast' ||
        (e.key && e.key.endsWith('_ASSET_REQUESTS')) ||
        (e.key && e.key.endsWith('_SIM_REQUESTS')) ||
        (e.key && e.key.endsWith('_SERVICES')) ||
        (e.key && e.key.endsWith('_COMPUTERS')) ||
        (e.key && e.key.endsWith('_ASSETS'))
      ) {
        setSyncVersion(v => v + 1);
      }
    };

    const handleCustomReq = () => {
      setSyncVersion(v => v + 1);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('assetcore:new_request', handleCustomReq);
    window.addEventListener('assetcore:new_sim_request', handleCustomReq);
    window.addEventListener('assetcore:new_service_record', handleCustomReq);
    window.addEventListener('assetcore:new_photo_audit', handleCustomReq);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('assetcore:new_request', handleCustomReq);
      window.removeEventListener('assetcore:new_sim_request', handleCustomReq);
      window.removeEventListener('assetcore:new_service_record', handleCustomReq);
      window.removeEventListener('assetcore:new_photo_audit', handleCustomReq);
    };
  }, []);

  useEffect(() => {
    try {
      const readSaved = localStorage.getItem(STORAGE_READ_KEY);
      const readIds = readSaved ? new Set(JSON.parse(readSaved)) : new Set<string>();

      const dismissedSaved = localStorage.getItem(STORAGE_DISMISSED_KEY);
      const dismissedIds = dismissedSaved ? new Set(JSON.parse(dismissedSaved)) : new Set<string>();

      // Generate items using role-scoped logic (Admin sees ALL, Employee sees ONLY their linked notifications)
      const allNotifications = generateSystemNotifications({
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

      const visible = allNotifications.filter(item => !dismissedIds.has(item.id));
      const total = visible.length;
      const unread = visible.filter(item => !readIds.has(item.id)).length;
      const hasCrit = visible.some(item => item.severity === 'critical' && !readIds.has(item.id));

      setStats({ unreadCount: unread, hasCritical: hasCrit, totalCount: total });
    } catch {
      // Fallback safe default
    }
  }, [computers, serviceRecords, purchases, assets, auditLogs, assetRequests, simRequests, simCards, simRecharges, assetQueries, employees, currentUser, userRole, syncVersion]);

  return stats;
}
