import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, X, RefreshCw, Check, Sparkles, Video, VideoOff, AlertCircle, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { EmployeeStatus } from '../../types';

interface EmployeeAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  status?: EmployeeStatus;
  showStatusDot?: boolean;
  editable?: boolean;
  onPhotoChange?: (newPhotoUrl: string) => void;
  onPhotoRemove?: () => void;
}

// Preset corporate portrait avatars for quick selection
export const CORPORATE_AVATAR_PRESETS = [
  {
    id: 'male-1',
    label: 'Professional 1 (Male)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=face',
  },
  {
    id: 'female-1',
    label: 'Professional 2 (Female)',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=face',
  },
  {
    id: 'male-2',
    label: 'Professional 3 (Male)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=face',
  },
  {
    id: 'female-2',
    label: 'Professional 4 (Female)',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&h=256&fit=crop&crop=face',
  },
  {
    id: 'male-3',
    label: 'Professional 5 (Male)',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&crop=face',
  },
  {
    id: 'female-3',
    label: 'Professional 6 (Female)',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=256&h=256&fit=crop&crop=face',
  },
];

export const EmployeeAvatar: React.FC<EmployeeAvatarProps> = ({
  name,
  photoUrl,
  size = 'md',
  className = '',
  status,
  showStatusDot = false,
  editable = false,
  onPhotoChange,
  onPhotoRemove,
}) => {
  const [imgError, setImgError] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'preset'>('camera');
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Camera state for Biometric Photo Capture
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Extract up to 2 uppercase initials
  const initials = name
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'EM';

  // Deterministic palette based on name string
  const getAvatarColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'bg-blue-600 text-white dark:bg-blue-600',
      'bg-emerald-600 text-white dark:bg-emerald-600',
      'bg-indigo-600 text-white dark:bg-indigo-600',
      'bg-violet-600 text-white dark:bg-violet-600',
      'bg-amber-600 text-white dark:bg-amber-600',
      'bg-cyan-600 text-white dark:bg-cyan-600',
      'bg-rose-600 text-white dark:bg-rose-600',
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px] rounded-md',
    sm: 'w-8 h-8 text-xs rounded-lg',
    md: 'w-10 h-10 text-xs rounded-xl',
    lg: 'w-12 h-12 text-sm rounded-xl',
    xl: 'w-16 h-16 text-lg rounded-2xl',
    '2xl': 'w-20 h-20 sm:w-24 sm:h-24 text-2xl rounded-2xl',
  }[size];

  const dotSizeClasses = {
    xs: 'w-1.5 h-1.5 bottom-0 right-0',
    sm: 'w-2 h-2 bottom-0 right-0',
    md: 'w-2.5 h-2.5 bottom-0 right-0 ring-2 ring-white dark:ring-[#101726]',
    lg: 'w-3 h-3 bottom-0.5 right-0.5 ring-2 ring-white dark:ring-[#101726]',
    xl: 'w-3.5 h-3.5 bottom-1 right-1 ring-2 ring-white dark:ring-[#101726]',
    '2xl': 'w-4 h-4 bottom-1 right-1 ring-3 ring-white dark:ring-[#101726]',
  }[size];

  const statusColors: Record<string, string> = {
    Active: 'bg-emerald-500',
    'On Probation': 'bg-amber-400',
    'On Leave': 'bg-blue-400',
    Contractual: 'bg-purple-400',
    Inactive: 'bg-amber-500',
    Resigned: 'bg-slate-400',
  };

  // Start live device camera for real biometric face capture
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCapturedPreview(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera access permission denied';
      setCameraError(msg);
      setIsCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Cleanup camera stream when modal closes or unmounts
  useEffect(() => {
    if (showPickerModal && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [showPickerModal, activeTab, startCamera, stopCamera]);

  // Capture current live frame from camera canvas
  const handleSnapLivePhoto = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const vw = video.videoWidth || video.clientWidth || 480;
    const vh = video.videoHeight || video.clientHeight || 480;

    const canvas = document.createElement('canvas');
    const size = 320; // High resolution square biometric profile photo
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    // Square crop centered
    const crop = Math.min(vw, vh);
    const sx = (vw - crop) / 2;
    const sy = (vh - crop) / 2;

    // Mirror image for natural user preview
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, crop, crop, 0, 0, size, size);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedPreview(dataUrl);
    setIsCapturing(false);
    stopCamera();
  };

  const handleConfirmCapturedPhoto = () => {
    if (capturedPreview && onPhotoChange) {
      setImgError(false);
      onPhotoChange(capturedPreview);
      setShowPickerModal(false);
      setCapturedPreview(null);
    }
  };

  const handleRetakePhoto = () => {
    setCapturedPreview(null);
    startCamera();
  };

  // Handle local file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert('Photo file size should be less than 3 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (result && onPhotoChange) {
        setImgError(false);
        onPhotoChange(result);
        setShowPickerModal(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    if (onPhotoChange) {
      setImgError(false);
      onPhotoChange(urlInput.trim());
      setUrlInput('');
      setShowPickerModal(false);
    }
  };

  const handleSelectPreset = (url: string) => {
    if (onPhotoChange) {
      setImgError(false);
      onPhotoChange(url);
      setShowPickerModal(false);
    }
  };

  const hasValidPhoto = photoUrl && !imgError;

  return (
    <div className="relative inline-block shrink-0">
      <div
        className={`relative overflow-hidden flex items-center justify-center font-bold tracking-tight select-none shadow-xs border border-slate-200/80 dark:border-slate-700/80 transition-transform ${sizeClasses} ${className} ${
          !hasValidPhoto ? getAvatarColor(name) : 'bg-slate-100 dark:bg-slate-800'
        }`}
      >
        {hasValidPhoto ? (
          <img
            src={photoUrl}
            alt={name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <span>{initials}</span>
        )}

        {/* Editable Camera Overlay */}
        {editable && (
          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              setShowPickerModal(true);
            }}
            className="absolute inset-0 bg-slate-950/70 hover:bg-slate-950/80 text-white flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-all cursor-pointer z-10 backdrop-blur-[2px]"
            title="Update employee photo & biometric face scan"
          >
            <Camera className="w-5 h-5 text-white drop-shadow-md animate-pulse" />
            {(size === 'xl' || size === '2xl') && (
              <span className="text-[9px] font-bold tracking-wider uppercase mt-1 text-center px-1 leading-tight">
                Update Photo
              </span>
            )}
          </button>
        )}
      </div>

      {/* Status Dot */}
      {showStatusDot && status && (
        <span
          className={`absolute rounded-full ${dotSizeClasses} ${statusColors[status] || 'bg-slate-400'}`}
          title={`Status: ${status}`}
        />
      )}

      {/* Hidden File Input for local file upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/jpg"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Profile Photo & Biometrics Modal */}
      {showPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-[#1e293b] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 text-slate-900 dark:text-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Profile Photo & Face Biometrics</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      Face Auth Reference
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Register employee portrait for workstation live face login and company directory
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setShowPickerModal(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Active Preview Bar */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center font-bold text-base shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs ${
                    hasValidPhoto ? '' : getAvatarColor(name)
                  }`}
                >
                  {hasValidPhoto ? (
                    <img
                      src={photoUrl!}
                      alt={name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">{name}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    {hasValidPhoto ? 'Biometric reference photo registered' : 'No custom photo on file (monogram active)'}
                  </p>
                </div>
              </div>

              {hasValidPhoto && onPhotoRemove && (
                <button
                  type="button"
                  onClick={() => {
                    onPhotoRemove();
                    setShowPickerModal(false);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg transition-colors cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Tabs Selector */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('camera');
                  setCapturedPreview(null);
                }}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'camera'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Live Camera (Biometric)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setActiveTab('upload');
                }}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setActiveTab('preset');
                }}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'preset'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Presets & URL</span>
              </button>
            </div>

            {/* TAB 1: LIVE CAMERA CAPTURE */}
            {activeTab === 'camera' && (
              <div className="space-y-3 animate-fade-in">
                {!capturedPreview ? (
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-800 shadow-inner">
                    {/* Live Camera Stream */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover transform -scale-x-100 ${
                        isCameraActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    />

                    {/* Camera Offline / Permission Error */}
                    {(!isCameraActive || cameraError) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-950">
                        <VideoOff className="w-10 h-10 text-slate-500 mb-2" />
                        <p className="text-xs font-semibold text-slate-300">
                          {cameraError || 'Camera initializing or permission needed...'}
                        </p>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="mt-3 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry Camera Access</span>
                        </button>
                      </div>
                    )}

                    {/* Biometric Framing Guide & Target Overlay */}
                    {isCameraActive && !cameraError && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                        {/* Oval face boundary */}
                        <div className="w-44 h-56 rounded-[48%] border-2 border-dashed border-blue-400/80 shadow-[0_0_25px_rgba(59,130,246,0.3)] animate-pulse flex items-center justify-center relative">
                          <div className="absolute top-2 w-3 h-3 border-t-2 border-l-2 border-blue-400" />
                          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-blue-400" />
                          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-blue-400" />
                          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-blue-400" />
                          <span className="text-[10px] font-bold text-blue-300 tracking-wider uppercase bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-500/30">
                            Center Face
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Captured Snapshot Preview */
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border-2 border-emerald-500/50 shadow-xl">
                    <img
                      src={capturedPreview}
                      alt="Captured Biometric Portrait"
                      className="w-full h-full object-contain bg-slate-950"
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md">
                      <Check className="w-3.5 h-3.5" />
                      <span>Ready for Registration</span>
                    </div>
                  </div>
                )}

                {/* Camera Actions */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  {!capturedPreview ? (
                    <>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                        Good lighting ensures instant face authentication
                      </span>

                      <button
                        type="button"
                        onClick={handleSnapLivePhoto}
                        disabled={!isCameraActive || isCapturing}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{isCapturing ? 'Capturing...' : 'Capture Photo'}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleRetakePhoto}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retake</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleConfirmCapturedPhoto}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Register as Biometric Face</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: UPLOAD IMAGE FILE */}
            {activeTab === 'upload' && (
              <div className="space-y-3 animate-fade-in">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 px-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer group"
                >
                  <div className="p-3 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white block">
                      Choose Photo from Device
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                      Supports PNG, JPG, or WEBP (Max 3 MB)
                    </span>
                  </div>
                </button>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                  <span>
                    <strong>Biometric Note:</strong> Ensure your face is clearly visible, forward-facing, and unobstructed so the system can verify your identity during live workstation face login.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 3: PRESETS & WEB URL */}
            {activeTab === 'preset' && (
              <div className="space-y-3 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Corporate Avatar Presets
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {CORPORATE_AVATAR_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.url)}
                        className="w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all cursor-pointer group"
                        title={preset.label}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleUrlSubmit} className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Direct Image Web URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!urlInput.trim()}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Changes take effect across the entire enterprise database immediately
              </span>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setShowPickerModal(false);
                }}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
