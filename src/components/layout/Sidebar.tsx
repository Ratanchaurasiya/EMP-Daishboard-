import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Home,
  Users,
  Laptop,
  Headphones,
  Wrench,
  History,
  Shield,
  Box,
  Activity,
  LogOut,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Layers,
  ShieldCheck,
  Camera,
  Sun,
  User,
  ShoppingBag,
  GitBranch,
  HelpCircle,
} from 'lucide-react';
import { EmployeeAvatar } from '../common/EmployeeAvatar';
import { getEmployeeAssignedCompanyAssets } from '../../utils/assetUtils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AdminNavItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: any;
  badge?: string | null;
  badgeColor?: string;
  isWarning?: boolean;
}

interface AdminNavGroup {
  group: string;
  items: AdminNavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    activeTab,
    setActiveTab,
    employees,
    computers,
    assets,
    serviceRecords,
    weeklyPhotoRecords,
    purchases,
    assetRequests,
    assetQueries,
    simCards,
    simRequests,
    serviceProviders,
    userRole,
    currentUser,
    selectedEmployeeId,
    logout,
    setSelectedEmployeeId,
    setSelectedComputerId,
    setGlobalFilters,
    isDbConnected,
    dbStats,
  } = useApp();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const isEmployee = currentUser?.role === 'employee' || userRole === 'employee';

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    if (!isEmployee) {
      setSelectedEmployeeId(null);
      setSelectedComputerId(null);
    }
    setGlobalFilters({ search: '' });
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const loggedEmployee = useMemo(() => {
    if (currentUser?.role === 'employee') {
      return (
        employees.find(
          e =>
            e.id === currentUser.id ||
            e.employeeId === currentUser.employeeId ||
            e.email.toLowerCase() === currentUser.email.toLowerCase()
        ) || null
      );
    }
    // In admin preview/simulation of employee view
    if (selectedEmployeeId) {
      return employees.find(e => e.id === selectedEmployeeId || e.employeeId === selectedEmployeeId) || employees[0] || null;
    }
    return employees[0] || null;
  }, [currentUser, employees, selectedEmployeeId]);
  const loggedComp = loggedEmployee
    ? computers.find(c => c.assignedEmployeeId === loggedEmployee.id || c.assignedEmployeeId === loggedEmployee.employeeId)
    : null;

  const myAssignedAssets = loggedEmployee
    ? getEmployeeAssignedCompanyAssets(loggedEmployee, loggedComp, assets)
    : [];

  const myAssignedAssetsCount = myAssignedAssets.length;

  const myServicesCount = currentUser
    ? serviceRecords.filter(
        s =>
          (loggedComp && (s.computerId === loggedComp.id || (loggedComp.assetNumber && s.assetNumber && loggedComp.assetNumber.trim().toLowerCase() === s.assetNumber.trim().toLowerCase()))) ||
          s.employeeId === currentUser.id ||
          s.employeeId === currentUser.employeeId ||
          myAssignedAssets.some(
            a => a.assetNumber && s.assetNumber && a.assetNumber.trim().toLowerCase() === s.assetNumber.trim().toLowerCase()
          )
      ).length
    : 0;

  const compAssetNumbers = new Set(computers.map(c => c.assetNumber.trim().toLowerCase()));
  const nonComputerAssets = assets.filter(
    a => a.assetType !== 'Laptop' && !compAssetNumbers.has(a.assetNumber.trim().toLowerCase())
  );
  const underServiceCount = computers.filter(c => c.status === 'Under Service').length;
  const phoneCount = nonComputerAssets.filter(a => a.assetType === 'Mobile Phone').length;
  const peripheralCount = nonComputerAssets.filter(a => a.assetType !== 'Mobile Phone').length;

  const highIncidentCount = computers.filter(c => {
    const compServices = serviceRecords.filter(s => s.computerId === c.id);
    const totalCost = compServices.reduce((sum, s) => sum + (s.serviceCost || 0), 0);
    return compServices.length >= 4 || totalCost >= 5000 || c.condition === 'Damaged';
  }).length;

  const pendingRequestsCount = assetRequests.filter(r => r.status === 'Pending').length;
  const pendingSimRequestsCount = simRequests.filter(r => r.status === 'Pending' || r.status === 'In Progress').length;
  const totalActionableRequestsCount = pendingRequestsCount + pendingSimRequestsCount;
  const myRequestsCount = loggedEmployee
    ? assetRequests.filter(
        r =>
          r.employeeId === loggedEmployee.employeeId ||
          r.employeeId === loggedEmployee.id ||
          (r.employeeEmail && r.employeeEmail.toLowerCase() === loggedEmployee.email.toLowerCase())
      ).length
    : 0;

  // Grouped Navigation for Admin
  const adminNavGroups: AdminNavGroup[] = [
    {
      group: 'Intelligence',
      items: [
        {
          id: 'dashboard',
          label: 'Executive Command',
          shortLabel: 'Command',
          icon: Home,
          badge: 'Live',
          badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        },
        {
          id: 'lifecycle',
          label: 'Employee Access & Asset Analytics',
          shortLabel: 'Access Analytics',
          icon: ShieldCheck,
          badge: `${employees.length} Staff`,
          badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        },
      ],
    },
    {
      group: 'Hardware Fleet',
      items: [
        {
          id: 'hardware-dashboard',
          label: 'Hardware & Asset Hub',
          shortLabel: 'Hub',
          icon: Layers,
          badge: `${computers.length + nonComputerAssets.length}`,
          badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        },
        {
          id: 'computers',
          label: 'Laptops & Computers',
          shortLabel: 'Laptops',
          icon: Laptop,
          badge: `${computers.length}`,
        },
        {
          id: 'phones',
          label: 'Mobile Phones',
          shortLabel: 'Phones',
          icon: Smartphone,
          badge: `${phoneCount}`,
        },
        {
          id: 'sim-management',
          label: 'SIM & Mobile Fleet',
          shortLabel: 'SIM Fleet',
          icon: Smartphone,
          badge: pendingSimRequestsCount > 0 ? `${pendingSimRequestsCount} Pending` : (simCards.length > 0 ? `${simCards.length}` : null),
          badgeColor: pendingSimRequestsCount > 0 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          isWarning: pendingSimRequestsCount > 0,
        },
        {
          id: 'assets',
          label: 'Peripherals & Gear',
          shortLabel: 'Assets',
          icon: Headphones,
          badge: `${peripheralCount}`,
        },
        {
          id: 'purchases',
          label: 'Purchases & Procurement',
          shortLabel: 'Purchases',
          icon: ShoppingBag,
          badge: purchases.length > 0 ? `${purchases.length}` : null,
          badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        },
      ],
    },
    {
      group: 'Workforce & Operations',
      items: [
        {
          id: 'employees',
          label: 'Personnel Directory',
          shortLabel: 'Staff',
          icon: Users,
          badge: `${employees.length}`,
        },
        {
          id: 'requests',
          label: 'Equipment Requests',
          shortLabel: 'Requests',
          icon: Layers,
          badge: pendingRequestsCount > 0 ? `${pendingRequestsCount} Pending` : (assetRequests.length > 0 ? `${assetRequests.length}` : null),
          badgeColor: pendingRequestsCount > 0 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' : undefined,
          isWarning: pendingRequestsCount > 0,
        },
        {
          id: 'asset-queries',
          label: 'Staff Asset Queries',
          shortLabel: 'Queries',
          icon: HelpCircle,
          badge: (assetQueries?.filter(q => q.status === 'Pending Acknowledgement').length || 0) > 0
            ? `${assetQueries.filter(q => q.status === 'Pending Acknowledgement').length} Ack Needed`
            : (assetQueries && assetQueries.length > 0 ? `${assetQueries.length}` : null),
          badgeColor: (assetQueries?.filter(q => q.status === 'Pending Acknowledgement').length || 0) > 0
            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold'
            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          isWarning: (assetQueries?.filter(q => q.status === 'Pending Acknowledgement').length || 0) > 0,
        },
        {
          id: 'services',
          label: 'Service & Repairs',
          shortLabel: 'Services',
          icon: Wrench,
          badge: underServiceCount > 0 ? `${underServiceCount} Active` : `${serviceRecords.length}`,
          isWarning: underServiceCount > 0,
        },
        {
          id: 'system-support',
          label: 'System / PC Support',
          shortLabel: 'PC Support',
          icon: Wrench,
          badge: serviceProviders.length > 0 ? `${serviceProviders.length} Vendors` : null,
          badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
        },
        {
          id: 'weekly-photos',
          label: 'Weekly Photo Audits',
          shortLabel: 'Photos',
          icon: Camera,
          badge: weeklyPhotoRecords.length > 0 ? `${weeklyPhotoRecords.length}` : null,
          badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        },
        {
          id: 'audit',
          label: 'Audit Timeline',
          shortLabel: 'Audit',
          icon: History,
          badge: null,
        },
      ],
    },
  ];

  const mySimCardsCount = loggedEmployee
    ? simCards.filter(
        s =>
          s.assignedEmployeeId === loggedEmployee.id ||
          s.assignedEmployeeId === loggedEmployee.employeeId ||
          (s.assignedEmployeeName && s.assignedEmployeeName.toLowerCase() === loggedEmployee.name.toLowerCase())
      ).length
    : 0;

  const employeeNavItems = [
    {
      id: 'dashboard',
      label: 'My Workstation Portal',
      icon: Home,
      badge: 'Personal',
      isSpecial: true,
    },
    {
      id: 'activity',
      label: 'My Activity & Status',
      icon: Activity,
      badge: 'Status',
    },
    {
      id: 'requests',
      label: 'My Equipment Requests',
      icon: Layers,
      badge: myRequestsCount > 0 ? `${myRequestsCount}` : null,
    },
    {
      id: 'workstation',
      label: 'My Hardware Specs',
      icon: Laptop,
      badge: 'PC',
    },
    {
      id: 'assets',
      label: 'My Assigned Devices',
      icon: Headphones,
      badge: myAssignedAssetsCount > 0 ? `${myAssignedAssetsCount}` : null,
    },
    {
      id: 'sim-management',
      label: 'My SIM Cards & Recharges',
      icon: Smartphone,
      badge: mySimCardsCount > 0 ? `${mySimCardsCount}` : null,
    },
    {
      id: 'services',
      label: 'My Service Requests',
      icon: Wrench,
      badge: myServicesCount > 0 ? `${myServicesCount}` : null,
    },
    {
      id: 'weekly-photos',
      label: 'My Weekly Photo Audits',
      icon: Camera,
      badge: weeklyPhotoRecords.length > 0 ? `${weeklyPhotoRecords.length}` : null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white dark:bg-[#0b101b] border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col transition-all duration-200 ease-in-out lg:translate-x-0 lg:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'} w-64`}
      >
        {/* Brand Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-2.5 text-left group cursor-pointer min-w-0 focus:outline-hidden"
            title="AssetCore Enterprise"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-orange-500/25 group-hover:scale-105 transition-transform shrink-0">
              <Box className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div className="truncate min-w-0">
                <h1 className="font-bold text-xs text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-1.5">
                  <span>AssetCore</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                    PRO
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-medium">
                  IT Asset Management
                </p>
              </div>
            )}
          </button>

          {/* Desktop Rail Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Session Chip */}
        <div className={`px-3 py-2 border-b border-slate-200/70 dark:border-slate-800/80 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#111726] border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              {currentUser?.role === 'employee' ? (
                <EmployeeAvatar
                  name={currentUser.name}
                  photoUrl={currentUser.photoUrl}
                  size="xs"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
              {!isCollapsed && (
                <div className="truncate min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                    {currentUser?.name || (userRole === 'admin' ? 'IT Administrator' : 'Employee')}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">
                    {currentUser?.role === 'admin' ? 'Enterprise • Admin' : currentUser?.employeeId}
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          </div>
        </div>

        {/* Grouped Navigation List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {isEmployee ? (
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  My Portal
                </div>
              )}
              {employeeNavItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || (item.id === 'dashboard' && (!activeTab || activeTab === 'dashboard'));
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'justify-between px-2.5 py-2'} rounded-xl text-left transition-all text-xs group cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-medium'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-400 dark:text-slate-500 group-hover:text-emerald-500'
                        }`}
                      />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>
                    {!isCollapsed && item.badge && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                          isActive
                            ? 'bg-emerald-700/50 text-emerald-200'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            adminNavGroups.map(group => (
              <div key={group.group} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {group.group}
                  </div>
                )}
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'justify-between px-2.5 py-2'} rounded-xl text-left transition-all text-xs group cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-lg shadow-orange-500/25'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-medium'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-white'
                              : 'text-slate-400 dark:text-slate-500 group-hover:text-orange-400'
                          }`}
                        />
                        {!isCollapsed && <span>{item.label}</span>}
                      </div>

                      {!isCollapsed && item.badge && (
                        <span
                          className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                            isActive
                              ? 'bg-amber-400/25 text-amber-100 border border-amber-400/40'
                              : 'bg-amber-500/15 text-amber-500 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Weather Telemetry Box in Footer (matches user photo) */}
        {!isCollapsed && (
          <div className="px-3 pb-3">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/80 dark:bg-[#111726] border border-slate-200/60 dark:border-slate-800 shadow-2xs">
              <Sun className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  34°C
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">
                  Partly sunny
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logout Action Button in Sidebar Footer */}
        <div className="px-3 py-2 border-t border-slate-200/70 dark:border-slate-800/80">
          <button
            type="button"
            onClick={logout}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-start gap-2.5 px-3 py-2'} rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer`}
            title="Sign Out of Session"
          >
            <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Database Live Telemetry Box in Footer */}
        {!isCollapsed && (
          <div className="p-3 border-t border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 text-[10px] text-slate-500 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <span className={`w-1.5 h-1.5 rounded-full ${isDbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>IndexedDB v1</span>
              </div>
              <span className="font-mono text-[9px] text-slate-400">{dbStats?.totalRecords ?? 0} records</span>
            </div>
            <p className="leading-tight text-slate-400 dark:text-slate-500 text-[9px]">
              Offline-ready local database with zero external tracking.
            </p>
          </div>
        )}
      </aside>
    </>
  );
};
