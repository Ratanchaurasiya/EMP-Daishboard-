import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, MessageSquare, KeyRound, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, Loader2, RefreshCw, X } from 'lucide-react';

interface AdminPasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPasswordResetModal: React.FC<AdminPasswordResetModalProps> = ({ isOpen, onClose }) => {
  const { requestAdminOtpViaWhatsApp, verifyAdminOtp, changeAdminPasswordWithOtp, showToast } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);

  // Timer countdown for OTP (5 minutes = 300 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(300);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      setStep(1);
      setOtpInput('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setInfoMsg('');
      setIsLoading(false);
      setVerifiedToken(null);
      setTimeLeft(300);
    }
  }, [isOpen]);

  // Countdown timer effect during Step 2
  useEffect(() => {
    let interval: any = null;
    if (isOpen && step === 2 && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, step, timeLeft]);

  if (!isOpen) return null;

  const handleSendOtp = () => {
    setErrorMsg('');
    setInfoMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const result = requestAdminOtpViaWhatsApp();
      setIsLoading(false);

      if (result.success && result.whatsappUrl) {
        // Open WhatsApp web/app link to deliver OTP
        window.open(result.whatsappUrl, '_blank');
        setInfoMsg('OTP sent to WhatsApp recovery number (+91 63900 *****). Please check WhatsApp for your 6-digit verification code.');
        setStep(2);
        setTimeLeft(300);
      } else {
        setErrorMsg(result.message || 'Failed to send OTP via WhatsApp.');
      }
    }, 400);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!otpInput.trim() || otpInput.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-digit OTP code.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = verifyAdminOtp(otpInput.trim());
      setIsLoading(false);

      if (result.success && result.verifiedToken) {
        setVerifiedToken(result.verifiedToken);
        setInfoMsg(result.message || 'OTP verified successfully! Please enter your new password.');
        setStep(3);
      } else {
        setErrorMsg(result.message || result.error || 'OTP verification failed.');
      }
    }, 400);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword) {
      setErrorMsg('Please enter a new password.');
      return;
    }
    if (newPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation password do not match.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = changeAdminPasswordWithOtp(otpInput.trim(), newPassword);
      setIsLoading(false);

      if (result.success) {
        showToast(result.message || 'Admin password changed successfully!', 'success');
        onClose();
      } else {
        setErrorMsg(result.message || result.error || 'Failed to change password.');
      }
    }, 400);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Admin Password Reset</h3>
              <p className="text-xs text-emerald-100 font-medium">WhatsApp OTP Security Verification</p>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center justify-between mt-5 px-4 pt-2 border-t border-white/15">
            <div className="flex items-center space-x-2">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${step >= 1 ? 'bg-white text-emerald-700' : 'bg-white/20 text-white'}`}>
                1
              </span>
              <span className="text-xs font-medium text-white/90">Send OTP</span>
            </div>
            <div className={`h-0.5 flex-1 mx-2 ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
            <div className="flex items-center space-x-2">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${step >= 2 ? 'bg-white text-emerald-700' : 'bg-white/20 text-white'}`}>
                2
              </span>
              <span className="text-xs font-medium text-white/90">Verify OTP</span>
            </div>
            <div className={`h-0.5 flex-1 mx-2 ${step >= 3 ? 'bg-white' : 'bg-white/30'}`} />
            <div className="flex items-center space-x-2">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${step >= 3 ? 'bg-white text-emerald-700' : 'bg-white/20 text-white'}`}>
                3
              </span>
              <span className="text-xs font-medium text-white/90">New Password</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Info Message */}
          {infoMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span className="font-medium">{infoMsg}</span>
            </div>
          )}

          {/* STEP 1: Request OTP */}
          {step === 1 && (
            <div className="space-y-5 text-center py-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/50">
                <MessageSquare className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  Request WhatsApp Security OTP
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Click below to generate a 6-digit secure verification code sent directly to the Admin WhatsApp recovery contact:
                </p>
                <div className="mt-3 inline-flex items-center space-x-2 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">
                  <span>+91 63900 *****</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating OTP...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      <span>Send OTP via WhatsApp</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Verify OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enter 6-Digit WhatsApp OTP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span>OTP Expires in: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatTime(timeLeft)}</strong></span>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend OTP</span>
                </button>
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-xs transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || otpInput.length !== 6 || timeLeft === 0}
                  className="w-2/3 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify OTP</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Change Password */}
          {step === 3 && (
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Admin Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Admin Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !newPassword || newPassword !== confirmPassword}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save & Change Admin Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
