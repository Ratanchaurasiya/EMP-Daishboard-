import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Home,
  Users,
  Laptop,
  Headphones,
  Menu,
  X,
  Plus,
  Wrench,
  Activity,
  History,
  Sun,
  Moon,
  LogOut,
  Download,
  Shield,
  Smartphone,
  FileSpreadsheet,
  Layers,
  Camera,
  ShoppingBag,
  Box,
  UserX,
} from 'lucide-react';
import { EmployeeAvatar } from '../common/EmployeeAvatar';

interface BottomNavProps {
  onOpenAddEmployee: () => void;
  onOpenAddComputer: () => void;
  onOpenAddService: () => void;
  onOpenAddToBuffer?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  onOpenAddEmployee,
  onOpenAddComputer,
  onOpenAddService,
  onOpenAddToBuffer,
}) => {
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
    simCards = [],
    exitClearances = [],
    currentUser,
    userRole,
    setUserRole,
    theme,
    toggleTheme,
    logout,
    setSelectedEmployeeId,
    setSelectedComputerId,
    setGlobalFilters,
    downloadBackup,
    exportFleetCSV,
  } = useApp();

  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showQuickAddMenu, setShowQuickAddMenu] = useState(false);

  const isEmployee = currentUser?.role === 'employee' || userRole === 'employee';

  const handleNavSelect = (tabId: string) => {
    setActiveTab(tabId);
    setSelectedEmployeeId(null);
    setSelectedComputerId(null);
    setGlobalFilters({ search: '' });
    setShowMoreMenu(false);
    setShowQuickAddMenu(false);
  };

  const highIncidentCount = computers.filter(c => {
    const compServices = serviceRecords.filter(s => s.computerId === c.id);
    const totalCost = compServices.reduce((sum, s) => sum + (s.serviceCost || 0), 0);
    return compServices.length >= 4 || totalCost >= 5000 || c.condition === 'Damaged';
  }).length;

  return (
    <>
      {/* Mobile Quick Action Floating Menu Backdrop */}
      {showQuickAddMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden animate-fade-in"
          onClick={() => setShowQuickAddMenu(false)}
        />
      )}

      {/* Mobile Quick Action Popup Menu (Admin only) */}
      {!isEmployee && showQuickAddMenu && (
        <div className="fixed bottom-20 right-4 z-50 w-64 bg-white dark:bg-[#101726] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1e293b] p-2 space-y-1 lg:hidden animate-fade-in text-xs">
          <div className="px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Quick Create</span>
            <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => setShowQuickAddMenu(false)} />
          </div>

          <button
            onClick={() => {
              setShowQuickAddMenu(false);
              onOpenAddEmployee();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block leading-tight">New Employee</span>
              <span className="text-[10px] text-slate-400 font-normal">With phone & workstation</span>
            </div>
          </button>

          <button
            onClick={() => {
              setShowQuickAddMenu(false);
              onOpenAddComputer();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Laptop className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block leading-tight">Register Computer</span>
              <span className="text-[10px] text-slate-400 font-normal">Add PC or laptop unit</span>
            </div>
          </button>

          <button
            onClick={() => {
              setShowQuickAddMenu(false);
              onOpenAddService();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block leading-tight">Log Service Ticket</span>
              <span className="text-[10px] text-slate-400 font-normal">Repair or maintenance</span>
            </div>
          </button>

          {onOpenAddToBuffer && (
            <button
              onClick={() => {
                setShowQuickAddMenu(false);
                onOpenAddToBuffer();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-semibold transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Box className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block leading-tight">Add to Buffer Stock</span>
                <span className="text-[10px] text-slate-400 font-normal">Move or register spares</span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Mobile More Drawer Backdrop */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden animate-fade-in"
          onClick={() => setShowMoreMenu(false)}
        />
      )}

      {/* Mobile More Drawer / Bottom Sheet */}
      {showMoreMenu && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-[#101726] rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-[#1e293b] max-h-[85vh] overflow-y-auto p-4 space-y-4 lg:hidden animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              {currentUser?.role === 'employee' ? (
                <EmployeeAvatar
                  name={currentUser.name}
                  photoUrl={currentUser.photoUrl}
                  size="sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
              )}
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                  {currentUser?.name || (userRole === 'admin' ? 'IT Administrator' : 'Employee')}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {currentUser?.role === 'admin' ? 'Full Admin Privileges' : currentUser?.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowMoreMenu(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Modules */}
          <div className="space-y-1 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
              Additional Modules
            </span>

            {!isEmployee && (
              <button
                onClick={() => handleNavSelect('hardware-dashboard')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  activeTab === 'hardware-dashboard'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <span>Hardware & Assets Hub</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                  {computers.length + assets.filter(a => a.assetType !== 'Laptop').length}
                </span>
              </button>
            )}

            {!isEmployee && (
              <button
                onClick={() => handleNavSelect('lifecycle')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  activeTab === 'lifecycle'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  <span>Employee Access & Asset Analytics</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold">
                  {employees.length} Staff
                </span>
              </button>
            )}

            {!isEmployee && (
              <button
                onClick={() => handleNavSelect('phones')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  activeTab === 'phones'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-blue-500" />
                  <span>Mobile Phones & Cellular</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {assets.filter(a => a.assetType === 'Mobile Phone').length}
                </span>
              </button>
            )}

            {!isEmployee && (
              <button
                onClick={() => handleNavSelect('sim-management')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  activeTab === 'sim-management'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>SIM Cards & Mobile Fleet</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                  {simCards.length}
                </span>
              </button>
            )}

            {!isEmployee && (
              <button
                onClick={() => handleNavSelect('purchases')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  activeTab === 'purchases'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-amber-500" />
                  <span>PC/Laptop Purchases</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                  {purchases.length}
                </span>
              </button>
            )}

            {!isEmployee && (
              <button
                onClick={() => handleNavSelect('requests')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  activeTab === 'requests'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-blue-500" />
                  <span>Equipment Requests</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                  {assetRequests.filter(r => r.status === 'Pending').length}
                </span>
              </button>
            )}

            {!isEmployee && (
              <button
                onClick={() => handleNavSelect('services')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  activeTab === 'services'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Wrench className="w-4 h-4 text-amber-500" />
                  <span>Service & Repair Desk</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {serviceRecords.length}
                </span>
              </button>
            )}

            <button
              onClick={() => handleNavSelect('weekly-photos')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors ${
                activeTab === 'weekly-photos'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Camera className="w-4 h-4 text-sky-500" />
                <span>Weekly Photo Audits</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                {weeklyPhotoRecords.length}
              </span>
            </button>

            <button
              onClick={() => handleNavSelect('exit-clearance')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors ${
                activeTab === 'exit-clearance'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserX className="w-4 h-4 text-rose-500" />
                <span>Exit & Asset Clearance</span>
              </div>
              {exitClearances.filter(c => c.status !== 'Full & Final Approved' && c.status !== 'Cleared').length > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                  {exitClearances.filter(c => c.status !== 'Full & Final Approved' && c.status !== 'Cleared').length}
                </span>
              )}
            </button>

            {!isEmployee && (
              <button
                onClick={() => handleNavSelect('audit')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  activeTab === 'audit'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-purple-500" />
                  <span>Audit Logs & History</span>
                </div>
              </button>
            )}
          </div>

          {/* Preferences & Actions */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
              Preferences & Session
            </span>

            {/* Role Simulation Switcher (Admin only) */}
            {currentUser?.role === 'admin' && (
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#090d16] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Active View:</span>
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
                  <button
                    onClick={() => setUserRole('admin')}
                    className={`px-2 py-1 rounded text-[11px] font-bold ${
                      userRole === 'admin'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    onClick={() => setUserRole('employee')}
                    className={`px-2 py-1 rounded text-[11px] font-bold ${
                      userRole === 'employee'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Employee
                  </button>
                </div>
              </div>
            )}

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 font-medium">
                {theme === 'light' ? (
                  <Moon className="w-4 h-4 text-slate-500" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
                <span>Appearance Mode</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                {theme === 'light' ? 'Light' : 'Dark'}
              </span>
            </button>

            {/* Export Fleet CSV (Admin only) */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  exportFleetCSV();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 font-medium">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span>Export Fleet Report (CSV)</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">Excel/CSV</span>
              </button>
            )}

            {/* Export JSON (Admin only) */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  downloadBackup();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 font-medium">
                  <Download className="w-4 h-4 text-blue-500" />
                  <span>Download IndexedDB Backup</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">JSON Dump</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Dashboard</span>
            </button>
          </div>
        </div>
      )}

      {/* Pinned Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-[#0b101b]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800/90 px-2 py-1.5 lg:hidden transition-colors shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between relative">
          {/* 1. Home / Dashboard */}
          <button
            onClick={() => handleNavSelect('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-blue-50 dark:bg-blue-950/50' : ''}`}>
              <Home className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">Home</span>
          </button>

          {/* Employee Mobile Navigation Items */}
          {isEmployee && (
            <>
              <button
                onClick={() => handleNavSelect('workstation')}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'workstation'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-lg transition-all relative ${activeTab === 'workstation' ? 'bg-blue-50 dark:bg-blue-950/50' : ''}`}>
                  <Laptop className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold tracking-tight mt-0.5">Hardware</span>
              </button>

              <button
                onClick={() => handleNavSelect('assets')}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'assets'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-lg transition-all relative ${activeTab === 'assets' ? 'bg-blue-50 dark:bg-blue-950/50' : ''}`}>
                  <Headphones className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold tracking-tight mt-0.5">Devices</span>
              </button>

              <button
                onClick={() => handleNavSelect('services')}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'services'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-lg transition-all relative ${activeTab === 'services' ? 'bg-blue-50 dark:bg-blue-950/50' : ''}`}>
                  <Wrench className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold tracking-tight mt-0.5">Services</span>
              </button>
            </>
          )}

          {/* 2. Employees */}
          {!isEmployee && (
            <button
              onClick={() => handleNavSelect('employees')}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
                activeTab === 'employees'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all relative ${activeTab === 'employees' ? 'bg-blue-50 dark:bg-blue-950/50' : ''}`}>
                <Users className="w-5 h-5" />
                <span className="absolute -top-1 -right-1.5 px-1 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-[8px] font-mono font-bold">
                  {employees.length}
                </span>
              </div>
              <span className="text-[10px] font-semibold tracking-tight mt-0.5">Staff</span>
            </button>
          )}

          {/* Floating Action Button (Center Quick Add on Mobile) */}
          {!isEmployee && (
            <div className="flex-1 flex justify-center py-1">
              <button
                type="button"
                onClick={() => setShowQuickAddMenu(prev => !prev)}
                className={`w-11 h-11 rounded-full flex items-center justify-center text-white shadow-lg transition-all transform active:scale-95 cursor-pointer ${
                  showQuickAddMenu ? 'bg-slate-800 rotate-45' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/30'
                }`}
                title="Quick create"
              >
                <Plus className="w-5 h-5 transition-transform" />
              </button>
            </div>
          )}

          {/* 3. Computers */}
          {!isEmployee && (
            <button
              onClick={() => handleNavSelect('computers')}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
                activeTab === 'computers'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all relative ${activeTab === 'computers' ? 'bg-blue-50 dark:bg-blue-950/50' : ''}`}>
                <Laptop className="w-5 h-5" />
                <span className="absolute -top-1 -right-1.5 px-1 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-[8px] font-mono font-bold">
                  {computers.length}
                </span>
              </div>
              <span className="text-[10px] font-semibold tracking-tight mt-0.5">Laptops</span>
            </button>
          )}

          {/* 4. Assets & Phones */}
          {!isEmployee && (
            <button
              onClick={() => handleNavSelect('assets')}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
                activeTab === 'assets'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all relative ${activeTab === 'assets' ? 'bg-blue-50 dark:bg-blue-950/50' : ''}`}>
                <Headphones className="w-5 h-5" />
                <span className="absolute -top-1 -right-1.5 px-1 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-[8px] font-mono font-bold">
                  {assets.length}
                </span>
              </div>
              <span className="text-[10px] font-semibold tracking-tight mt-0.5">Assets</span>
            </button>
          )}

          {/* 5. More Menu Drawer */}
          {(() => {
            const isPrimaryTab = isEmployee
              ? ['dashboard', 'workstation', 'assets', 'services'].includes(activeTab)
              : ['dashboard', 'employees', 'computers', 'assets'].includes(activeTab);
            const isMoreActive = showMoreMenu || !isPrimaryTab;

            return (
              <button
                onClick={() => setShowMoreMenu(prev => !prev)}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
                  isMoreActive
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-lg transition-all relative ${isMoreActive ? 'bg-blue-50 dark:bg-blue-950/50' : ''}`}>
                  <Menu className="w-5 h-5" />
                  {highIncidentCount > 0 && (
                    <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </div>
                <span className="text-[10px] font-semibold tracking-tight mt-0.5">More</span>
              </button>
            );
          })()}
        </div>
      </nav>
    </>
  );
};
