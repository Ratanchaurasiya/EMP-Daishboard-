import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { EmployeeDashboard } from './components/dashboard/EmployeeDashboard';
import { EmployeeAccessAnalyticsDashboard } from './components/dashboard/EmployeeAccessAnalyticsDashboard';
import { HardwareAssetDashboard } from './components/dashboard/HardwareAssetDashboard';
import { EmployeeList } from './components/employees/EmployeeList';
import { EmployeeProfile } from './components/employees/EmployeeProfile';
import { AddEmployeeModal } from './components/employees/AddEmployeeModal';
import { ComputerList } from './components/computers/ComputerList';
import { ComputerDetailModal } from './components/computers/ComputerDetailModal';
import { AddComputerModal } from './components/computers/AddComputerModal';
import { AssetInventory } from './components/assets/AssetInventory';
import { PhoneInventory } from './components/phones/PhoneInventory';
import { AssetAssignModal } from './components/assets/AssetAssignModal';
import { AssetReturnModal } from './components/assets/AssetReturnModal';
import { AddToBufferModal } from './components/common/AddToBufferModal';
import { ServiceList } from './components/services/ServiceList';
import { AddServiceModal } from './components/services/AddServiceModal';
import { AuditLogView } from './components/audit/AuditLogView';
import { EmployeeQueryActionHistoryView } from './components/history/EmployeeQueryActionHistoryView';
import { WeeklyPhotoAuditHub } from './components/documentation/WeeklyPhotoAuditHub';
import { PurchaseManagementView } from './components/purchases/PurchaseManagementView';
import { AssetRequestList } from './components/requests/AssetRequestList';
import { AssetQueryList } from './components/queries/AssetQueryList';
import { SimManagementView } from './components/sim/SimManagementView';
import { SystemPcSupportView } from './components/support/SystemPcSupportView';
import { EmployeeExitClearanceView } from './components/clearance/EmployeeExitClearanceView';
import { ToastContainer } from './components/common/Toast';
import { LoginScreen } from './components/auth/LoginScreen';
import { SharedEmployeeView } from './components/employees/SharedEmployeeView';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AssetType } from './types';

const DashboardContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedEmployeeId,
    setSelectedEmployeeId,
    selectedComputerId,
    setSelectedComputerId,
    userRole,
    currentUser,
    isAuthenticated,
  } = useApp();

  const isEmployee = currentUser?.role === 'employee' || userRole === 'employee';

  // Navigation and modal states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddComputer, setShowAddComputer] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [serviceTargetCompId, setServiceTargetCompId] = useState<string | undefined>(undefined);
  const [showAssignAsset, setShowAssignAsset] = useState(false);
  const [assignTargetAssetId, setAssignTargetAssetId] = useState<string | undefined>(undefined);
  const [assignTargetEmpId, setAssignTargetEmpId] = useState<string | undefined>(undefined);
  const [assignTargetType, setAssignTargetType] = useState<AssetType | undefined>(undefined);
  const [showReturnAsset, setShowReturnAsset] = useState(false);
  const [returnTargetAssetId, setReturnTargetAssetId] = useState<string | null>(null);
  const [showAddToBuffer, setShowAddToBuffer] = useState(false);

  const handleSelectEmployee = (empId: string) => {
    setSelectedEmployeeId(empId);
    setSelectedComputerId(null);
    setActiveTab('employees');
    if (typeof window !== 'undefined') {
      window.location.hash = '#/employees';
    }
  };

  const handleSelectComputer = (compId: string) => {
    setSelectedComputerId(compId);
  };

  const handleOpenAddService = (compId?: string) => {
    setServiceTargetCompId(compId);
    setShowAddService(true);
  };

  const handleOpenAssignAsset = (empId?: string, assetId?: string, assetType?: AssetType) => {
    setAssignTargetEmpId(empId);
    setAssignTargetAssetId(assetId);
    setAssignTargetType(assetType);
    setShowAssignAsset(true);
  };

  const handleOpenReturnAsset = (assetId: string) => {
    setReturnTargetAssetId(assetId);
    setShowReturnAsset(true);
  };

  // Strictly enforce redirection to #/login when not authenticated (prevents browser Back button access)
  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      if (window.location.hash !== '#/login') {
        window.history.replaceState(null, '', `${window.location.pathname}#/login`);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleUnauthNav = () => {
      if (!isAuthenticated && typeof window !== 'undefined') {
        if (window.location.hash !== '#/login') {
          window.history.replaceState(null, '', `${window.location.pathname}#/login`);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handleUnauthNav);
      window.addEventListener('hashchange', handleUnauthNav);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handleUnauthNav);
        window.removeEventListener('hashchange', handleUnauthNav);
      }
    };
  }, [isAuthenticated]);

  // Public Direct Access: Zero-login employee shared custody view
  const isSharedRoute =
    activeTab === 'shared' ||
    (typeof window !== 'undefined' &&
      (window.location.hash.startsWith('#/shared') || window.location.hash.startsWith('#/share')));

  if (isSharedRoute) {
    return (
      <>
        <SharedEmployeeView
          employeeId={selectedEmployeeId}
          onExit={() => {
            if (isAuthenticated) {
              window.location.hash = '#/employees';
            } else {
              window.location.hash = '#/login';
            }
          }}
        />
        <ToastContainer />
      </>
    );
  }

  // If user is not signed in OR explicitly visiting #/login, show the enterprise LoginScreen
  const isLoginRoute =
    !isAuthenticated ||
    (typeof window !== 'undefined' &&
      (window.location.hash === '#/login' || window.location.hash.startsWith('#/login')));

  if (isLoginRoute) {
    return (
      <>
        <LoginScreen />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 font-sans transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenAddEmployee={() => setShowAddEmployee(true)}
          onOpenAddService={() => handleOpenAddService()}
          onOpenAddComputer={() => setShowAddComputer(true)}
          onOpenAddToBuffer={() => setShowAddToBuffer(true)}
          toggleSidebar={() => setSidebarOpen(prev => !prev)}
        />

        <main className="flex-1 p-3.5 sm:p-6 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          {/* STRICT DATA ISOLATION: When an Employee logs in, render only their personal dashboard */}
          {isEmployee ? (
            activeTab === 'exit-clearance' ? (
              <EmployeeExitClearanceView onSelectEmployee={handleSelectEmployee} />
            ) : (
              <EmployeeDashboard />
            )
          ) : (
            <>
              {/* TAB 1: EXECUTIVE COMMAND DASHBOARD */}
              {activeTab === 'dashboard' && (
                <ExecutiveDashboard
                  onSelectEmployee={handleSelectEmployee}
                  onSelectComputer={handleSelectComputer}
                  onOpenAddService={handleOpenAddService}
                  onOpenAssignAsset={handleOpenAssignAsset}
                />
              )}

              {/* TAB: HARDWARE & ASSETS DEDICATED DASHBOARD */}
              {activeTab === 'hardware-dashboard' && (
                <HardwareAssetDashboard
                  onSelectEmployee={handleSelectEmployee}
                  onSelectComputer={handleSelectComputer}
                  onOpenAddComputer={() => setShowAddComputer(true)}
                  onOpenAssignAsset={handleOpenAssignAsset}
                  onOpenAddService={handleOpenAddService}
                  onOpenAddToBuffer={() => setShowAddToBuffer(true)}
                />
              )}

              {/* TAB: EMPLOYEE ACCESS & ASSET ANALYTICS DASHBOARD */}
              {activeTab === 'lifecycle' && (
                <EmployeeAccessAnalyticsDashboard
                  onSelectEmployee={handleSelectEmployee}
                  onSelectComputer={handleSelectComputer}
                  onOpenAssignAsset={handleOpenAssignAsset}
                  onOpenAddService={handleOpenAddService}
                />
              )}

              {/* TAB 2: EMPLOYEES */}
              {activeTab === 'employees' && (
                <div>
                  {selectedEmployeeId ? (
                    <EmployeeProfile
                      employeeId={selectedEmployeeId}
                      onBack={() => setSelectedEmployeeId(null)}
                      onOpenAssignAsset={handleOpenAssignAsset}
                      onOpenReturnAsset={handleOpenReturnAsset}
                      onOpenAddService={handleOpenAddService}
                    />
                  ) : (
                    <EmployeeList
                      onSelectEmployee={handleSelectEmployee}
                      onOpenAddEmployee={() => setShowAddEmployee(true)}
                    />
                  )}
                </div>
              )}

              {/* TAB 3: COMPUTER INVENTORY */}
              {activeTab === 'computers' && (
                <ComputerList
                  onSelectComputer={handleSelectComputer}
                  onSelectEmployee={handleSelectEmployee}
                  onOpenAddComputer={() => setShowAddComputer(true)}
                  onOpenAddService={handleOpenAddService}
                />
              )}

              {/* TAB: MOBILE PHONES */}
              {activeTab === 'phones' && (
                <PhoneInventory
                  onOpenAssign={assetId => handleOpenAssignAsset(undefined, assetId, 'Mobile Phone')}
                  onOpenReturn={handleOpenReturnAsset}
                  onSelectEmployee={handleSelectEmployee}
                  onOpenAddService={handleOpenAddService}
                />
              )}

              {/* TAB 4: COMPANY ASSETS (Laptop, Mouse, Keyboard, Headset) */}
              {activeTab === 'assets' && (
                <AssetInventory
                  onOpenAssign={assetId => handleOpenAssignAsset(undefined, assetId)}
                  onOpenReturn={handleOpenReturnAsset}
                  onSelectEmployee={handleSelectEmployee}
                  onOpenAddService={handleOpenAddService}
                />
              )}

              {/* TAB: EQUIPMENT REQUISITIONS & REQUESTS */}
              {activeTab === 'requests' && (
                <AssetRequestList />
              )}

              {/* TAB: STAFF ASSET QUERY MANAGEMENT */}
              {activeTab === 'asset-queries' && (
                <AssetQueryList />
              )}

              {/* TAB 5: SERVICE & REPAIRS */}
              {activeTab === 'services' && (
                <ServiceList
                  onOpenAddService={handleOpenAddService}
                  onSelectComputer={handleSelectComputer}
                  onSelectEmployee={handleSelectEmployee}
                />
              )}

              {/* TAB 6: AUDIT & HISTORY */}
              {activeTab === 'audit' && (
                <AuditLogView
                  onSelectEmployee={handleSelectEmployee}
                />
              )}

              {/* TAB: EMPLOYEE QUERY & ACTION HISTORY */}
              {activeTab === 'query-history' && (
                <EmployeeQueryActionHistoryView
                  onSelectEmployee={handleSelectEmployee}
                />
              )}

              {/* TAB 7: WEEKLY ASSET PHOTO AUDITS HUB */}
              {activeTab === 'weekly-photos' && (
                <WeeklyPhotoAuditHub
                  onSelectEmployee={handleSelectEmployee}
                />
              )}

              {/* TAB 8: ADMIN PC/LAPTOP PURCHASES */}
              {activeTab === 'purchases' && (
                <PurchaseManagementView />
              )}



              {/* TAB 10: SIM CARD & CONTACT NUMBER MANAGEMENT */}
              {activeTab === 'sim-management' && (
                <SimManagementView
                  onSelectEmployee={handleSelectEmployee}
                />
              )}

              {/* TAB 11: SYSTEM / PC SUPPORT & SERVICE PROVIDERS */}
              {(activeTab === 'system-support' || activeTab === 'pc-support') && (
                <SystemPcSupportView />
              )}

              {/* TAB 12: EMPLOYEE EXIT & ASSET CLEARANCE */}
              {activeTab === 'exit-clearance' && (
                <EmployeeExitClearanceView
                  onSelectEmployee={handleSelectEmployee}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation (Pinned for Phones & Tablets) */}
      <BottomNav
        onOpenAddEmployee={() => setShowAddEmployee(true)}
        onOpenAddComputer={() => setShowAddComputer(true)}
        onOpenAddService={() => handleOpenAddService()}
        onOpenAddToBuffer={() => setShowAddToBuffer(true)}
      />

      {/* Floating System Toasts */}
      <ToastContainer />

      {/* Modals - Administrator Scope Only */}
      {!isEmployee && showAddEmployee && (
        <AddEmployeeModal
          isOpen={showAddEmployee}
          onClose={() => setShowAddEmployee(false)}
        />
      )}

      {!isEmployee && showAddComputer && (
        <AddComputerModal
          isOpen={showAddComputer}
          onClose={() => setShowAddComputer(false)}
        />
      )}

      {!isEmployee && showAddService && (
        <AddServiceModal
          isOpen={showAddService}
          onClose={() => {
            setShowAddService(false);
            setServiceTargetCompId(undefined);
          }}
          preSelectedComputerId={serviceTargetCompId}
        />
      )}

      {!isEmployee && showAssignAsset && (
        <AssetAssignModal
          isOpen={showAssignAsset}
          onClose={() => {
            setShowAssignAsset(false);
            setAssignTargetAssetId(undefined);
            setAssignTargetEmpId(undefined);
            setAssignTargetType(undefined);
          }}
          preSelectedAssetId={assignTargetAssetId}
          preSelectedEmployeeId={assignTargetEmpId}
          preSelectedType={assignTargetType}
        />
      )}

      {!isEmployee && showReturnAsset && returnTargetAssetId && (
        <AssetReturnModal
          assetId={returnTargetAssetId}
          onClose={() => {
            setShowReturnAsset(false);
            setReturnTargetAssetId(null);
          }}
        />
      )}

      {!isEmployee && showAddToBuffer && (
        <AddToBufferModal
          isOpen={showAddToBuffer}
          onClose={() => setShowAddToBuffer(false)}
        />
      )}

      {!isEmployee && selectedComputerId && (
        <ComputerDetailModal
          computerId={selectedComputerId}
          onClose={() => setSelectedComputerId(null)}
          onOpenAddService={handleOpenAddService}
          onSelectEmployee={handleSelectEmployee}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <DashboardContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
