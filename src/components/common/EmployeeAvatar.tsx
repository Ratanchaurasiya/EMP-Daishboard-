import React, { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
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
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Handle local file upload (converts to Base64 data URL)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    // Limit size to 2MB to keep LocalStorage lightweight
    if (file.size > 2.5 * 1024 * 1024) {
      alert('Photo file size should be less than 2.5 MB.');
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
            onClick={() => setShowPickerModal(true)}
            className="absolute inset-0 bg-slate-900/60 text-white flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer z-10 backdrop-blur-[1px]"
            title="Change employee photo"
          >
            <Camera className="w-5 h-5 text-white drop-shadow-sm" />
            {size === '2xl' && (
              <span className="text-[10px] font-semibold tracking-wider uppercase mt-1">
                Change Photo
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

      {/* Photo Picker Modal */}
      {showPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-[#1e293b] rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 text-slate-900 dark:text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Update Employee Photo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPickerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Preview */}
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <div
                className={`w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center font-bold text-lg shrink-0 border border-slate-200 dark:border-slate-700 ${
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
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {hasValidPhoto ? 'Custom photo currently active' : 'Default initials monogram active'}
                </p>
                {hasValidPhoto && onPhotoRemove && (
                  <button
                    type="button"
                    onClick={() => {
                      onPhotoRemove();
                      setShowPickerModal(false);
                    }}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-500 mt-1 cursor-pointer"
                  >
                    Remove Custom Photo
                  </button>
                )}
              </div>
            </div>

            {/* Option 1: Upload from Computer */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Option 1: Upload from Device
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-blue-500" />
                <span>Choose Image File (PNG, JPG, WEBP)</span>
              </button>
            </div>

            {/* Option 2: Choose from Corporate Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Option 2: Select Corporate Preset
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

            {/* Option 3: Image URL */}
            <form onSubmit={handleUrlSubmit} className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Option 3: Enter Image Web URL
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

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPickerModal(false)}
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
