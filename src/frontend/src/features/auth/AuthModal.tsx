import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, AlertCircle, Shield, KeyRound, CheckCircle2, Sparkles, Send } from 'lucide-react';
import { authService } from '../../services/authService';
import { User } from '../../types/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // OTP state
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [codeSuccessMessage, setCodeSuccessMessage] = useState<string | null>(null);

  // Form submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cooldown countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!isOpen) return null;

  const handleSendCode = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Vui lòng nhập địa chỉ Gmail hoặc Email hợp lệ để nhận mã xác nhận.');
      return;
    }

    setSendingCode(true);
    setError(null);
    setCodeSuccessMessage(null);

    try {
      const res = await authService.sendVerificationCode(email.trim());
      setCodeSent(true);
      setSimulatedCode(res.simulatedCode || null);
      setCountdown(60);
      setCodeSuccessMessage(res.message || 'Mã xác thực đã được gửi tới Gmail của bạn.');
    } catch (err: any) {
      setError(err.message || 'Không thể gửi mã xác nhận. Vui lòng thử lại.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        if (!verificationCode.trim()) {
          setError('Vui lòng nhập mã xác thực 6 số gửi tới Gmail của bạn.');
          setLoading(false);
          return;
        }

        const res = await authService.register({
          name: name.trim(),
          email: email.trim(),
          password,
          verificationCode: verificationCode.trim()
        });
        onLoginSuccess(res.user);
      } else {
        const res = await authService.login({ email: email.trim(), password });
        onLoginSuccess(res.user);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Xác thực không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.login({ email: demoEmail, password: demoPass });
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Đăng nhập demo thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsRegister(!isRegister);
    setError(null);
    setCodeSuccessMessage(null);
    setCodeSent(false);
    setSimulatedCode(null);
    setVerificationCode('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-white/10 rounded-3xl max-w-md w-full p-8 shadow-2xl relative text-left text-white animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#DFB15B]">
            {isRegister ? 'GMAIL VERIFIED REGISTRATION' : 'AUTHENTICATION'}
          </span>
          <h2 className="text-2xl font-black text-white mt-1">
            {isRegister ? 'Đăng Ký Tài Khoản' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {isRegister
              ? 'Đăng ký tài khoản RideLux và xác thực mã OTP qua Gmail an toàn.'
              : 'Đăng nhập để đặt xe và quản lý lịch sử đơn thuê xe của bạn.'}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Code Sent success notification */}
        {codeSuccessMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{codeSuccessMessage}</span>
          </div>
        )}

        {/* Simulated Code Helper Badge (Dev/Testing UX) */}
        {simulatedCode && isRegister && (
          <div className="mb-4 p-3 rounded-2xl bg-[#DFB15B]/10 border border-[#DFB15B]/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#DFB15B] shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Mã xác thực gửi tới Gmail:</span>
                <span className="font-mono font-black text-[#DFB15B] text-sm tracking-widest">{simulatedCode}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setVerificationCode(simulatedCode)}
              className="px-2.5 py-1 rounded-lg bg-[#DFB15B] hover:bg-[#c99f52] text-black text-[11px] font-bold cursor-pointer transition-all"
            >
              Tự động điền mã
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field (Register only) */}
          {isRegister && (
            <div>
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                Họ và Tên
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white placeholder-neutral-600 outline-none focus:border-[#DFB15B] transition-colors"
                />
                <UserIcon className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
              </div>
            </div>
          )}

          {/* Email / Gmail Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                {isRegister ? 'Gmail / Địa Chỉ Email' : 'Email Address'}
              </label>

              {/* Send OTP button directly in header when in Register mode */}
              {isRegister && (
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode || countdown > 0 || !email}
                  className="text-[11px] text-[#DFB15B] hover:text-[#c99f52] font-bold disabled:text-neutral-600 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Send className="w-3 h-3" />
                  {sendingCode
                    ? 'Đang gửi...'
                    : countdown > 0
                    ? `Gửi lại sau (${countdown}s)`
                    : codeSent
                    ? 'Gửi lại mã OTP'
                    : 'Gửi mã xác nhận Gmail'}
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tenban@gmail.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white placeholder-neutral-600 outline-none focus:border-[#DFB15B] transition-colors"
              />
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Verification Code OTP Field (Register only) */}
          {isRegister && (
            <div>
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                Mã Xác Thực 6 Số (Gmail OTP)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nhập 6 số (VD: 512171)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-900 border border-white/10 text-xs font-mono font-bold tracking-widest text-[#DFB15B] placeholder-neutral-600 outline-none focus:border-[#DFB15B] transition-colors"
                />
                <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">
                Nhấn "Gửi mã xác nhận Gmail" ở trên để nhận mã 6 số vào hộp thư đến.
              </p>
            </div>
          )}

          {/* Password Field */}
          <div>
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
              Mật Khẩu
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white placeholder-neutral-600 outline-none focus:border-[#DFB15B] transition-colors"
              />
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#DFB15B] hover:bg-[#c99f52] text-black font-extrabold text-xs tracking-wider uppercase transition-all shadow-lg shadow-[#DFB15B]/20 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading
              ? 'Đang xử lý...'
              : isRegister
              ? 'Xác Thực Gmail & Đăng Ký'
              : 'Đăng Nhập'}
          </button>
        </form>

        {/* 1-Click Demo Buttons (Login Mode Only) */}
        {!isRegister && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold mb-2.5 text-center">
              Đăng Nhập Nhanh Tài Khoản Mẫu (1-Click)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('customer@rentcar.com', 'Customer@123')}
                className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-[11px] font-medium text-neutral-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-[#DFB15B]" />
                Demo Customer
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@rentcar.com', 'Admin@123')}
                className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-[11px] font-medium text-emerald-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Demo Admin
              </button>
            </div>
          </div>
        )}

        {/* Toggle Login / Register */}
        <div className="mt-6 text-center">
          <button
            onClick={handleToggleMode}
            className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            {isRegister
              ? 'Đã có tài khoản? Đăng nhập ngay'
              : 'Chưa có tài khoản? Đăng ký xác thực qua Gmail'}
          </button>
        </div>
      </div>
    </div>
  );
};
