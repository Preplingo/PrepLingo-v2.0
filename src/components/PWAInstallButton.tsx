import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkStandalone = () => {
      const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const iosStandalone = (window.navigator as NavigatorWithStandalone).standalone === true;
      setIsStandalone(standaloneMedia || iosStandalone);
    };

    checkStandalone();

    const ua = window.navigator.userAgent;
    const iosDevice =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => checkStandalone();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  if (isStandalone) return null;
  if (!deferredPrompt && !isIOS) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
      return;
    }

    if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] px-2 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#ecfdf5] dark:bg-[#022c22] text-[#047857] dark:text-[#6ee7b7] border border-[#a7f3d0] dark:border-[#065f46] hover:bg-[#d1fae5] dark:hover:bg-[#064e3b] active:scale-95 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        title="Uygulamayı Cihaza Yükle"
        aria-label="PrepLingo uygulamasını cihaza yükle"
      >
        <Download width={16} height={16} stroke="currentColor" fill="none" className="w-4 h-4 shrink-0" />
        <span className="hidden lg:inline">Yükle</span>
      </button>

      {showIOSGuide &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
            className="preplingo-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="relative w-full max-w-sm bg-[#FFFFFF] dark:bg-[#1E293B] rounded-3xl p-6 border-2 border-[#B4C6A6] dark:border-[#334155] space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 text-[#475569] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f8fafc] rounded-xl hover:bg-[#f1f5f9] dark:hover:bg-[#0f172a] transition-colors cursor-pointer"
                aria-label="Kapat"
              >
                <X width={20} height={20} stroke="currentColor" fill="none" className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 pr-6">
                <div className="w-10 h-10 rounded-2xl bg-[#ecfdf5] dark:bg-[#064e3b] border border-[#a7f3d0] dark:border-[#059669] flex items-center justify-center text-[#16a34a] dark:text-[#34d399] shrink-0">
                  <Smartphone width={20} height={20} stroke="currentColor" fill="none" className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="ios-install-title" className="font-bold font-['Outfit'] text-base text-[#0f172a] dark:text-[#f8fafc]">
                    Ana Ekrana Ekle
                  </h3>
                  <p className="text-xs text-[#475569] dark:text-[#94a3b8]">
                    Çevrimdışı uygulama olarak kullanın
                  </p>
                </div>
              </div>

              <ol className="space-y-2.5 text-xs text-[#475569] dark:text-[#94a3b8]">
                <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155]">
                  <Share width={16} height={16} stroke="currentColor" fill="none" className="w-4 h-4 text-[#16a34a] dark:text-[#34d399] shrink-0 mt-0.5" />
                  <span>
                    Safari alt çubuğundaki <strong className="text-[#0f172a] dark:text-[#f8fafc]">Paylaş</strong> simgesine dokunun.
                  </span>
                </li>
                <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155]">
                  <PlusSquare width={16} height={16} stroke="currentColor" fill="none" className="w-4 h-4 text-[#059669] dark:text-[#34d399] shrink-0 mt-0.5" />
                  <span>
                    Açılan menüden <strong className="text-[#0f172a] dark:text-[#f8fafc]">&ldquo;Ana Ekrana Ekle&rdquo;</strong> seçeneğine dokunun.
                  </span>
                </li>
              </ol>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                className="legacy-btn-green w-full py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-[#ffffff] font-semibold text-xs transition-all cursor-pointer"
              >
                Anladım
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
