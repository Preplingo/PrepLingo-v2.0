import React, { useEffect, useId, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface SteamingCoffeeIconProps {
  size?: number;
  className?: string;
}

export const SteamingCoffeeIcon: React.FC<SteamingCoffeeIconProps> = ({
  size = 24,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const cupGradId = `coffee-cup-${uid}`;
  const rimGradId = `coffee-rim-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={cupGradId} x1="5" y1="11" x2="21" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id={rimGradId} x1="6" y1="11" x2="20" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c2d12" />
          <stop offset="100%" stopColor="#9a3412" />
        </linearGradient>
      </defs>

      {/* Gently rising animated steam curls */}
      <path
        d="M9.5 9.2C8.7 8 8.9 6.7 9.7 5.6C10.3 4.8 10.3 3.9 9.7 3.1"
        stroke="#f97316"
        strokeWidth="1.65"
        strokeLinecap="round"
        className="coffee-steam-1"
      />
      <path
        d="M13.2 8.8C12.4 7.5 12.6 6.1 13.5 5C14.1 4.2 14.1 3.2 13.4 2.4"
        stroke="#fb923c"
        strokeWidth="1.75"
        strokeLinecap="round"
        className="coffee-steam-2"
      />
      <path
        d="M16.9 9.2C16.1 8 16.3 6.7 17.1 5.6C17.7 4.8 17.7 3.9 17.1 3.1"
        stroke="#f59e0b"
        strokeWidth="1.65"
        strokeLinecap="round"
        className="coffee-steam-3"
      />

      {/* Cup handle */}
      <path
        d="M19.8 13.5H21.6C23.1 13.5 24.3 14.7 24.3 16.2C24.3 17.7 23.1 18.9 21.6 18.9H19.4"
        stroke="#c2410c"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Warm amber/orange coffee cup body */}
      <path
        d="M5.8 12.2C5.8 11.65 6.25 11.2 6.8 11.2H19.2C19.75 11.2 20.2 11.65 20.2 12.2V16.8C20.2 20.5 17.3 23.2 13 23.2C8.7 23.2 5.8 20.5 5.8 16.8V12.2Z"
        fill={`url(#${cupGradId})`}
        stroke="#b45309"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      {/* Espresso surface / rim highlight */}
      <ellipse cx="13" cy="12.2" rx="6.4" ry="1.35" fill={`url(#${rimGradId})`} />
      <path
        d="M8.5 15.2C8.5 17.4 9.3 19.3 10.6 20.4"
        stroke="#fef3c7"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Saucer line */}
      <path
        d="M5.5 25.2H20.5"
        stroke="#d97706"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

interface BuyCoffeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLACEHOLDER_IBAN = 'TR00 0000 0000 0000 0000 0000 00';

export const BuyCoffeeModal: React.FC<BuyCoffeeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyIban = async () => {
    let success = false;
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(PLACEHOLDER_IBAN);
        success = true;
      } catch {
        // Fallback below
      }
    }

    if (!success) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = PLACEHOLDER_IBAN;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        success = true;
      } catch {
        // Ignore clipboard errors
      }
    }

    if (success) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="buy-coffee-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#020617]/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#fde68a] dark:border-[#334155] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f8fafc] rounded-xl hover:bg-[#f1f5f9] dark:hover:bg-[#0f172a] transition-colors cursor-pointer"
          title="Kapat"
          aria-label="Kapat"
        >
          <X width={20} height={20} stroke="currentColor" fill="none" className="w-5 h-5" />
        </button>

        {/* Warm Icon & Title */}
        <div className="flex flex-col items-center text-center pt-1">
          <div className="w-16 h-16 rounded-2xl bg-[#fffbeb] dark:bg-[#451a03] border border-[#fcd34d] dark:border-[#b45309] flex items-center justify-center shadow-sm mb-4">
            <SteamingCoffeeIcon size={40} />
          </div>

          <h3
            id="buy-coffee-modal-title"
            className="text-xl sm:text-2xl font-bold font-['Outfit'] tracking-tight text-[#0f172a] dark:text-[#f8fafc]"
          >
            Bana Bir Kahve Ismarla
          </h3>

          <p className="mt-2.5 text-sm text-[#475569] dark:text-[#cbd5e1] leading-relaxed">
            PrepLingo&apos;yu faydalı bulduysanız, gelişimine katkıda bulunmak için bana bir kahve ısmarlayabilirsiniz ☕
          </p>
        </div>

        {/* One-Click Copyable IBAN Box */}
        <div className="mt-6 p-4 rounded-2xl bg-[#fffbeb] dark:bg-[#0f172a] border border-[#fde68a] dark:border-[#334155] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#b45309] dark:text-[#fbbf24]">
              IBAN
            </span>
            <span className="text-[11px] text-[#64748b] dark:text-[#94a3b8]">
              Tek tıkla kopyala
            </span>
          </div>

          <div
            onClick={handleCopyIban}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCopyIban();
              }
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] dark:bg-[#1e293b] border border-[#fcd34d] dark:border-[#475569] text-center font-mono text-xs sm:text-sm font-semibold tracking-wider text-[#0f172a] dark:text-[#f8fafc] select-all cursor-pointer hover:border-[#f59e0b] dark:hover:border-[#fbbf24] transition-colors"
            title="Kopyalamak için tıklayın"
          >
            {PLACEHOLDER_IBAN}
          </div>

          <button
            type="button"
            onClick={handleCopyIban}
            style={{
              backgroundColor: copied ? '#16a34a' : '#d97706',
              color: '#ffffff',
            }}
            className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-[#ffffff] flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer ${
              copied
                ? 'bg-[#16a34a] hover:bg-[#15803d]'
                : 'bg-[#d97706] hover:bg-[#b45309]'
            }`}
          >
            {copied ? (
              <>
                <Check width={16} height={16} stroke="#ffffff" fill="none" className="w-4 h-4 shrink-0" />
                <span>Kopyalandı!</span>
              </>
            ) : (
              <>
                <Copy width={16} height={16} stroke="#ffffff" fill="none" className="w-4 h-4 shrink-0" />
                <span>Kopyala</span>
              </>
            )}
          </button>
        </div>

        {/* Footer Close Button */}
        <div className="mt-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-[#f1f5f9] dark:bg-[#0f172a] hover:bg-[#e2e8f0] dark:hover:bg-[#334155] border border-[#e2e8f0] dark:border-[#334155] text-[#334155] dark:text-[#e2e8f0] font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
