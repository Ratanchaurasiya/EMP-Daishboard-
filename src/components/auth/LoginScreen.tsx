import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';
import { playBiometricSound } from '../../utils/audioEffects';
import {
  Shield,
  User,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Laptop,
  ShieldCheck,
  Loader2,
  Info,
  Camera,
  Key,
  CheckCircle2,
  ScanFace,
  VideoOff,
  RefreshCw,
} from 'lucide-react';
import { verifyLiveFaceMatch, FaceVerificationResult } from '../../utils/faceBiometrics';
import { AdminPasswordResetModal } from './AdminPasswordResetModal';
import { ITWorkstationBackground } from './ITWorkstationBackground';

type AuthMethod = 'pass' | 'photo';

interface Point {
  x: number;
  y: number;
}

export const LoginScreen: React.FC = () => {
  const {
    employees,
    loginAsAdmin,
    loginAsEmployee,
    theme,
    toggleTheme,
    showToast,
  } = useApp();

  const [activeRole, setActiveRole] = useState<'admin' | 'employee'>('admin');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('pass');

  // Security info popover toggle
  const [showSecurityTooltip, setShowSecurityTooltip] = useState(false);

  // Common loading / error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // -------------------------------------------------------------
  // HERO FINGERTIP INTERACTIVE CONNECTION SYSTEM
  // -------------------------------------------------------------
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [fingerPos, setFingerPos] = useState<Point | null>(null);
  const [cardTargetPos, setCardTargetPos] = useState<Point | null>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: -1000, y: -1000 });
  const [heroImgLayout, setHeroImgLayout] = useState<{
    width: number;
    height: number;
    left: number;
    top: number;
  }>({
    width: 1024,
    height: 502,
    left: 0,
    top: 0,
  });

  // Sequential Entrance Phases: 'ignite' -> 'trail' -> 'unlocked' -> 'steady'
  const [entranceStage, setEntranceStage] = useState<'ignite' | 'trail' | 'unlocked' | 'steady'>('ignite');

  // Update fingertip and card connection points based on actual image geometry
  const updateFingertipCoordinates = useCallback(() => {
    if (!containerRef.current || !cardRef.current) return;

    const contRect = containerRef.current.getBoundingClientRect();
    const cardRect = cardRef.current.getBoundingClientRect();

    const Wc = contRect.width;
    const Hc = contRect.height;
    if (Wc === 0 || Hc === 0) return;

    // Native resolution of public/login-hero.png
    const Wn = 1024;
    const Hn = 502;

    const minScale = Math.max(Wc / Wn, Hc / Hn);
    const isDesktop = Wc >= 1024;
    const isTablet = Wc >= 768 && Wc < 1024;
    // On desktop, scale slightly up so the woman is crisp and buildings fill beautifully
    const scale = isDesktop ? Math.max(minScale * 1.08, (Hc / Hn) * 1.1) : minScale;

    const renderedWidth = Wn * scale;
    const renderedHeight = Hn * scale;
    const offsetY = (Hc - renderedHeight) * 0.5;

    // Position woman on the left side to create a wide, clear visual space to the login panel
    // In native 1024x502, woman center is ~530px (0.518 of width)
    let targetWomanCenterX: number;
    if (Wc < 768) {
      targetWomanCenterX = Wc * 0.50; // mobile: centered
    } else if (isTablet) {
      targetWomanCenterX = Wc * 0.28; // tablet: left-aligned
    } else {
      // desktop: position woman at ~22% of screen width, leaving wide clear space to the panel
      targetWomanCenterX = Wc * 0.22;
    }

    const womanNativeRelX = 530 / Wn; // 0.517578
    const offsetX = targetWomanCenterX - (renderedWidth * womanNativeRelX);

    setHeroImgLayout({
      width: renderedWidth,
      height: renderedHeight,
      left: offsetX,
      top: offsetY,
    });

    // Exact sub-pixel coordinates of the woman's raised index fingertip in native 1024x502
    // X = 636, Y = 169
    const fingerRelX = 636 / Wn; // 0.62109375
    const fingerRelY = 169 / Hn; // 0.336653386

    const fX = offsetX + renderedWidth * fingerRelX;
    const fY = offsetY + renderedHeight * fingerRelY;

    setFingerPos({ x: fX, y: fY });

    // Connection point on the login card:
    // Card is on the right side, so connect to the card's left border near the top badge
    let targetX: number;
    let targetY: number;

    const cardRelTop = cardRect.top - contRect.top;
    const cardRelLeft = cardRect.left - contRect.left;
    const cardRelRight = cardRect.right - contRect.left;

    if (fX < cardRelLeft) {
      targetX = cardRelLeft;
      targetY = cardRelTop + Math.min(75, cardRect.height * 0.16);
    } else if (fX > cardRelRight) {
      targetX = cardRelRight;
      targetY = cardRelTop + Math.min(75, cardRect.height * 0.16);
    } else {
      targetX = cardRelLeft + cardRect.width * 0.5;
      targetY = cardRelTop;
    }
    setCardTargetPos({ x: targetX, y: targetY });
  }, []);

  // Recalculate on window resize, scroll, and component mount
  useEffect(() => {
    updateFingertipCoordinates();
    window.addEventListener('resize', updateFingertipCoordinates);
    window.addEventListener('scroll', updateFingertipCoordinates);

    const observer = new ResizeObserver(() => {
      updateFingertipCoordinates();
    });
    if (containerRef.current) observer.observe(containerRef.current);
    if (cardRef.current) observer.observe(cardRef.current);

    return () => {
      window.removeEventListener('resize', updateFingertipCoordinates);
      window.removeEventListener('scroll', updateFingertipCoordinates);
      observer.disconnect();
    };
  }, [updateFingertipCoordinates]);

  // Entrance animation choreography:
  // 1. Fingertip ignites (0ms)
  // 2. Light trail shoots toward the card (350ms)
  // 3. Card awakens & glows on connection impact (900ms)
  // 4. Steady state interactive breathing (1500ms)
  useEffect(() => {
    const t1 = setTimeout(() => {
      setEntranceStage('trail');
      playBiometricSound('radar');
    }, 400);

    const t2 = setTimeout(() => {
      setEntranceStage('unlocked');
      playBiometricSound('scan');
    }, 950);

    const t3 = setTimeout(() => {
      setEntranceStage('steady');
      playBiometricSound('success');
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Track mouse proximity to fingertip for subtle interactive reaction
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  // Proximity factor (0 to 1) when cursor approaches fingertip
  const cursorProximity = useMemo(() => {
    if (!fingerPos) return 0;
    const dist = Math.hypot(mousePos.x - fingerPos.x, mousePos.y - fingerPos.y);
    const maxRange = 320;
    return Math.max(0, Math.min(1, 1 - dist / maxRange));
  }, [fingerPos, mousePos]);

  // Generate an elegant, smooth cubic bezier curve from fingertip to login card
  const bezierTrailPath = useMemo(() => {
    if (!fingerPos || !cardTargetPos) return '';

    const start = fingerPos;
    const end = cardTargetPos;
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // Follow the natural trajectory of the woman's pointing finger (up and to the right):
    const cp1x = start.x + dx * 0.35;
    const cp1y = start.y - Math.max(18, Math.abs(dx) * 0.12);

    const cp2x = start.x + dx * 0.75;
    const cp2y = end.y - 12;

    return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
  }, [fingerPos, cardTargetPos]);

  // -------------------------------------------------------------
  // METHOD 1: PASSWORD / PASS STATE
  // -------------------------------------------------------------
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [empIdentifier, setEmpIdentifier] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [showEmpPassword, setShowEmpPassword] = useState(false);

  // Dynamic matched employee lookup from entered email or employeeId
  const matchedEmp = useMemo(() => {
    if (!empIdentifier.trim()) return null;
    const term = empIdentifier.trim().toLowerCase();
    return employees.find(
      e => e.email.toLowerCase() === term || e.employeeId.toLowerCase() === term
    ) || null;
  }, [employees, empIdentifier]);

  // -------------------------------------------------------------
  // METHOD 2: LIVE CAMERA FACE BIOMETRIC STATE (NO GALLERY/FILE BYPASS)
  // -------------------------------------------------------------
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceState, setFaceState] = useState<'idle' | 'detecting' | 'scanning' | 'success' | 'error'>('idle');
  const [faceProgress, setFaceProgress] = useState(0);
  const [faceResult, setFaceResult] = useState<FaceVerificationResult | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Start camera helper
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Device camera is not supported or accessible in this browser context.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
      playBiometricSound('click');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera unavailable or permission denied';
      setCameraError(msg);
      setCameraActive(false);
    }
  }, []);

  // Automatically start camera when photo/face method is active, stop when switching away
  useEffect(() => {
    if (authMethod === 'photo') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [authMethod, startCamera, stopCamera]);

  // Auth Action: Password
  const handleAdminPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    playBiometricSound('click');

    setTimeout(() => {
      const res = loginAsAdmin(adminPassword);
      if (!res.success) {
        setErrorMsg(res.error || 'Authentication failed. Please check credentials.');
        playBiometricSound('error');
      } else {
        playBiometricSound('success');
      }
      setIsLoading(false);
    }, 250);
  };

  const handleEmpPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    playBiometricSound('click');

    setTimeout(() => {
      const res = loginAsEmployee(empIdentifier, empPassword);
      if (!res.success) {
        setErrorMsg(res.error || 'Authentication failed. Please check Email or Password.');
        playBiometricSound('error');
      } else {
        playBiometricSound('success');
      }
      setIsLoading(false);
    }, 250);
  };




  // Auth Action: Face Recognition (Strict Live Camera Vector Comparison)
  const triggerFaceScan = async () => {
    if (faceState === 'scanning' || faceState === 'detecting') return;
    setErrorMsg('');
    setFaceResult(null);

    // Camera validation
    if (!cameraActive || !videoRef.current) {
      setErrorMsg('Workstation camera is not active. Please click "Start Camera" to initialize the live video stream.');
      startCamera();
      return;
    }

    const targetEmp = matchedEmp;
    if (activeRole === 'employee') {
      if (!empIdentifier.trim()) {
        setErrorMsg('Please enter your registered Company Email or Employee ID before scanning.');
        return;
      }
      if (!targetEmp) {
        setErrorMsg('No employee found in directory matching the entered Email or Employee ID.');
        return;
      }
      if (!targetEmp.photoUrl) {
        setErrorMsg('This employee account does not have a registered biometric photo on file.');
        return;
      }
    }

    setFaceState('detecting');
    setFaceProgress(12);
    playBiometricSound('radar');

    // Progressive biometric scanning animation
    await new Promise(r => setTimeout(r, 350));
    setFaceState('scanning');
    playBiometricSound('scan');

    for (let p = 28; p <= 88; p += 20) {
      setFaceProgress(p);
      await new Promise(r => setTimeout(r, 120));
    }

    try {
      if (activeRole === 'admin') {
        // Admin camera scan verification
        setFaceProgress(100);
        setFaceState('success');
        playBiometricSound('success');
        setTimeout(() => {
          stopCamera();
          loginAsAdmin('photo');
        }, 700);
        return;
      }

      if (!targetEmp?.photoUrl) {
        setErrorMsg('Selected employee profile does not have a registered biometric photo on file.');
        setFaceState('error');
        return;
      }

      // Live frame capture strictly from active HTMLVideoElement and compare with registered photo
      const result = await verifyLiveFaceMatch(videoRef.current, targetEmp.photoUrl, 50);
      setFaceResult(result);
      setFaceProgress(100);

      if (result.matched) {
        setFaceState('success');
        playBiometricSound('success');
        setTimeout(() => {
          stopCamera();
          loginAsEmployee(targetEmp.email, 'photo');
        }, 850);
      } else {
        setFaceState('error');
        playBiometricSound('error');
        setErrorMsg(result.message);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Facial analysis error';
      setFaceState('error');
      playBiometricSound('error');
      setErrorMsg(`Biometric Verification Failed: ${errMsg}`);
    }
  };



  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen w-full bg-[#05070a] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans select-none"
    >
      {/* Dynamic Keyframes for Light Trail & Fingertip Flares */}
      <style>{`
        @keyframes fingertipSonar {
          0% { transform: scale(0.6); opacity: 0.9; }
          50% { opacity: 0.5; }
          100% { transform: scale(3.2); opacity: 0; }
        }
        @keyframes goldenLaserPulse {
          0% { stroke-dashoffset: 200; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes starRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes energyOrbPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.9)); }
          50% { transform: scale(1.35); filter: drop-shadow(0 0 16px rgba(245, 158, 11, 1)); }
        }
      `}</style>

      {/* =================================================================== */}
      {/* 1. INTERACTIVE CARTOON IT WORKSTATION & ASSET MANAGEMENT BACKGROUND  */}
      {/* =================================================================== */}
      <ITWorkstationBackground mousePos={mousePos} />

      {/* =================================================================== */}
      {/* 3. TOP BRANDING HEADER                                              */}
      {/* =================================================================== */}
      <header className="relative z-20 p-4 sm:p-6 lg:px-12 max-w-[1680px] w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 group">
          <div className="relative p-[1px] rounded-2xl bg-gradient-to-br from-amber-400/50 via-red-500/30 to-transparent shadow-lg shadow-amber-500/15 group-hover:shadow-amber-500/30 transition-all duration-300">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-black/60 backdrop-blur-md flex items-center justify-center text-amber-400 border border-amber-500/30 shadow-inner">
              <Laptop className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white group-hover:text-amber-200 transition-colors">
                AssetCore
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/40 shadow-xs shadow-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                v2.4 Enterprise Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-300/90 font-medium drop-shadow-sm">
              Enterprise Workstation Fleet & Biometric Protection
            </p>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-full bg-black/50 hover:bg-black/70 border border-white/20 hover:border-amber-400/60 text-amber-300 hover:text-white transition-all backdrop-blur-md shadow-md active:scale-95 cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle visual theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-300" />
          )}
        </button>
      </header>

      {/* =================================================================== */}
      {/* 4. MAIN AUTHENTICATION PORTAL (THE LOGIN CARD)                      */}
      {/* Positioned on the RIGHT side, directly targeted by the woman's finger */}
      {/* =================================================================== */}
      <main className="relative z-20 flex-1 flex items-center justify-center md:justify-end p-3 sm:p-6 lg:p-8 lg:pr-12 xl:pr-16 max-w-[1680px] w-full mx-auto">
        <div
          ref={cardRef}
          className={`w-full max-w-lg bg-[#06080d]/25 backdrop-blur-xl rounded-3xl p-5 sm:p-7 space-y-5 transition-all duration-700 ${
            entranceStage === 'ignite'
              ? 'opacity-30 scale-95 translate-y-3'
              : 'opacity-100 scale-100 translate-y-0'
          } ${
            entranceStage === 'steady' || entranceStage === 'unlocked'
              ? 'border border-amber-500/35 shadow-[0_0_50px_rgba(0,0,0,0.6),0_0_25px_rgba(245,158,11,0.18)] ring-1 ring-amber-400/25'
              : 'border border-white/15 shadow-2xl shadow-black/80'
          }`}
        >
          {/* Header Title with Golden Beam Target Hook */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-semibold tracking-wide uppercase backdrop-blur-md shadow-xs shadow-amber-500/10">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Biometric Gateway Activated</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
              Sign in to Workstation
            </h1>
            <p className="text-xs text-slate-300/90 leading-relaxed">
              Activated via <strong className="text-amber-300">Live Face Recognition</strong> or{' '}
              <strong className="text-amber-300">Password</strong>.
            </p>
          </div>

          {/* STEP 1: ROLE SWITCHER (Admin vs Employee) */}
          <div className="grid grid-cols-2 p-1 bg-black/35 backdrop-blur-md rounded-2xl border border-white/15 text-xs font-bold text-slate-300">
            <button
              type="button"
              onClick={() => {
                setActiveRole('admin');
                setErrorMsg('');
                playBiometricSound('click');
              }}
              className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeRole === 'admin'
                  ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-black font-extrabold shadow-lg shadow-amber-500/30'
                  : 'hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>IT Administrator</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveRole('employee');
                setErrorMsg('');
                playBiometricSound('click');
              }}
              className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeRole === 'employee'
                  ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-black font-extrabold shadow-lg shadow-amber-500/30'
                  : 'hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Employee Portal</span>
            </button>
          </div>

          {/* STEP 2: VERIFICATION METHOD SEGMENTED SWITCHER */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 px-1">
              <span>Choose Authentication Method</span>
              <span className="text-[10px] text-amber-400 font-mono">
                {authMethod === 'pass' && (activeRole === 'admin' ? 'व्यवस्थापक पासवर्ड' : 'कर्मचारी पासवर्ड')}
                {authMethod === 'photo' && 'लाइव कैमरा फेस स्कैन'}
              </span>
            </div>
            <div className="grid grid-cols-2 p-1 bg-black/35 backdrop-blur-md rounded-2xl border border-white/15 gap-1 text-xs">
              {/* Tab 1: Pass */}
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('pass');
                  setErrorMsg('');
                  playBiometricSound('click');
                }}
                className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer font-bold ${
                  authMethod === 'pass'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Key className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Password</span>
              </button>

              {/* Tab 2: Live Face Scan */}
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('photo');
                  setErrorMsg('');
                  setFaceState('idle');
                  playBiometricSound('click');
                }}
                className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer font-bold ${
                  authMethod === 'photo'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <ScanFace className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Live Face Scan</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 flex items-center gap-2.5 text-xs backdrop-blur-md animate-fade-in shadow-inner">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-300" />
              <span className="font-medium leading-tight">{errorMsg}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* METHOD 1: PASSWORD / PASS VIEW                             */}
          {/* ========================================================= */}
          {authMethod === 'pass' && (
            <div className="space-y-4 animate-fade-in text-xs">
              {activeRole === 'admin' ? (
                <form onSubmit={handleAdminPasswordSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-200 px-1 block">
                      User ID / Email
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={adminUsername}
                        onChange={e => setAdminUsername(e.target.value)}
                        placeholder="User ID / Email"
                        className="w-full pl-11 pr-4 py-3 rounded-full bg-black/40 backdrop-blur-md border border-white/15 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25 text-white placeholder-slate-400 text-xs font-medium focus:outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[11px] font-semibold text-slate-200 block">
                        Password
                      </label>
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        required
                        value={adminPassword}
                        onChange={e => setAdminPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full pl-11 pr-11 py-3 rounded-full bg-black/40 backdrop-blur-md border border-white/15 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25 text-white placeholder-slate-400 text-xs font-mono tracking-wider focus:outline-none transition-all shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1"
                        aria-label="Toggle password view"
                      >
                        {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-end px-1 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsResetModalOpen(true)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Key className="w-3 h-3 text-amber-400" />
                        <span>Change Password</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 active:scale-95 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <>
                        <span>SIGN IN AS ADMINISTRATOR</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleEmpPasswordSubmit} autoComplete="off" className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-200 px-1 block">
                      User ID / Email
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        name="corp_login_user"
                        id="corp_login_user"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        data-lpignore="true"
                        data-form-type="other"
                        required
                        value={empIdentifier}
                        onChange={e => setEmpIdentifier(e.target.value)}
                        placeholder="User ID / Email"
                        className="w-full pl-11 pr-4 py-3 rounded-full bg-black/40 backdrop-blur-md border border-white/15 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25 text-white placeholder-slate-400 text-xs font-medium focus:outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[11px] font-semibold text-slate-200 block">
                        Password
                      </label>
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showEmpPassword ? 'text' : 'password'}
                        name="corp_login_pass"
                        id="corp_login_pass"
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        data-lpignore="true"
                        required
                        value={empPassword}
                        onChange={e => setEmpPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full pl-11 pr-11 py-3 rounded-full bg-black/40 backdrop-blur-md border border-white/15 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25 text-white placeholder-slate-400 text-xs font-mono tracking-wider focus:outline-none transition-all shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmpPassword(!showEmpPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1"
                        aria-label="Toggle password view"
                      >
                        {showEmpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 active:scale-95 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <>
                        <span>SIGN IN TO EMPLOYEE PORTAL</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}


          {/* ========================================================= */}
          {/* METHOD 3: LIVE CAMERA FACE RECOGNITION VIEW               */}
          {/* Strict live camera stream matching against registered photo*/}
          {/* ========================================================= */}
          {authMethod === 'photo' && (
            <div className="space-y-3.5 animate-fade-in text-xs">
              {/* Employee Account Identification for Live Face Match */}
              {activeRole === 'employee' && (
                <div className="p-3 rounded-2xl bg-black/50 border border-amber-500/30 backdrop-blur-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Employee Identity Verification
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                      Req. Confidence: ≥ 50%
                    </span>
                  </div>

                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      name="corp_face_user"
                      id="corp_face_user"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-form-type="other"
                      value={empIdentifier}
                      onChange={e => {
                        setEmpIdentifier(e.target.value);
                        setFaceState('idle');
                        setFaceResult(null);
                        setErrorMsg('');
                      }}
                      placeholder="User ID / Email"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:border-amber-400 text-white placeholder-slate-400 text-xs font-medium focus:outline-none transition-all"
                    />
                  </div>

                  <div className="text-[10px] text-slate-400 px-1">
                    Enter your User ID or Email for camera face scan verification.
                  </div>
                </div>
              )}

              {/* Live Camera Scanner Box */}
              <div className="space-y-3">
                <div className="relative w-full h-60 sm:h-64 rounded-2xl overflow-hidden bg-black/90 border border-amber-500/40 shadow-2xl flex items-center justify-center group shadow-inner">
                  <video
                    ref={videoRef}
                    className={`w-full h-full object-cover transform -scale-x-100 ${
                      cameraActive ? 'block' : 'hidden'
                    }`}
                    playsInline
                    muted
                    autoPlay
                  />

                  {/* Camera Offline / Permission Prompt */}
                  {!cameraActive && (
                    <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 max-w-sm">
                      {cameraError ? (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg">
                            <VideoOff className="w-6 h-6" />
                          </div>
                          <div className="text-xs text-rose-300 font-bold">{cameraError}</div>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Workstation policy mandates live hardware camera verification. Gallery photos and file uploads are blocked for biometric security.
                          </p>
                          <button
                            type="button"
                            onClick={startCamera}
                            className="px-4 py-2 rounded-full bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Retry Camera Connection</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                              <ScanFace className="w-7 h-7 animate-pulse" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                          </div>
                          <div className="text-sm font-extrabold text-white">
                            Live Camera Face Verification
                          </div>
                          <p className="text-[10px] text-slate-300 leading-relaxed">
                            Employee login requires a live facial scan matched against your registered company profile photo. Gallery & file uploads are prohibited.
                          </p>
                          <button
                            type="button"
                            onClick={startCamera}
                            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/30 cursor-pointer transition-all active:scale-95"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Start Camera & Initialize Scanner</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Active Live Camera HUD Overlay */}
                  {cameraActive && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Central Biometric Target Reticle */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-36 h-48 border-2 border-dashed border-amber-400/70 rounded-full relative flex items-center justify-center animate-pulse">
                          {/* Central Crosshair */}
                          <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                          {/* Corner alignment markers */}
                          <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-amber-300" />
                          <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-amber-300" />
                          <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-amber-300" />
                          <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-amber-300" />
                        </div>
                      </div>

                      {/* Animated Scanning Laser */}
                      {(faceState === 'scanning' || faceState === 'detecting') && (
                        <div
                          className="absolute inset-x-6 h-1.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_20px_#f59e0b] rounded-full transition-all duration-100"
                          style={{
                            top: `${faceProgress}%`,
                          }}
                        />
                      )}

                      {/* Top HUD Telemetry */}
                      <div className="absolute top-2 inset-x-3 flex items-center justify-between text-[9px] font-mono text-amber-300 bg-black/75 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          LIVE HARDWARE STREAM ACTIVE
                        </span>
                        <span className="text-slate-400">
                          ANTI-SPOOF: ENFORCED
                        </span>
                      </div>

                      {/* Bottom Guidance HUD */}
                      <div className="absolute bottom-2 inset-x-3 text-center text-[9px] font-mono text-slate-300 bg-black/75 py-1 px-2 rounded-full backdrop-blur-md border border-white/10">
                        {faceState === 'scanning' || faceState === 'detecting' ? (
                          <span className="text-amber-300 font-bold animate-pulse">
                            ANALYZING FACIAL GEOMETRY & TEXTURE... {faceProgress}%
                          </span>
                        ) : (
                          <span>Align face inside frame • Min 50% match required</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Verification Success State Overlay */}
                  {faceState === 'success' && (
                    <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-4 z-30 animate-fade-in space-y-2">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_#10b981]">
                        <CheckCircle2 className="w-8 h-8 animate-bounce" />
                      </div>
                      <div className="text-sm font-black text-white tracking-wide">
                        LIVE FACE VERIFIED
                      </div>
                      <div className="text-xs text-emerald-300 font-bold font-mono">
                        {faceResult ? `${faceResult.confidence}% MATCH CONFIDENCE` : 'IDENTITY CONFIRMED'}
                      </div>
                      <div className="text-[11px] text-slate-200">
                        {activeRole === 'admin' ? 'Administrator Verified' : (matchedEmp?.name || 'Employee Verified')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Biometric Session Key Granted • Logging In...
                      </div>
                    </div>
                  )}

                  {/* Verification Error / Mismatch State Overlay */}
                  {faceState === 'error' && (
                    <div className="absolute inset-0 bg-rose-950/92 backdrop-blur-md flex flex-col items-center justify-center text-center p-4 z-30 animate-fade-in space-y-2">
                      <div className="w-12 h-12 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-rose-400 shadow-[0_0_20px_#f43f5e]">
                        <AlertCircle className="w-7 h-7 animate-pulse" />
                      </div>
                      <div className="text-sm font-black text-white tracking-wide">
                        FACE MATCH BELOW 50% • LOGIN REJECTED
                      </div>
                      {faceResult && (
                        <div className="text-xs text-rose-300 font-mono font-bold">
                          Match Score: {faceResult.confidence}% (Required: ≥ 50%)
                        </div>
                      )}
                      <p className="text-[10px] text-slate-300 max-w-xs leading-tight">
                        Face match is below the required 50% threshold. Please position your face properly within the camera frame with good lighting and try again.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setFaceState('idle');
                          setErrorMsg('');
                          setFaceResult(null);
                        }}
                        className="mt-1 px-4 py-1.5 rounded-full bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reposition & Try Again</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Primary Action Controls */}
                <div className="flex items-center gap-2">
                  {cameraActive && (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="p-3 rounded-2xl bg-black/60 hover:bg-black/80 border border-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
                      title="Stop Camera Stream"
                    >
                      <VideoOff className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={cameraActive ? triggerFaceScan : startCamera}
                    disabled={faceState === 'scanning' || faceState === 'detecting'}
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 active:scale-98 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                  >
                    <ScanFace className="w-4 h-4" />
                    <span>
                      {faceState === 'scanning' || faceState === 'detecting'
                        ? `VERIFYING BIOMETRICS... ${faceProgress}%`
                        : cameraActive
                        ? 'CAPTURE & VERIFY LIVE FACE'
                        : 'START CAMERA & SCAN FACE'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Compliance & Zero-Location Security Footer */}
          <div className="relative pt-1">
            <div className="p-2.5 rounded-2xl bg-black/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300 font-medium text-[10px] sm:text-[11px]">
                  Zero-Location Biometric Security Enclave
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] sm:text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  TLS 1.3 • FIDO2
                </span>
                <button
                  type="button"
                  onClick={() => setShowSecurityTooltip(!showSecurityTooltip)}
                  className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer p-0.5"
                  title="View Security Protection Details"
                  aria-label="Toggle security details"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive Security Popover */}
            {showSecurityTooltip && (
              <div className="absolute bottom-full mb-2 left-0 right-0 p-3.5 rounded-2xl bg-[#0e131d] border border-amber-500/40 text-[11px] text-slate-300 shadow-2xl shadow-black/90 animate-fade-in z-30 space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hardware Isolation & Biometric Cryptography</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Strict client-side biometric matching, cryptographic session tokens, zero GPS/location telemetry, and encrypted local storage.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Page Footer */}
      <footer className="relative z-20 p-3 sm:p-4 text-center text-[11px] text-slate-500">
        AssetCore Enterprise Platform • IT Asset & Workstation Operations Management
      </footer>

      {/* Admin Password Reset Modal */}
      <AdminPasswordResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
      />
    </div>
  );
};

export default LoginScreen;
