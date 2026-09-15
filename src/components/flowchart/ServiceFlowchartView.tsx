import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  UserCog,
  FileText,
  FileSpreadsheet,
  Wrench,
  HelpCircle,
  Receipt,
  BellRing,
  CheckCircle2,
  FileWarning,
  Settings,
  Play,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Info,
  Database,
  Users,
  Layers,
  ChevronRight,
  ShieldCheck,
  X,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  FLOW_NODES,
  KEY_POINTS,
  MAIN_ENTITIES,
  SYSTEM_ROLES,
  MODULE_RESPONSIBILITIES,
  FlowNodeData,
} from './flowchartData';

export const ServiceFlowchartView: React.FC = () => {
  // View states
  const [activeTab, setActiveTab] = useState<'diagram' | 'steps' | 'entities'>('diagram');
  const [selectedNode, setSelectedNode] = useState<FlowNodeData | null>(null);
  const [showSidePanel, setShowSidePanel] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Simulation state
  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  const [simulationPath, setSimulationPath] = useState<'resolved' | 'unresolved_loop'>('resolved');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);

  // Happy path steps
  const HAPPY_PATH = [
    'employee_raise',
    'submit_request',
    'admin_create_entry',
    'kot_card',
    'service_partner_work',
    'issue_resolved_decision',
    'prepare_final_menu',
    'notify_admin_only',
    'close_issue',
  ];

  // Unresolved re-work loop steps
  const LOOP_PATH = [
    'employee_raise',
    'submit_request',
    'admin_create_entry',
    'kot_card',
    'service_partner_work',
    'issue_resolved_decision',
    'partner_sends_report',
    'admin_reviews_report',
    'kot_card', // looped back!
    'service_partner_work',
    'issue_resolved_decision',
    'prepare_final_menu',
    'notify_admin_only',
    'close_issue',
  ];

  const currentPathSequence = simulationPath === 'resolved' ? HAPPY_PATH : LOOP_PATH;

  // Simulation timer
  useEffect(() => {
    if (!simulationActive) return;
    const timer = setTimeout(() => {
      setActiveStepIndex(prev => {
        if (prev < currentPathSequence.length - 1) {
          return prev + 1;
        } else {
          setSimulationActive(false);
          return prev;
        }
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [simulationActive, activeStepIndex, currentPathSequence]);

  const handleStartSimulation = (path: 'resolved' | 'unresolved_loop') => {
    setSimulationPath(path);
    setActiveStepIndex(0);
    setSimulationActive(true);
  };

  const handleResetSimulation = () => {
    setSimulationActive(false);
    setActiveStepIndex(-1);
  };

  const isNodeActive = (nodeId: string) => {
    if (activeStepIndex === -1) return false;
    return currentPathSequence[activeStepIndex] === nodeId;
  };

  const isNodeVisited = (nodeId: string) => {
    if (activeStepIndex === -1) return false;
    const visited = currentPathSequence.slice(0, activeStepIndex + 1);
    return visited.includes(nodeId);
  };

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.15, 1.6));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.15, 0.65));
  const handleResetZoom = () => setZoomLevel(1);

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Render icon helper
  const renderIcon = (iconName: string, className: string = 'w-5 h-5') => {
    switch (iconName) {
      case 'User': return <User className={className} />;
      case 'UserCog': return <UserCog className={className} />;
      case 'FileText': return <FileText className={className} />;
      case 'FileSpreadsheet': return <FileSpreadsheet className={className} />;
      case 'Wrench': return <Wrench className={className} />;
      case 'HelpCircle': return <HelpCircle className={className} />;
      case 'Receipt': return <Receipt className={className} />;
      case 'BellRing': return <BellRing className={className} />;
      case 'CheckCircle2': return <CheckCircle2 className={className} />;
      case 'FileWarning': return <FileWarning className={className} />;
      case 'Settings': return <Settings className={className} />;
      default: return <FileText className={className} />;
    }
  };

  return (
    <div
      ref={containerRef}
      className="space-y-6 max-w-[1700px] mx-auto pb-16 animate-in fade-in duration-300"
    >
      {/* Top Banner Header with Controls */}
      <div className="bg-white dark:bg-[#0c1322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  Service Management System
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase tracking-wide">
                  Internal Workflow
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official Enterprise Standard Operating Procedure: <strong>Employee Device Support Flow</strong>
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher & Simulation Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Buttons */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('diagram')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'diagram'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Interactive Diagram
            </button>
            <button
              onClick={() => setActiveTab('steps')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'steps'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Step-by-Step Flow
            </button>
            <button
              onClick={() => setActiveTab('entities')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'entities'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              ER &amp; Entity Specs
            </button>
          </div>

          {/* Simulation dropdown / button */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleStartSimulation('resolved')}
              disabled={simulationActive && simulationPath === 'resolved'}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Simulate happy path: employee raises ticket -> repaired -> final bill to admin -> closed"
            >
              <Play className="w-3 h-3" />
              <span>Play Resolved Flow</span>
            </button>

            <button
              type="button"
              onClick={() => handleStartSimulation('unresolved_loop')}
              disabled={simulationActive && simulationPath === 'unresolved_loop'}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Simulate re-work loop: unresolved -> report -> admin reviews -> new KOT -> partner -> resolved"
            >
              <RefreshCw className={`w-3 h-3 ${simulationActive && simulationPath === 'unresolved_loop' ? 'animate-spin' : ''}`} />
              <span>Play Re-Work Loop</span>
            </button>

            {simulationActive && (
              <button
                type="button"
                onClick={handleResetSimulation}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                title="Reset simulation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Side Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowSidePanel(!showSidePanel)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              showSidePanel
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Modules &amp; Responsibilities</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: VISUAL ENTERPRISE FLOWCHART CANVAS                                 */}
      {/* ========================================================================= */}
      {activeTab === 'diagram' && (
        <div className="space-y-6">
          {/* Main Visual Canvas Container */}
          <div className="relative bg-white dark:bg-[#070b14] border border-slate-200/90 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl overflow-x-auto">
            {/* Diagram Title Banner directly on canvas (matching reference diagram) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <div className="w-full sm:w-auto text-center sm:text-left">
                <div className="inline-block bg-[#0f223a] dark:bg-[#0e1e35] text-white px-8 py-3 rounded-2xl shadow-lg border border-blue-900/50">
                  <h2 className="text-xl sm:text-2xl font-serif font-black tracking-wide text-center">
                    Service Management System
                  </h2>
                  <p className="text-xs text-blue-200/90 text-center mt-0.5 tracking-normal">
                    (Employee Device Support Flow)
                  </p>
                </div>
              </div>

              {/* Top Right System Scope Badge */}
              <div className="bg-slate-100 dark:bg-slate-900/90 px-4 py-2.5 rounded-xl border border-slate-300/80 dark:border-slate-800 text-center sm:text-right">
                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Internal System
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Employees • Admin • Service Partner
                </div>
              </div>
            </div>

            {/* Canvas Zoom & View controls overlay */}
            <div className="absolute right-6 top-6 flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm z-30">
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="px-2 py-1 rounded-lg text-[10px] font-mono text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Reset Zoom"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Toggle Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Flowchart Grid Area with Zoom Transform */}
            <div
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease-out',
                minWidth: '1150px',
              }}
              className="py-4"
            >
              {/* ========================================================================= */}
              {/* ROW 1: PRIMARY INGESTION & DISPATCH SEQUENCE                             */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-5 gap-4 items-stretch relative">
                {/* 1. Employee (Raise Issue) */}
                <div
                  onClick={() => setSelectedNode(FLOW_NODES.employee_raise)}
                  className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isNodeActive('employee_raise')
                      ? 'ring-4 ring-emerald-500/50 scale-105 border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 shadow-xl'
                      : 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/20 hover:shadow-lg hover:-translate-y-0.5'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="leading-tight">
                        <h3 className="font-bold text-slate-900 dark:text-emerald-300 text-sm">
                          Employee
                        </h3>
                        <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-semibold block">
                          (Raise Issue)
                        </span>
                      </div>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 list-disc list-inside">
                      {FLOW_NODES.employee_raise.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-3 pt-2 border-t border-emerald-500/30 flex items-center justify-between text-[9px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                    <span>Step 1</span>
                    <span className="flex items-center gap-0.5">Details <ChevronRight className="w-2.5 h-2.5" /></span>
                  </div>

                  {/* Flow Arrow to Next Box */}
                  <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-xs">
                      <ArrowRight className="w-3 h-3 text-slate-700 dark:text-slate-300" />
                    </div>
                  </div>
                </div>

                {/* 2. Submit Request (Through Software) */}
                <div
                  onClick={() => setSelectedNode(FLOW_NODES.submit_request)}
                  className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isNodeActive('submit_request')
                      ? 'ring-4 ring-blue-500/50 scale-105 border-blue-600 bg-blue-50 dark:bg-blue-950/40 shadow-xl'
                      : 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/20 hover:shadow-lg hover:-translate-y-0.5'
                  }`}
                >
                  <div className="text-center">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-2 shadow-xs">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-blue-300 text-sm">
                      Submit Request
                    </h3>
                    <span className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold block mt-0.5">
                      (Through Software)
                    </span>
                    <div className="mt-3 px-2 py-1 rounded-md bg-blue-100/70 dark:bg-blue-900/40 text-[10px] text-blue-800 dark:text-blue-200">
                      Workstation Portal Ingestion
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-blue-500/30 flex items-center justify-between text-[9px] text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider">
                    <span>System Gate</span>
                    <span className="flex items-center gap-0.5">Details <ChevronRight className="w-2.5 h-2.5" /></span>
                  </div>

                  {/* Flow Arrow to Next Box */}
                  <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-xs">
                      <ArrowRight className="w-3 h-3 text-slate-700 dark:text-slate-300" />
                    </div>
                  </div>
                </div>

                {/* 3. Admin (Create Service Entry) */}
                <div
                  onClick={() => setSelectedNode(FLOW_NODES.admin_create_entry)}
                  className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isNodeActive('admin_create_entry')
                      ? 'ring-4 ring-amber-500/50 scale-105 border-amber-500 bg-amber-50 dark:bg-amber-950/40 shadow-xl'
                      : 'border-amber-400 bg-amber-50/80 dark:bg-amber-950/20 hover:shadow-lg hover:-translate-y-0.5'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center shrink-0 shadow-xs">
                        <UserCog className="w-4 h-4" />
                      </div>
                      <div className="leading-tight">
                        <h3 className="font-bold text-slate-900 dark:text-amber-300 text-sm">
                          Admin
                        </h3>
                        <span className="text-[10px] text-amber-800 dark:text-amber-400 font-semibold block">
                          (Create Service Entry)
                        </span>
                      </div>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 list-disc list-inside">
                      {FLOW_NODES.admin_create_entry.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-3 pt-2 border-t border-amber-500/30 flex items-center justify-between text-[9px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
                    <span>Direct Entry (No Validity Diamond)</span>
                    <ChevronRight className="w-2.5 h-2.5" />
                  </div>

                  {/* Flow Arrow to Next Box */}
                  <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-xs">
                      <ArrowRight className="w-3 h-3 text-slate-700 dark:text-slate-300" />
                    </div>
                  </div>
                </div>

                {/* 4. KOT (Job Card) - Target of the Loop */}
                <div
                  id="node-kot-card"
                  onClick={() => setSelectedNode(FLOW_NODES.kot_card)}
                  className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isNodeActive('kot_card')
                      ? 'ring-4 ring-blue-500/60 scale-105 border-blue-600 bg-blue-100 dark:bg-blue-950/60 shadow-2xl'
                      : 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/30 hover:shadow-lg hover:-translate-y-0.5'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div className="leading-tight">
                        <h3 className="font-bold text-slate-900 dark:text-blue-300 text-sm">
                          KOT (Job Card)
                        </h3>
                        <span className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold block">
                          Work Order Dispatch
                        </span>
                      </div>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 list-disc list-inside">
                      {FLOW_NODES.kot_card.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-3 pt-2 border-t border-blue-500/30 flex items-center justify-between text-[9px] text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider">
                    <span>Re-Work Loop Landing Node</span>
                    <ChevronRight className="w-2.5 h-2.5" />
                  </div>

                  {/* Flow Arrow to Next Box */}
                  <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-xs">
                      <ArrowRight className="w-3 h-3 text-slate-700 dark:text-slate-300" />
                    </div>
                  </div>
                </div>

                {/* 5. Service Partner (Work on Issue) */}
                <div
                  onClick={() => setSelectedNode(FLOW_NODES.service_partner_work)}
                  className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isNodeActive('service_partner_work')
                      ? 'ring-4 ring-purple-500/50 scale-105 border-purple-600 bg-purple-50 dark:bg-purple-950/40 shadow-xl'
                      : 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/20 hover:shadow-lg hover:-translate-y-0.5'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div className="leading-tight">
                        <h3 className="font-bold text-slate-900 dark:text-purple-300 text-sm">
                          Service Partner
                        </h3>
                        <span className="text-[10px] text-purple-800 dark:text-purple-400 font-semibold block">
                          (Work on Issue)
                        </span>
                      </div>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 list-disc list-inside">
                      {FLOW_NODES.service_partner_work.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-3 pt-2 border-t border-purple-500/30 flex items-center justify-between text-[9px] text-purple-700 dark:text-purple-400 font-bold uppercase tracking-wider">
                    <span>Bench Repair</span>
                    <ChevronRight className="w-2.5 h-2.5" />
                  </div>
                </div>
              </div>

              {/* Arrow Down from Service Partner to Decision Diamond */}
              <div className="flex justify-end pr-14 py-4 relative">
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-10 bg-slate-400 dark:bg-slate-600" />
                  <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-xs">
                    <ArrowRight className="w-3 h-3 text-slate-700 dark:text-slate-300 rotate-90" />
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* ROW 2: DECISION DIAMOND & BRANCHING PATHWAYS                             */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-5 gap-4 items-center relative my-2">
                {/* Blank Slot 1 */}
                <div />

                {/* 11. Admin Reviews Report (Loop Path Node) */}
                <div
                  onClick={() => setSelectedNode(FLOW_NODES.admin_reviews_report)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isNodeActive('admin_reviews_report')
                      ? 'ring-4 ring-amber-500/50 scale-105 border-amber-500 bg-amber-50 dark:bg-amber-950/40 shadow-xl'
                      : 'border-amber-400 bg-amber-50/80 dark:bg-amber-950/20 hover:shadow-lg hover:-translate-y-0.5'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center shrink-0">
                        <Settings className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-amber-300 text-sm leading-tight">
                        Admin Reviews Report
                      </h3>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 list-disc list-inside">
                      {FLOW_NODES.admin_reviews_report.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-3 pt-2 border-t border-amber-500/30 text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase">
                    Loop Reassignment Decision
                  </div>
                </div>

                {/* 10. Service Partner Sends Report (Through Software) */}
                <div
                  onClick={() => setSelectedNode(FLOW_NODES.partner_sends_report)}
                  className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isNodeActive('partner_sends_report')
                      ? 'ring-4 ring-blue-500/50 scale-105 border-blue-500 bg-blue-50 dark:bg-blue-950/40 shadow-xl'
                      : 'border-blue-400 bg-blue-50/70 dark:bg-blue-950/20 hover:shadow-lg hover:-translate-y-0.5'
                  }`}
                >
                  {/* Left Arrow to Admin Reviews Report */}
                  <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-xs">
                      <ArrowRight className="w-3 h-3 text-slate-700 dark:text-slate-300 rotate-180" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <FileWarning className="w-4 h-4" />
                      </div>
                      <div className="leading-tight">
                        <h3 className="font-bold text-slate-900 dark:text-blue-300 text-xs">
                          Service Partner Sends Report
                        </h3>
                        <span className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold block">
                          (Through Software)
                        </span>
                      </div>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 list-disc list-inside">
                      {FLOW_NODES.partner_sends_report.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-3 pt-2 border-t border-blue-500/30 text-[9px] font-bold text-blue-700 dark:text-blue-400 uppercase">
                    Escalation Findings
                  </div>
                </div>

                {/* 6. Decision Diamond: Issue Resolved? */}
                <div className="flex flex-col items-center justify-center relative">
                  {/* Branch NO label (pointing left) */}
                  <div className="absolute -left-7 top-1/2 -translate-y-1/2 font-black text-rose-600 dark:text-rose-400 text-xs bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-rose-400 shadow-xs z-20">
                    No
                  </div>

                  {/* Left arrow from diamond to report */}
                  <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-4 h-0.5 bg-rose-500" />

                  {/* Decision Diamond Node */}
                  <div
                    onClick={() => setSelectedNode(FLOW_NODES.issue_resolved_decision)}
                    className={`w-36 h-36 rotate-45 border-2 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${
                      isNodeActive('issue_resolved_decision')
                        ? 'ring-4 ring-rose-500/60 scale-105 border-rose-600 bg-rose-100 dark:bg-rose-950/60 shadow-2xl'
                        : 'border-rose-500 bg-rose-50/90 dark:bg-rose-950/30 hover:scale-105 hover:shadow-xl'
                    }`}
                  >
                    {/* Counter-rotate text inside diamond */}
                    <div className="-rotate-45 text-center p-2">
                      <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center mx-auto mb-1 shadow-xs">
                        <Settings className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
                      </div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-xs leading-tight">
                        Issue Resolved?
                      </h4>
                    </div>
                  </div>

                  {/* Branch YES label (pointing right) */}
                  <div className="absolute -right-7 top-1/2 -translate-y-1/2 font-black text-emerald-600 dark:text-emerald-400 text-xs bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-emerald-400 shadow-xs z-20">
                    Yes
                  </div>

                  {/* Right arrow from diamond to Prepare Final Menu */}
                  <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-4 h-0.5 bg-emerald-500" />
                </div>

                {/* 7. Prepare Final Menu (Bill / Invoice) */}
                <div
                  onClick={() => setSelectedNode(FLOW_NODES.prepare_final_menu)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isNodeActive('prepare_final_menu')
                      ? 'ring-4 ring-blue-500/50 scale-105 border-blue-600 bg-blue-50 dark:bg-blue-950/40 shadow-xl'
                      : 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/20 hover:shadow-lg hover:-translate-y-0.5'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div className="leading-tight">
                        <h3 className="font-bold text-slate-900 dark:text-blue-300 text-xs">
                          Prepare Final Menu
                        </h3>
                        <span className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold block">
                          (Bill / Invoice)
                        </span>
                      </div>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 list-disc list-inside">
                      {FLOW_NODES.prepare_final_menu.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-3 pt-2 border-t border-blue-500/30 text-[9px] font-bold text-blue-700 dark:text-blue-400 uppercase">
                    Financial Itemization
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* CONNECTING LOOP SVG: Unresolved Loop Back from Admin Reviews Report to KOT */}
              {/* ========================================================================= */}
              {/* Arrow Down from Prepare Final Menu to Notify Admin Only */}
              <div className="grid grid-cols-5 gap-4 py-3">
                <div />
                {/* Loop Line Start (Upwards from Admin Reviews Report) */}
                <div className="relative h-12">
                  <div className="absolute left-1/2 bottom-0 w-0.5 h-full bg-amber-500 dark:bg-amber-400" />
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 bg-amber-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap z-20">
                    Generate New KOT (Loop Continues)
                  </div>
                </div>
                {/* Loop Line Crossing */}
                <div className="relative h-12">
                  <div className="absolute left-0 top-0 w-full h-0.5 bg-amber-500 dark:bg-amber-400" />
                </div>
                {/* Loop Line Target into KOT */}
                <div className="relative h-12">
                  <div className="absolute left-0 top-0 w-1/2 h-0.5 bg-amber-500 dark:bg-amber-400" />
                  <div className="absolute left-1/2 top-0 w-0.5 h-full bg-amber-500 dark:bg-amber-400" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center z-20">
                    <ArrowRight className="w-3 h-3 rotate-90 text-black font-bold" />
                  </div>
                </div>
                {/* Down Arrow to Notify Admin Only */}
                <div className="flex justify-center items-center h-12">
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-8 bg-blue-500" />
                    <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-xs">
                      <ArrowRight className="w-3 h-3 text-slate-700 dark:text-slate-300 rotate-90" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* ROW 3: FINAL NOTIFICATION & CLOSURE                                       */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-5 gap-4 items-stretch relative">
                {/* 9. Close Issue (End) - Bottom Left */}
                <div
                  onClick={() => setSelectedNode(FLOW_NODES.close_issue)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isNodeActive('close_issue')
                      ? 'ring-4 ring-emerald-500/50 scale-105 border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 shadow-xl'
                      : 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/20 hover:shadow-lg hover:-translate-y-0.5'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="leading-tight">
                        <h3 className="font-bold text-slate-900 dark:text-emerald-300 text-sm">
                          Close Issue
                        </h3>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block">
                          (End Workflow)
                        </span>
                      </div>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 list-disc list-inside">
                      {FLOW_NODES.close_issue.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-3 pt-2 border-t border-emerald-500/30 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                    Terminal State
                  </div>
                </div>

                {/* Horizontal Connector Line from Notify Admin Only to Close Issue */}
                <div className="col-span-3 flex items-center relative px-2">
                  <div className="w-full h-0.5 bg-slate-400 dark:bg-slate-600 relative">
                    <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white dark:bg-slate-900 px-3 py-0.5 rounded-full text-[10px] font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-1.5">
                      <ArrowRight className="w-3 h-3 rotate-180 text-blue-500" />
                      <span>Issue Closure Authorization Trail</span>
                    </div>
                    {/* Left arrow pointing into Close Issue */}
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-xs">
                      <ArrowRight className="w-3 h-3 text-slate-700 dark:text-slate-300 rotate-180" />
                    </div>
                  </div>
                </div>

                {/* 8. Notify Admin Only (CRITICAL: ADMIN ONLY) */}
                <div
                  onClick={() => setSelectedNode(FLOW_NODES.notify_admin_only)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isNodeActive('notify_admin_only')
                      ? 'ring-4 ring-purple-500/50 scale-105 border-purple-600 bg-purple-50 dark:bg-purple-950/40 shadow-xl'
                      : 'border-purple-600 bg-purple-50/80 dark:bg-purple-950/20 hover:shadow-lg hover:-translate-y-0.5'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <BellRing className="w-4 h-4" />
                      </div>
                      <div className="leading-tight">
                        <h3 className="font-bold text-slate-900 dark:text-purple-300 text-xs">
                          Notify Admin Only
                        </h3>
                        <span className="text-[10px] text-purple-700 dark:text-purple-400 font-semibold block">
                          No Employee Notification
                        </span>
                      </div>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 list-disc list-inside">
                      {FLOW_NODES.notify_admin_only.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-3 pt-2 border-t border-purple-500/30 text-[9px] font-bold text-purple-700 dark:text-purple-400 uppercase">
                    Admin Access Security
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BOTTOM REFERENCE PANELS (Exactly matching the reference diagram)         */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Panel 1: Key Points (Blue Theme) */}
            <div className="p-5 rounded-2xl border-2 border-blue-500/80 bg-blue-50/50 dark:bg-blue-950/20 space-y-3 shadow-sm">
              <div className="flex items-center gap-2.5 pb-2 border-b border-blue-500/30">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Info className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-blue-300 text-sm">
                  Key Points
                </h3>
              </div>
              <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-300 list-decimal list-inside leading-relaxed font-medium">
                {KEY_POINTS.map(kp => (
                  <li key={kp.id}>
                    <span>{kp.text}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Panel 2: Main Entities (Green Theme) */}
            <div className="p-5 rounded-2xl border-2 border-emerald-600/80 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3 shadow-sm">
              <div className="flex items-center gap-2.5 pb-2 border-b border-emerald-500/30">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-emerald-300 text-sm">
                  Main Entities (ER Reference)
                </h3>
              </div>
              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-mono">
                {MAIN_ENTITIES.map((ent, idx) => (
                  <div key={idx} className="flex items-baseline gap-1.5 leading-tight">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">• {ent.name}:</span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                      ({ent.fields.join(', ')})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 3: System Users & Roles (Red/Pink Theme) */}
            <div className="p-5 rounded-2xl border-2 border-rose-500/80 bg-rose-50/50 dark:bg-rose-950/20 space-y-3 shadow-sm">
              <div className="flex items-center gap-2.5 pb-2 border-b border-rose-500/30">
                <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-rose-300 text-sm">
                  System Users &amp; Roles
                </h3>
              </div>
              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div>
                  <div className="font-bold text-emerald-700 dark:text-emerald-400">
                    • Employee:
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 pl-3 mt-0.5">
                    Raise request, view status &amp; history
                  </div>
                </div>
                <div>
                  <div className="font-bold text-amber-700 dark:text-amber-400">
                    • Admin:
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 pl-3 mt-0.5">
                    Create service entry, generate KOT, review reports, close issue
                  </div>
                </div>
                <div>
                  <div className="font-bold text-purple-700 dark:text-purple-400">
                    • Service Partner:
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 pl-3 mt-0.5">
                    Work on issue, update status, send reports
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STEP-BY-STEP FLOW LIST (Mobile & Tablet Friendly)                  */}
      {/* ========================================================================= */}
      {activeTab === 'steps' && (
        <div className="bg-white dark:bg-[#0c1322] border border-slate-200/90 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              End-to-End Execution Sequence
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detailed step-by-step breakdown of how tickets transition from creation to final resolution
            </p>
          </div>

          <div className="relative border-l-2 border-blue-500/30 dark:border-blue-500/20 ml-4 space-y-8 pl-6">
            {Object.values(FLOW_NODES).map((node, idx) => (
              <div key={node.id} className="relative group">
                {/* Step Pill on vertical timeline */}
                <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center ring-4 ring-white dark:ring-[#0c1322] shadow-xs">
                  {idx + 1}
                </div>

                <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {node.title} {node.subtitle}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        {node.actor}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedNode(node)}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                    >
                      <span>Inspect Schema</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {node.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Key Actions</div>
                      <ul className="space-y-1 text-slate-600 dark:text-slate-300 list-disc list-inside">
                        {node.bullets.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>

                    {node.entityAttributes && (
                      <div className="space-y-1 font-mono text-[11px]">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Database Fields</div>
                        <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
                          {node.entityAttributes.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ER & ENTITY SPECS                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'entities' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MAIN_ENTITIES.map((ent, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/90 dark:border-slate-800/80 shadow-xs space-y-3"
              >
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {ent.name}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Core System Model
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {ent.desc}
                </p>

                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Attributes
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ent.fields.map((f, fi) => (
                      <span
                        key={fi}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-semibold border border-slate-200 dark:border-slate-700"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Roles Matrix */}
          <div className="bg-white dark:bg-[#0c1322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              System Roles &amp; Data Access Matrix
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SYSTEM_ROLES.map((r, ri) => (
                <div key={ri} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {r.role}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {r.badge}
                    </span>
                  </div>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400 list-disc list-inside">
                    {r.duties.map((d, di) => (
                      <li key={di}>{d}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SIDE DRAWER: KEY MODULES & RESPONSIBILITIES (Requested in Prompt)         */}
      {/* ========================================================================= */}
      {showSidePanel && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0a0f1d] h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-slide-left">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Key Modules &amp; Responsibilities
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Architectural duty assignments by domain
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSidePanel(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {MODULE_RESPONSIBILITIES.map((mod, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {mod.title}
                    </span>
                  </div>
                  <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside">
                    {mod.points.map((p, pi) => (
                      <li key={pi}>{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NODE INSPECTOR MODAL: Full Entity & Payload Details                        */}
      {/* ========================================================================= */}
      {selectedNode && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0e1626] rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                  {renderIcon(selectedNode.icon, 'w-5 h-5')}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedNode.title} {selectedNode.subtitle}
                  </h3>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                    Actor: {selectedNode.actor}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedNode.description}
            </p>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Core Responsibilities
              </span>
              <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside">
                {selectedNode.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>

            {selectedNode.entityAttributes && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Data Schema Attributes
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.entityAttributes.map((attr, ai) => (
                    <span
                      key={ai}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-blue-600 dark:text-blue-400 font-semibold"
                    >
                      {attr}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedNode(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
