import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Shield,
  User,
  Sun,
  Moon,
  Download,
  RotateCcw,
  Menu,
  X,
  Plus,
  AlertCircle,
  LogOut,
  Laptop,
  Smartphone,
  Headphones,
  Wrench,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Database,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Bell,
  Box,
  Key,
  KeyRound,
} from 'lucide-react';
import { EmployeeAvatar } from '../common/EmployeeAvatar';
import { formatCurrency } from '../../utils/formatters';
import { Employee, Computer, CompanyAsset, ServiceRecord } from '../../types';
import { NotificationCenter } from './NotificationCenter';
import { useNotificationStats } from './useNotificationStats';
import { AdminPasswordResetModal } from '../auth/AdminPasswordResetModal';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';

interface HeaderProps {
  onOpenAddEmployee: () => void;
  onOpenAddService: () => void;
  onOpenAddComputer: () => void;
  onOpenAddToBuffer?: () => void;
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddEmployee,
  onOpenAddService,
  onOpenAddComputer,
  onOpenAddToBuffer,
  toggleSidebar,
}) => {
  const {
    userRole,
    setUserRole,
    globalFilters,
    setGlobalFilters,
    theme,
    toggleTheme,
    resetToDemoData,
    clearAllData,
    removeAllEmployees,
    employees,
    computers,
    assets,
    serviceRecords,
    setActiveTab,
    setSelectedEmployeeId,
    setSelectedComputerId,
    currentUser,
    logout,
    isDbConnected,
    dbStats,
    refreshDbStats,
    downloadBackup,
    restoreBackup,
    exportFleetCSV,
  } = useApp();

  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDbOpen, setIsDbOpen] = useState(false);
  const [isDbRendered, setIsDbRendered] = useState(false);
  const [isRefreshingDb, setIsRefreshingDb] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isChangePassModalOpen, setIsChangePassModalOpen] = useState(false);

  const { unreadCount, hasCritical } = useNotificationStats();

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dbContainerRef = useRef<HTMLDivElement>(null);
  const quickMenuRef = useRef<HTMLDivElement>(null);
  const notificationBellRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const isEmployeeRole = currentUser?.role === 'employee' || userRole === 'employee';
  const currentEmpId = currentUser?.id || currentUser?.employeeId;

  const openDbSection = () => {
    setIsDbRendered(true);
    refreshDbStats();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsDbOpen(true);
      });
    });
  };

  const closeDbSection = () => {
    setIsDbOpen(false);
    setTimeout(() => {
      setIsDbRendered(false);
    }, 200);
  };

  const handleToggleDbSection = () => {
    if (isDbOpen) {
      closeDbSection();
    } else {
      openDbSection();
    }
  };

  const handleManualRefreshDb = async () => {
    setIsRefreshingDb(true);
    try {
      await refreshDbStats();
    } finally {
      setTimeout(() => setIsRefreshingDb(false), 400);
    }
  };

  // Global hotkey: Pressing "/" or "Cmd+K / Ctrl+K" focuses search palette, "Escape" closes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInputFocused =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select' ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if ((e.key === '/' && !isInputFocused) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        closeDbSection();
        setShowQuickMenu(false);
        setIsProfileMenuOpen(false);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDbOpen]);

  // Click outside to dismiss search results, database section, quick menu, and profile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target)
      ) {
        setIsSearchOpen(false);
      }
      if (
        dbContainerRef.current &&
        !dbContainerRef.current.contains(target)
      ) {
        closeDbSection();
      }
      if (
        quickMenuRef.current &&
        !quickMenuRef.current.contains(target)
      ) {
        setShowQuickMenu(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Multi-entity search calculation
  const searchQuery = (globalFilters.search || '').trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!searchQuery) return null;

    // 1. Employees
    const scopedEmployees = isEmployeeRole
      ? employees.filter(e => e.id === currentEmpId || e.employeeId === currentEmpId)
      : employees;

    const matchedEmployees = scopedEmployees.filter(e => {
      return (
        e.name.toLowerCase().includes(searchQuery) ||
        e.employeeId.toLowerCase().includes(searchQuery) ||
        (e.companyEmployeeNumber && e.companyEmployeeNumber.toLowerCase().includes(searchQuery)) ||
        e.department.toLowerCase().includes(searchQuery) ||
        (e.designation && e.designation.toLowerCase().includes(searchQuery)) ||
        e.email.toLowerCase().includes(searchQuery) ||
        (e.phone && e.phone.toLowerCase().includes(searchQuery))
      );
    });

    // 2. Computers / Workstations
    const scopedComputers = isEmployeeRole
      ? computers.filter(c => c.assignedEmployeeId === currentEmpId)
      : computers;

    const matchedComputers = scopedComputers.filter(c => {
      const assignedEmp = employees.find(e => e.id === c.assignedEmployeeId);
      return (
        c.assetNumber.toLowerCase().includes(searchQuery) ||
        c.deviceName.toLowerCase().includes(searchQuery) ||
        c.manufacturer.toLowerCase().includes(searchQuery) ||
        c.model.toLowerCase().includes(searchQuery) ||
        (c.serialNumber && c.serialNumber.toLowerCase().includes(searchQuery)) ||
        (c.system?.deviceId && c.system.deviceId.toLowerCase().includes(searchQuery)) ||
        (assignedEmp && assignedEmp.name.toLowerCase().includes(searchQuery))
      );
    });

    // 3. Mobile Phones
    const phoneAssets = assets.filter(a => a.assetType === 'Mobile Phone');
    const scopedPhones = isEmployeeRole
      ? phoneAssets.filter(p => p.assignedEmployeeId === currentEmpId)
      : phoneAssets;

    const matchedPhones = scopedPhones.filter(p => {
      const assignedEmp = employees.find(
        e => e.id === p.assignedEmployeeId || e.employeeId === p.assignedEmployeeId
      );
      return (
        p.assetNumber.toLowerCase().includes(searchQuery) ||
        p.brand.toLowerCase().includes(searchQuery) ||
        p.model.toLowerCase().includes(searchQuery) ||
        (p.imeiNumber && p.imeiNumber.toLowerCase().includes(searchQuery)) ||
        (p.phoneNumber && p.phoneNumber.toLowerCase().includes(searchQuery)) ||
        (p.serialNumber && p.serialNumber.toLowerCase().includes(searchQuery)) ||
        (p.deviceName && p.deviceName.toLowerCase().includes(searchQuery)) ||
        (assignedEmp && assignedEmp.name.toLowerCase().includes(searchQuery))
      );
    });

    // 4. Peripherals & Other Assets
    const nonPhoneAssets = assets.filter(a => a.assetType !== 'Mobile Phone');
    const scopedAssets = isEmployeeRole
      ? nonPhoneAssets.filter(a => a.assignedEmployeeId === currentEmpId)
      : nonPhoneAssets;

    const matchedAssets = scopedAssets.filter(a => {
      const assignedEmp = employees.find(e => e.id === a.assignedEmployeeId);
      return (
        a.assetNumber.toLowerCase().includes(searchQuery) ||
        a.assetType.toLowerCase().includes(searchQuery) ||
        a.brand.toLowerCase().includes(searchQuery) ||
        a.model.toLowerCase().includes(searchQuery) ||
        (a.serialNumber && a.serialNumber.toLowerCase().includes(searchQuery)) ||
        (assignedEmp && assignedEmp.name.toLowerCase().includes(searchQuery))
      );
    });

    // 5. Service Tickets
    const scopedServices = isEmployeeRole
      ? serviceRecords.filter(s => {
          const empIdMatch =
            (s.employeeId && currentEmpId && s.employeeId.trim().toLowerCase() === currentEmpId.trim().toLowerCase()) ||
            (s.employeeId && currentUser?.employeeId && s.employeeId.trim().toLowerCase() === currentUser.employeeId.trim().toLowerCase());
          const empNameMatch =
            s.employeeName && currentUser?.name && s.employeeName.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
          const compMatch = scopedComputers.some(
            c => c.id === s.computerId || (c.assetNumber && s.assetNumber && c.assetNumber.trim().toLowerCase() === s.assetNumber.trim().toLowerCase())
          );
          const phoneMatch = scopedPhones.some(
            p => p.assetNumber && s.assetNumber && p.assetNumber.trim().toLowerCase() === s.assetNumber.trim().toLowerCase()
          );
          const assetMatch = scopedAssets.some(
            a => a.assetNumber && s.assetNumber && a.assetNumber.trim().toLowerCase() === s.assetNumber.trim().toLowerCase()
          );
          return empIdMatch || empNameMatch || compMatch || phoneMatch || assetMatch;
        })
      : serviceRecords;

    const matchedServices = scopedServices.filter(s => {
      return (
        s.id.toLowerCase().includes(searchQuery) ||
        s.assetNumber.toLowerCase().includes(searchQuery) ||
        s.problem.toLowerCase().includes(searchQuery) ||
        s.problemCategory.toLowerCase().includes(searchQuery) ||
        s.deviceName.toLowerCase().includes(searchQuery) ||
        (s.employeeName && s.employeeName.toLowerCase().includes(searchQuery)) ||
        (s.technician && s.technician.toLowerCase().includes(searchQuery))
      );
    });

    const totalCount =
      matchedEmployees.length +
      matchedComputers.length +
      matchedPhones.length +
      matchedAssets.length +
      matchedServices.length;

    return {
      employees: matchedEmployees,
      computers: matchedComputers,
      phones: matchedPhones,
      assets: matchedAssets,
      services: matchedServices,
      totalCount,
    };
  }, [searchQuery, isEmployeeRole, currentEmpId, employees, computers, assets, serviceRecords, currentUser]);

  // Click handlers
  const handleSelectEmployeeHit = (emp: Employee) => {
    setSelectedEmployeeId(emp.id);
    setIsSearchOpen(false);
  };

  const handleSelectComputerHit = (comp: Computer) => {
    setSelectedComputerId(comp.id);
    setIsSearchOpen(false);
  };

  const handleSelectPhoneHit = (phone: CompanyAsset) => {
    setActiveTab('phones');
    setGlobalFilters({ search: phone.assetNumber });
    setIsSearchOpen(false);
  };

  const handleSelectAssetHit = (asset: CompanyAsset) => {
    setActiveTab('assets');
    setGlobalFilters({ search: asset.assetNumber });
    setIsSearchOpen(false);
  };

  const handleSelectServiceHit = (srv: ServiceRecord) => {
    setActiveTab('services');
    setGlobalFilters({ search: srv.id });
    setIsSearchOpen(false);
  };

  const handleJumpToTab = (tab: string) => {
    setActiveTab(tab);
    setIsSearchOpen(false);
  };

  const handleFileRestoreChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsRestoring(true);
    await restoreBackup(file);
    setIsRestoring(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    closeDbSection();
  };

  // Pre-populated Quick Command Actions when user opens palette without typing
  const quickActions = [
    ...(userRole === 'admin'
      ? [
          {
            label: 'Enroll New Employee',
            icon: '👤',
            desc: 'Create employee & allocate hardware bundle',
            action: () => {
              setIsSearchOpen(false);
              onOpenAddEmployee();
            },
          },
          {
            label: 'Register Computer Unit',
            icon: '💻',
            desc: 'Add Laptop/Desktop with system specs',
            action: () => {
              setIsSearchOpen(false);
              onOpenAddComputer();
            },
          },
          {
            label: 'Log Service Ticket',
            icon: '🛠️',
            desc: 'Create maintenance request or repair log',
            action: () => {
              setIsSearchOpen(false);
              onOpenAddService();
            },
          },
          {
            label: 'Export Fleet Audit (CSV)',
            icon: '📊',
            desc: 'Download consolidated fleet spreadsheet',
            action: () => {
              setIsSearchOpen(false);
              exportFleetCSV();
            },
          },
          {
            label: 'Download Database Backup (JSON)',
            icon: '💾',
            desc: 'Save timestamped IndexedDB snapshot',
            action: () => {
              setIsSearchOpen(false);
              downloadBackup();
            },
          },
        ]
      : []),
    {
      label: 'Switch to Hardware Health',
      icon: '⚡',
      desc: 'View fleet reliability & diagnostic index',
      action: () => handleJumpToTab('lifecycle'),
    },
    {
      label: 'Toggle Theme',
      icon: theme === 'light' ? '🌙' : '☀️',
      desc: `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`,
      action: () => {
        toggleTheme();
        setIsSearchOpen(false);
      },
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/85 dark:bg-[#080c14]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-7 py-2 sm:py-2.5 gap-2 sm:gap-4">
        {/* Left: Mobile Toggle & Context Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 cursor-pointer"
            title="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs dark:bg-gradient-to-br dark:from-orange-500 dark:to-amber-500">
              <Box className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-orange-500 uppercase tracking-wider flex items-center gap-1.5">
              ASSETCORE
            </span>
            <span className="text-slate-300 dark:text-slate-700 font-light">/</span>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {currentUser?.role === 'employee' ? 'Employee Workstation Portal' : 'Enterprise Fleet Command'}
            </span>
          </div>
        </div>

        {/* Center: Sleek Command Palette & Global Search */}
        <div ref={searchContainerRef} className="flex-1 max-w-lg mx-auto min-w-[140px] relative">
          <div className="relative group">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-blue-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={globalFilters.search}
              onFocus={() => setIsSearchOpen(true)}
              onChange={e => {
                setGlobalFilters({ search: e.target.value });
                setIsSearchOpen(true);
              }}
              placeholder={
                currentUser?.role === 'employee'
                  ? 'Search specs, tickets, assets... (⌘K)'
                  : 'Command Palette: Search personnel, PC, asset, IMEI... (⌘K)'
              }
              className="w-full pl-8 sm:pl-9 pr-14 sm:pr-20 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/90 border border-slate-300/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all font-sans shadow-2xs"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {globalFilters.search ? (
                <button
                  type="button"
                  onClick={() => {
                    setGlobalFilters({ search: '' });
                    setIsSearchOpen(false);
                    searchInputRef.current?.focus();
                  }}
                  className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="hidden sm:flex items-center gap-0.5">
                  <kbd className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300/50 dark:border-slate-700/50">
                    ⌘K
                  </kbd>
                  <kbd className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300/50 dark:border-slate-700/50">
                    /
                  </kbd>
                </div>
              )}
            </div>
          </div>

          {/* Quick Search & Command Palette Dropdown */}
          {isSearchOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 top-full mt-2 w-[calc(100vw-24px)] sm:w-[560px] max-h-[500px] overflow-y-auto bg-white dark:bg-[#0c1220] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 p-2.5 divide-y divide-slate-100 dark:divide-slate-800/80 animate-fade-in">
              {/* Header Status Bar */}
              <div className="px-2 py-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>
                    {searchResults ? (
                      <>
                        Found <strong className="text-slate-900 dark:text-white font-mono">{searchResults.totalCount}</strong> matching result{searchResults.totalCount === 1 ? '' : 's'}
                      </>
                    ) : (
                      <span>Enterprise Command Center</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">ESC to exit</span>
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* If no search query, show Quick Command Actions */}
              {!searchResults && (
                <div className="py-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Quick Commands & Workflows
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {quickActions.map(action => (
                      <button
                        key={action.label}
                        onClick={action.action}
                        className="text-left p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/60 transition-all flex items-start gap-2.5 cursor-pointer group"
                      >
                        <span className="text-base shrink-0 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform">
                          {action.icon}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-500 transition-colors">
                            {action.label}
                          </div>
                          <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                            {action.desc}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state when query matches 0 records */}
              {searchResults && searchResults.totalCount === 0 && (
                <div className="p-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/60 text-slate-400 mx-auto flex items-center justify-center mb-2">
                    <Search className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    No results found for &ldquo;{globalFilters.search}&rdquo;
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    Try searching by Employee name, ID (e.g. EMP001), PC tag (e.g. LAP-001), Phone IMEI, or service category.
                  </p>
                </div>
              )}

              {/* Group 1: Employees */}
              {searchResults && searchResults.employees.length > 0 && (
                <div className="py-2">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center justify-between">
                    <span>Personnel ({searchResults.employees.length})</span>
                    <button
                      onClick={() => handleJumpToTab('employees')}
                      className="hover:underline text-[10px] flex items-center gap-0.5 text-slate-400 hover:text-blue-500 cursor-pointer"
                    >
                      View in Directory <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {searchResults.employees.slice(0, 4).map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => handleSelectEmployeeHit(emp)}
                        className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <EmployeeAvatar
                            name={emp.name}
                            photoUrl={emp.photoUrl}
                            size="sm"
                            status={emp.status}
                            showStatusDot={true}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-500 transition-colors truncate">
                              {emp.name}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                              {emp.employeeId} {emp.companyEmployeeNumber ? `• ${emp.companyEmployeeNumber}` : ''} • {emp.department} • {emp.designation}
                            </div>
                          </div>
                        </div>
                        <span className={`shrink-0 ml-2 px-1.5 py-0.5 text-[9px] font-semibold rounded ${
                          emp.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          {emp.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Group 2: Computers */}
              {searchResults && searchResults.computers.length > 0 && (
                <div className="py-2">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center justify-between">
                    <span>Workstations & Computers ({searchResults.computers.length})</span>
                    <button
                      onClick={() => handleJumpToTab('computers')}
                      className="hover:underline text-[10px] flex items-center gap-0.5 text-slate-400 hover:text-purple-500 cursor-pointer"
                    >
                      View in Computers <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {searchResults.computers.slice(0, 4).map(comp => {
                      const assignedEmp = employees.find(e => e.id === comp.assignedEmployeeId);
                      return (
                        <button
                          key={comp.id}
                          onClick={() => handleSelectComputerHit(comp)}
                          className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                              <Laptop className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-purple-500 transition-colors truncate">
                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 mr-1.5">
                                  {comp.assetNumber}
                                </span>
                                {comp.deviceName}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {comp.manufacturer} {comp.model} {assignedEmp ? `• ${assignedEmp.name}` : '• Unassigned'}
                              </div>
                            </div>
                          </div>
                          <span className="shrink-0 ml-2 px-1.5 py-0.5 text-[9px] font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {comp.status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Group 3: Mobile Phones */}
              {searchResults && searchResults.phones.length > 0 && (
                <div className="py-2">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                    <span>Mobile Phones ({searchResults.phones.length})</span>
                    <button
                      onClick={() => handleJumpToTab('phones')}
                      className="hover:underline text-[10px] flex items-center gap-0.5 text-slate-400 hover:text-emerald-500 cursor-pointer"
                    >
                      View in Phones <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {searchResults.phones.slice(0, 4).map(phone => {
                      const assignedEmp = employees.find(
                        e => e.id === phone.assignedEmployeeId || e.employeeId === phone.assignedEmployeeId
                      );
                      return (
                        <button
                          key={phone.id}
                          onClick={() => handleSelectPhoneHit(phone)}
                          className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <Smartphone className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-500 transition-colors truncate">
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mr-1.5">
                                  {phone.assetNumber}
                                </span>
                                {phone.brand} {phone.model}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                                {phone.imeiNumber ? `IMEI: ${phone.imeiNumber}` : ''}
                                {phone.phoneNumber ? ` • SIM: ${phone.phoneNumber}` : ''}
                                {assignedEmp ? ` • ${assignedEmp.name}` : ''}
                              </div>
                            </div>
                          </div>
                          <span className="shrink-0 ml-2 px-1.5 py-0.5 text-[9px] font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {phone.status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Group 4: Assets */}
              {searchResults && searchResults.assets.length > 0 && (
                <div className="py-2">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center justify-between">
                    <span>Peripherals & Hardware ({searchResults.assets.length})</span>
                    <button
                      onClick={() => handleJumpToTab('assets')}
                      className="hover:underline text-[10px] flex items-center gap-0.5 text-slate-400 hover:text-amber-500 cursor-pointer"
                    >
                      View in Assets <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {searchResults.assets.slice(0, 4).map(asset => {
                      const assignedEmp = employees.find(e => e.id === asset.assignedEmployeeId);
                      return (
                        <button
                          key={asset.id}
                          onClick={() => handleSelectAssetHit(asset)}
                          className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                              <Headphones className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors truncate">
                                <span className="font-mono font-bold text-amber-600 dark:text-amber-400 mr-1.5">
                                  {asset.assetNumber}
                                </span>
                                {asset.assetType} — {asset.brand} {asset.model}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">
                                SN: {asset.serialNumber || 'N/A'} {assignedEmp ? `• ${assignedEmp.name}` : '• Unassigned'}
                              </div>
                            </div>
                          </div>
                          <span className="shrink-0 ml-2 px-1.5 py-0.5 text-[9px] font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {asset.status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Group 5: Services */}
              {searchResults && searchResults.services.length > 0 && (
                <div className="py-2">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center justify-between">
                    <span>Service Tickets ({searchResults.services.length})</span>
                    <button
                      onClick={() => handleJumpToTab('services')}
                      className="hover:underline text-[10px] flex items-center gap-0.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      View in Service Desk <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {searchResults.services.slice(0, 4).map(srv => (
                      <button
                        key={srv.id}
                        onClick={() => handleSelectServiceHit(srv)}
                        className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <Wrench className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-rose-500 transition-colors truncate">
                              <span className="font-mono font-bold text-rose-600 dark:text-rose-400 mr-1.5">
                                {srv.id}
                              </span>
                              {srv.problem || srv.problemCategory}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {srv.assetNumber} • {srv.employeeName} • {formatCurrency(srv.serviceCost || 0)}
                            </div>
                          </div>
                        </div>
                        <span className={`shrink-0 ml-2 px-1.5 py-0.5 text-[9px] font-semibold rounded ${
                          srv.serviceStatus === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          {srv.serviceStatus}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Quick-Tabs Footer */}
              <div className="pt-2 px-2 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border text-[9px]">ESC</kbd> to close</span>
                  <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border text-[9px]">⌘K</kbd> anytime</span>
                </div>
                <span>AssetCore v2.0 Enterprise</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions, Database Pill, Role & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Database Live Telemetry Pill & Interactive Dropdown Section (Admin Only) */}
          {!isEmployeeRole && (
            <div className="relative" ref={dbContainerRef}>
            <button
              type="button"
              onClick={handleToggleDbSection}
              aria-expanded={isDbOpen}
              aria-haspopup="dialog"
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all duration-200 cursor-pointer select-none ${
                isDbOpen
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-500/40 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 shadow-xs'
              }`}
              title={isDbOpen ? "Click to close Database Telemetry (or press ESC)" : "Inspect Client IndexedDB Health & Storage"}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <Database className={`w-3.5 h-3.5 shrink-0 transition-colors ${isDbOpen ? 'text-blue-600 dark:text-blue-400' : 'text-blue-500'}`} />
              <span className="font-mono text-[10px] tracking-tight">
                {dbStats?.totalRecords ? `${dbStats.totalRecords} records` : 'DB Online'}
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isDbOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''}`} />
            </button>

            {/* Smooth Animated Database Health & Storage Section Popover */}
            {isDbRendered && (
              <div
                className={`fixed sm:absolute inset-x-3 sm:inset-x-auto top-16 sm:top-full right-0 sm:mt-2 w-auto sm:w-[420px] max-w-[calc(100vw-24px)] z-50 transition-all duration-200 ease-out origin-top-right transform ${
                  isDbOpen
                    ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                }`}
              >
                <div className="bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-2xl border border-slate-200/90 dark:border-slate-800 text-xs">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            Client Storage & Database
                          </h3>
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            v1.0 Live
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          IndexedDB engine • Automated dual persistence
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleManualRefreshDb}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Refresh live telemetry counts"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isRefreshingDb ? 'animate-spin text-blue-500' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={closeDbSection}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Close section (ESC)"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="py-3.5 space-y-3">
                    {/* Telemetry Summary */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Engine Status</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="font-bold text-slate-900 dark:text-white text-xs">IndexedDB Active</span>
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-0.5">Instant local read/write</span>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Total Records</span>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                            {dbStats?.totalRecords ?? 0}
                          </span>
                          <span className="text-[9px] text-emerald-500 font-medium">synced</span>
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-0.5">Across 6 object stores</span>
                      </div>
                    </div>

                    {/* Store Breakdown */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Object Stores Inventory</span>
                        <span className="text-[9px] font-mono text-slate-400">6 Stores</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-[11px]">
                        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 transition-colors hover:border-blue-500/30">
                          <span className="text-slate-400 text-[10px] block">👤 Employees</span>
                          <strong className="font-mono text-slate-900 dark:text-white text-xs">{dbStats?.storeCounts?.employees ?? employees.length}</strong>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 transition-colors hover:border-blue-500/30">
                          <span className="text-slate-400 text-[10px] block">💻 Computers</span>
                          <strong className="font-mono text-slate-900 dark:text-white text-xs">{dbStats?.storeCounts?.computers ?? computers.length}</strong>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 transition-colors hover:border-blue-500/30">
                          <span className="text-slate-400 text-[10px] block">📦 Assets</span>
                          <strong className="font-mono text-slate-900 dark:text-white text-xs">{dbStats?.storeCounts?.assets ?? assets.length}</strong>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 transition-colors hover:border-blue-500/30">
                          <span className="text-slate-400 text-[10px] block">🛠️ Services</span>
                          <strong className="font-mono text-slate-900 dark:text-white text-xs">{dbStats?.storeCounts?.serviceRecords ?? serviceRecords.length}</strong>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 transition-colors hover:border-blue-500/30">
                          <span className="text-slate-400 text-[10px] block">🔄 Allocations</span>
                          <strong className="font-mono text-slate-900 dark:text-white text-xs">{dbStats?.storeCounts?.allocationRecords ?? 0}</strong>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 transition-colors hover:border-blue-500/30">
                          <span className="text-slate-400 text-[10px] block">📋 Audit Logs</span>
                          <strong className="font-mono text-slate-900 dark:text-white text-xs">{dbStats?.storeCounts?.auditLogs ?? 0}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Hidden File Input for Restore */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileRestoreChange}
                      className="hidden"
                    />

                    {/* Actions */}
                    <div className="flex flex-col gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => downloadBackup()}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold shadow-xs transition-colors cursor-pointer text-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Complete Backup (JSON)</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isRestoring}
                          className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-colors cursor-pointer text-[11px]"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-blue-500" />
                          <span>{isRestoring ? 'Restoring...' : 'Restore JSON'}</span>
                        </button>

                        {currentUser?.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => {
                              closeDbSection();
                              setShowResetConfirm(true);
                            }}
                            className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold transition-colors cursor-pointer text-[11px]"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>Clear Data</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Local storage • Zero tracking</span>
                      </div>
                      <span>ESC or click outside to close</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Quick Action Button (Admin only) */}
          {userRole === 'admin' && (
            <div className="relative" ref={quickMenuRef}>
              <button
                onClick={() => setShowQuickMenu(!showQuickMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg shadow-md shadow-orange-500/25 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Action</span>
              </button>

              {showQuickMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs animate-fade-in"
                  onClick={() => setShowQuickMenu(false)}
                >
                  <button
                    onClick={onOpenAddEmployee}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <span>👤</span> New Employee Onboarding
                  </button>
                  <button
                    onClick={onOpenAddComputer}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <span>💻</span> Register Computer Unit
                  </button>
                  <button
                    onClick={onOpenAddService}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 cursor-pointer"
                  >
                    <span>🛠️</span> Log Service / Repair
                  </button>
                  <button
                    onClick={onOpenAddToBuffer}
                    className="w-full text-left px-3.5 py-2 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 cursor-pointer font-medium"
                  >
                    <span>📦</span> Add to Buffer Stock
                  </button>
                  <button
                    onClick={exportFleetCSV}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 cursor-pointer text-emerald-600 dark:text-emerald-400 font-medium"
                  >
                    <span>📊</span> Export Fleet CSV
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Role Switcher Segmented Control */}
          {currentUser?.role === 'admin' ? (
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900/90 rounded-lg border border-slate-200/80 dark:border-slate-800 text-xs">
              <button
                onClick={() => setUserRole('admin')}
                className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  userRole === 'admin'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700/60'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Full administrative scope with unmasked hardware keys"
              >
                <Shield className="w-3 h-3 text-blue-500" />
                <span className="hidden md:inline">IT Admin</span>
              </button>
              <button
                onClick={() => setUserRole('employee')}
                className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  userRole === 'employee'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200/60 dark:border-slate-700/60'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Simulates standard employee with restricted Device ID / Product ID"
              >
                <User className="w-3 h-3 text-emerald-500" />
                <span className="hidden md:inline">Employee View</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
              <User className="w-3 h-3 text-emerald-500" />
              <span>Employee Portal</span>
            </div>
          )}

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors cursor-pointer"
            title={`Toggle ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Notification Bell & Interactive Notification Center */}
          <div className="relative" ref={notificationBellRef}>
            <button
              type="button"
              onClick={() => setIsNotificationOpen(prev => !prev)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer relative ${
                isNotificationOpen
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'
              }`}
              title={unreadCount > 0 ? `${unreadCount} Unread Notifications & System Alerts` : 'Notifications & Alerts'}
              aria-expanded={isNotificationOpen}
            >
              <Bell className={`w-4 h-4 ${hasCritical && unreadCount > 0 ? 'text-amber-500 animate-pulse' : ''}`} />
            </button>

            {unreadCount > 0 && (
              <span
                onClick={() => setIsNotificationOpen(prev => !prev)}
                className={`absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full text-white text-[9px] font-black flex items-center justify-center shadow-xs cursor-pointer ${
                  hasCritical
                    ? 'bg-gradient-to-r from-rose-500 to-amber-500 animate-pulse'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                }`}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}

            {/* Notification Center Dropdown */}
            <NotificationCenter
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
            />
          </div>

          {/* Export Fleet CSV */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={exportFleetCSV}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors hidden sm:flex items-center cursor-pointer"
              title="Export Fleet CSV Report"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            </button>
          )}

          {/* Backup Database JSON */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={downloadBackup}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors hidden sm:flex items-center cursor-pointer"
              title="Download Database JSON Backup"
            >
              <Download className="w-4 h-4 text-blue-500" />
            </button>
          )}

          {/* Clear All Data / Clean Slate */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 dark:text-slate-400 transition-colors hidden sm:flex items-center cursor-pointer"
              title="Clear All Database Data (Clean Slate)"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
            </button>
          )}

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

          {/* User Profile Menu & Logout */}
          <div className="relative flex items-center gap-2" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(prev => !prev)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="User Profile & Account Menu"
            >
              {currentUser?.role === 'employee' ? (
                <EmployeeAvatar
                  name={currentUser.name}
                  photoUrl={currentUser.photoUrl}
                  size="xs"
                />
              ) : (
                <div className="w-5 h-5 rounded bg-blue-600/20 text-blue-500 flex items-center justify-center text-[10px]">
                  <Shield className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="text-left hidden sm:block">
                <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">
                  {currentUser?.name || (userRole === 'admin' ? 'IT Admin' : 'Employee')}
                </div>
                <div className="text-[9px] font-mono text-slate-400">
                  {currentUser?.role === 'admin' ? 'Administrator' : currentUser?.employeeId}
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Popup Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#101726] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-[9999] animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 mb-2">
                  <EmployeeAvatar
                    name={currentUser?.name || (userRole === 'admin' ? 'IT Admin' : 'Employee')}
                    photoUrl={currentUser?.photoUrl}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {currentUser?.name || (userRole === 'admin' ? 'IT Administrator' : 'Employee')}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {currentUser?.email || (userRole === 'admin' ? 'admin@company.com' : 'employee@company.com')}
                    </div>
                    <span className="inline-block mt-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {currentUser?.role === 'admin' ? 'Role: Administrator' : `ID: ${currentUser?.employeeId || 'Staff'}`}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsChangePassModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer mb-1"
                >
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  <span>Change Password</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md shadow-rose-600/20 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout Account</span>
                </button>
              </div>
            )}

            {/* Direct Red Logout Button in Header */}
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/20 transition-colors cursor-pointer"
              title="Sign Out of Session"
            >
              <LogOut className="w-3.5 h-3.5 text-white" />
              <span className="font-bold">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Role Simulation Indicator when Admin tests Employee View */}
      {userRole === 'employee' && currentUser?.role === 'admin' && (
        <div className="bg-emerald-500/10 dark:bg-emerald-950/30 border-t border-emerald-500/20 px-4 py-1.5 flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-semibold">
              Simulating Employee Session (Previewing restricted employee scope & masked keys)
            </span>
            <span className="text-emerald-600/80 dark:text-emerald-400/80 hidden md:inline">
              — Hardware identifiers (Device ID & Product ID) are masked under corporate security policy.
            </span>
          </div>
          <button
            onClick={() => setUserRole('admin')}
            className="font-bold underline hover:text-emerald-950 dark:hover:text-white text-[11px] ml-2 shrink-0 cursor-pointer"
          >
            Exit Simulation
          </button>
        </div>
      )}

      {/* Backdrop for Database Health & Storage Section */}
      {isDbRendered && (
        <div
          onClick={closeDbSection}
          className={`fixed inset-0 z-40 bg-slate-950/25 dark:bg-black/50 backdrop-blur-xs transition-opacity duration-200 ease-out ${
            isDbOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden="true"
        />
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Database &amp; Data Removal Actions
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select whether you want to purge employee records only or wipe the entire database
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: Remove All Employees Only */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                    Remove All Employee Data ({employees.length} Personnel)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Purges all registered employee profiles. Their assigned workstations and assets are automatically returned to Available Inventory as "In Stock".
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    removeAllEmployees({ returnAssetsToInventory: true });
                    setShowResetConfirm(false);
                  }}
                  className="px-3 py-1.5 font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Employees</span>
                </button>
              </div>

              {/* Option 2: Wipe Entire Database */}
              <div className="p-3 bg-rose-50/40 dark:bg-rose-950/20 rounded-xl border border-rose-200/60 dark:border-rose-900/40 flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-rose-700 dark:text-rose-400 text-xs">
                    Wipe Entire Database (Clean Slate)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Completely purges all employees, workstation hardware, mobile devices, gear, allocations, service tickets, and audit logs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearAllData();
                    setShowResetConfirm(false);
                  }}
                  className="px-3 py-1.5 font-semibold text-white bg-rose-700 hover:bg-rose-600 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Wipe All Data</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-1.5 font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Password Reset Modal */}
      <AdminPasswordResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
      />

      {/* Account Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePassModalOpen}
        onClose={() => setIsChangePassModalOpen(false)}
      />
    </header>
  );
};
