import React, { useEffect, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface SteamingCoffeeIconProps {
  size?: number;
  className?: string;
  darkMode?: boolean;
}

export const SteamingCoffeeIcon: React.FC<SteamingCoffeeIconProps> = ({
  size = 24,
  className = '',
  darkMode = false,
}) => {
  // High-contrast solid HEX coffee colors: #E65100 in Light Mode, #FF9800 in Dark Mode
  const primaryColor = darkMode ? '#FF9800' : '#E65100';
  const rimColor = darkMode ? '#B45309' : '#7C2D12';
  const highlightColor = darkMode ? '#FFF3E0' : '#FFFFFF';

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
      {/* Gently rising animated solid-HEX steam curls */}
      <path
        d="M9.5 9.2C8.7 8 8.9 6.7 9.7 5.6C10.3 4.8 10.3 3.9 9.7 3.1"
        stroke={primaryColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        className="coffee-steam-1"
      />
      <path
        d="M13.2 8.8C12.4 7.5 12.6 6.1 13.5 5C14.1 4.2 14.1 3.2 13.4 2.4"
        stroke={primaryColor}
        strokeWidth="1.9"
        strokeLinecap="round"
        className="coffee-steam-2"
      />
      <path
        d="M16.9 9.2C16.1 8 16.3 6.7 17.1 5.6C17.7 4.8 17.7 3.9 17.1 3.1"
        stroke={primaryColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        className="coffee-steam-3"
      />

      {/* Cup handle */}
      <path
        d="M19.8 13.5H21.6C23.1 13.5 24.3 14.7 24.3 16.2C24.3 17.7 23.1 18.9 21.6 18.9H19.4"
        stroke={primaryColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Solid vivid coffee cup body */}
      <path
        d="M5.8 12.2C5.8 11.65 6.25 11.2 6.8 11.2H19.2C19.75 11.2 20.2 11.65 20.2 12.2V16.8C20.2 20.5 17.3 23.2 13 23.2C8.7 23.2 5.8 20.5 5.8 16.8V12.2Z"
        fill={primaryColor}
        stroke={rimColor}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      {/* Espresso surface / rim */}
      <ellipse cx="13" cy="12.2" rx="6.4" ry="1.35" fill={rimColor} />
      <path
        d="M8.5 15.2C8.5 17.4 9.3 19.3 10.6 20.4"
        stroke={highlightColor}
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Saucer line */}
      <path
        d="M5.5 25.2H20.5"
        stroke={primaryColor}
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  );
};

interface BuyCoffeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

const PLACEHOLDER_IBAN = 'TR00 0000 0000 0000 0000 0000 00';

export const BuyCoffeeModal: React.FC<BuyCoffeeModalProps> = ({
  isOpen,
  onClose,
  darkMode = false,
}) => {
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
        textarea.style.left = '-9999px';
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
      className="preplingo-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#FFFFFF] dark:bg-[#1E293B] rounded-3xl p-6 sm:p-7 border-2 border-[#B4C6A6] dark:border-[#334155]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#2D4A2D] dark:text-[#94A3B8] hover:text-[#0E2F0E] dark:hover:text-[#F8FAFC] rounded-xl bg-[#E2F0D9] dark:bg-[#0F172A] border border-[#B4C6A6] dark:border-[#334155] transition-colors cursor-pointer"
          title="Kapat"
          aria-label="Kapat"
        >
          <X width={20} height={20} stroke="currentColor" fill="none" className="w-5 h-5" />
        </button>

        {/* Warm Icon & Title */}
        <div className="flex flex-col items-center text-center pt-1">
          <div
            style={{
              backgroundColor: darkMode ? '#0F172A' : '#FFF3E0',
              borderColor: darkMode ? '#FF9800' : '#E65100',
            }}
            className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center mb-4"
          >
            <SteamingCoffeeIcon size={40} darkMode={darkMode} />
          </div>

          <h3
            id="buy-coffee-modal-title"
            className="text-xl sm:text-2xl font-bold font-['Outfit'] tracking-tight text-[#0E2F0E] dark:text-[#F8FAFC]"
          >
            Bana Bir Kahve Ismarla
          </h3>

          <p className="mt-2.5 text-sm text-[#2D4A2D] dark:text-[#94A3B8] leading-relaxed">
            PrepLingo&apos;yu faydalı bulduysanız, gelişimine katkıda bulunmak için bana bir kahve ısmarlayabilirsiniz ☕
          </p>
        </div>

        {/* One-Click Copyable IBAN Box */}
        <div className="mt-6 p-4 rounded-2xl bg-[#FFF3E0] dark:bg-[#0F172A] border border-[#E65100] dark:border-[#334155] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E65100] dark:text-[#FF9800]">
              IBAN
            </span>
            <span className="text-[11px] text-[#2D4A2D] dark:text-[#94A3B8]">
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
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#B4C6A6] dark:border-[#334155] text-center font-mono text-xs sm:text-sm font-semibold tracking-wider text-[#0E2F0E] dark:text-[#F8FAFC] select-all cursor-pointer hover:border-[#E65100] dark:hover:border-[#FF9800] transition-colors"
            title="Kopyalamak için tıklayın"
          >
            {PLACEHOLDER_IBAN}
          </div>

          <button
            type="button"
            onClick={handleCopyIban}
            style={{
              backgroundColor: copied
                ? darkMode
                  ? '#059669'
                  : '#388E3C'
                : darkMode
                ? '#4F46E5'
                : '#E65100',
              borderColor: copied
                ? darkMode
                  ? '#10B981'
                  : '#2E7D32'
                : darkMode
                ? '#3F51B5'
                : '#BF360C',
              color: '#FFFFFF',
            }}
            className="w-full py-2.5 px-4 rounded-xl border font-semibold text-xs sm:text-sm text-[#FFFFFF] flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            {copied ? (
              <>
                <Check width={16} height={16} stroke="#FFFFFF" fill="none" className="w-4 h-4 shrink-0" />
                <span>Kopyalandı!</span>
              </>
            ) : (
              <>
                <Copy width={16} height={16} stroke="#FFFFFF" fill="none" className="w-4 h-4 shrink-0" />
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
            className="w-full py-2.5 px-4 rounded-xl bg-[#E2F0D9] dark:bg-[#0F172A] hover:bg-[#C8E6C9] dark:hover:bg-[#334155] border border-[#B4C6A6] dark:border-[#334155] text-[#0E2F0E] dark:text-[#F8FAFC] font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
