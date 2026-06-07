import React, { useState } from "react";
import { Lock, Eye, EyeOff, AlertTriangle, KeyRound } from "lucide-react";

interface PasswordModalProps {
  title: string;
  description: string;
  placeholder?: string;
  onConfirm: (password: string) => Promise<boolean>;
  onCancel?: () => void;
}

export default function PasswordModal({
  title,
  description,
  placeholder = "Contraseña...",
  onConfirm,
  onCancel,
}: PasswordModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Por favor, ingrese una contraseña.");
      return;
    }

    setError(null);
    setIsVerifying(true);
    try {
      const isValid = await onConfirm(password);
      if (!isValid) {
        setError("Contraseña incorrecta. Intente de nuevo.");
      }
    } catch (err) {
      setError("Ocurrió un error al verificar la contraseña.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl animate-fade-in">
      <div className="flex flex-col items-center text-center space-y-4">
        
        {/* Animated Key Icon */}
        <div className="w-12 h-12 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 flex items-center justify-center animate-pulse">
          <KeyRound size={22} className="text-[#3B82F6]" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
          <p className="text-xs text-gray-400 max-w-xs leading-relaxed">{description}</p>
        </div>

        {/* Input box */}
        <form onSubmit={handleSubmit} className="w-full space-y-4 pt-2">
          <div className="relative">
            <input
              id="admin-password-input"
              type={showPassword ? "text" : "password"}
              placeholder={placeholder}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#3B82F6] rounded-xl px-4 py-3 text-white outline-none text-sm placeholder-zinc-600 transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-1 cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Verification feedback error banner */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3.5 py-2.5 rounded-lg flex items-start gap-2 text-left">
              <AlertTriangle size={15} className="flex-shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 text-xs font-mono tracking-wider hover:bg-white/5 transition-all uppercase cursor-pointer"
              >
                Volver
              </button>
            )}
            <button
              id="password-submit-btn"
              type="submit"
              disabled={isVerifying}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-black font-bold text-xs font-mono tracking-wider shadow-md hover:shadow-[#3B82F6]/10 transition-all uppercase disabled:opacity-50 cursor-pointer"
            >
              {isVerifying ? "Verificando..." : "Acceder"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
