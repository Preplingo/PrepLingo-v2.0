import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') {
      return !navigator.onLine;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-[#fffbeb] dark:bg-[#451a03] border-b border-[#fde68a] dark:border-[#92400e] text-[#78350f] dark:text-[#fde68a] px-3 py-1.5 text-xs font-medium flex items-center justify-center gap-2"
    >
      <WifiOff width={14} height={14} stroke="currentColor" fill="none" className="w-3.5 h-3.5 text-[#d97706] dark:text-[#fbbf24] shrink-0" />
      <span>Çevrimdışı Mod — Yerel veriler kullanılıyor</span>
    </div>
  );
};
