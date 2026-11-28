import React, { useEffect, useState } from 'react';
import {
  X,
  GraduationCap,
  Database,
  WifiOff,
  Sparkles,
  BookOpen,
  Heart,
  ShieldCheck,
  Mail,
  Check,
  MessageSquareHeart,
} from 'lucide-react';
import { AppLogo } from './AppLogo';
import { INITIAL_WORDS } from '../data/initialWords';
import {
  offlineDictionary,
  ensureOfflineDictionaryLoaded,
} from '../data/offlineDictionaryLoader';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  prepCardCount?: number;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  prepCardCount = INITIAL_WORDS.length,
}) => {
  const [copied, setCopied] = useState(false);
  const [offlineCount, setOfflineCount] = useState<number>(() => offlineDictionary.getCount());
  const [isOfflineReady, setIsOfflineReady] = useState<boolean>(() => offlineDictionary.getIsLoaded());
  const supportEmail = 'preplingostudio@gmail.com';

  useEffect(() => {
    const syncCounts = () => {
      setOfflineCount(offlineDictionary.getCount());
      setIsOfflineReady(offlineDictionary.getIsLoaded());
    };
    const unsubscribe = offlineDictionary.subscribe(syncCounts);
    if (isOpen) {
      ensureOfflineDictionaryLoaded();
      syncCounts();
    }
    return unsubscribe;
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalUniqueCount = prepCardCount + offlineCount;
  const formattedPrepCount = prepCardCount.toLocaleString('tr-TR');
  const formattedOfflineCount = offlineCount.toLocaleString('tr-TR');
  const formattedTotalCount = totalUniqueCount.toLocaleString('tr-TR');

  const handleFeedbackClick = () => {
    const mailtoUrl = `mailto:${supportEmail}?subject=Preplingo%20Geri%20Bildirim%20ve%20%C3%96neri&body=Merhaba%20Preplingo%20Ekibi%2C%0A%0A%5BHata%20bildirimi%2C%20eksik%20kelime%20veya%20%C3%B6nerinizi%20buraya%20yazabilirsiniz%5D%0A%0A%C4%B0yi%20%C3%A7al%C4%B1%C5%9Fmalar.`;

    try {
      window.location.href = mailtoUrl;
    } catch {
      // Fallback: clipboard copy
    }

    // Also copy to clipboard so users without a default mail client don't get stuck
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(supportEmail).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      className="preplingo-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] bg-[#FFFFFF] dark:bg-[#1E293B] rounded-3xl p-6 sm:p-8 border-2 border-[#B4C6A6] dark:border-[#334155] overflow-y-auto space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#475569] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f8fafc] rounded-xl hover:bg-[#f1f5f9] dark:hover:bg-[#0f172a] transition-colors cursor-pointer"
          title="Kapat"
          aria-label="Kapat"
        >
          <X width={20} height={20} stroke="currentColor" fill="none" className="w-5 h-5" />
        </button>

        {/* Header / Brand info */}
        <div className="flex items-center gap-3.5 pr-8">
          <AppLogo size={46} />
          <div>
            <div className="flex items-center gap-2">
              <h3 id="about-modal-title" className="text-xl sm:text-2xl font-bold font-['Outfit'] text-[#0f172a] dark:text-[#f8fafc]">
                PrepLingo
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#047857] dark:text-[#6ee7b7] bg-[#ecfdf5] dark:bg-[#064e3b] px-2.5 py-0.5 rounded-full border border-[#a7f3d0] dark:border-[#059669]">
                AKADEMİK &amp; GENEL SÖZLÜK
              </span>
            </div>
            <p className="text-xs text-[#475569] dark:text-[#94a3b8] mt-0.5">
              Üniversite Hazırlık, YDS/IELTS/TOEFL ve Tüm İngilizce Öğrenenler İçin Sözlük &amp; Çalışma Platformu
            </p>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="space-y-3.5 pt-1 text-[#0f172a] dark:text-[#f8fafc] text-xs sm:text-sm">
          {/* Section 1: Prep Exam & All Learners Focus */}
          <div className="p-4 rounded-2xl bg-[#ecfdf5] dark:bg-[#0f172a] border border-[#a7f3d0] dark:border-[#334155] space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-[#065f46] dark:text-[#6ee7b7]">
              <GraduationCap width={16} height={16} stroke="currentColor" fill="none" className="w-4 h-4 text-[#16a34a] dark:text-[#34d399] shrink-0" />
              <span>Üniversite Hazırlık, Sınavlar ve Tüm Öğrenenler İçin</span>
            </div>
            <p className="text-[#475569] dark:text-[#94a3b8] leading-relaxed text-xs">
              Üniversite hazırlık öğrencileri, yeni başlayanlar ve YDS, YÖKDİL, IELTS, TOEFL sınavlarına hazırlananlar için kapsamlı İngilizce-Türkçe / Türkçe-İngilizce sözlük ve kelime platformu. A1–B2 temel sözcüklerden yüksek frekanslı {formattedPrepCount} akademik hazırlık kartına ve toplam {isOfflineReady && offlineCount > 0 ? formattedTotalCount : '86.000+'} benzersiz kelimelik genel sözlük arşivine kadar tüm seviyeleri kapsar.
            </p>
          </div>

          {/* Section 2: Dual Layer Architecture */}
          <div className="p-4 rounded-2xl bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-[#0f172a] dark:text-[#f8fafc]">
              <Database width={16} height={16} stroke="currentColor" fill="none" className="w-4 h-4 text-[#059669] dark:text-[#34d399] shrink-0" />
              <span>Bilinçli İki Katmanlı Sözlük Mimarisi</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-[#ffffff] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#b45309] dark:text-[#fcd34d]">
                  <Sparkles width={14} height={14} stroke="currentColor" fill="none" className="w-3.5 h-3.5" />
                  <span>{formattedPrepCount} Zengin Akademik Kart</span>
                </div>
                <p className="text-[#475569] dark:text-[#94a3b8] leading-relaxed">
                  CEFR A1–B2 seviye rozetleri, İngilizce telaffuz sesleri, çift dilli örnek cümleler, sınav ipuçları ve fiil çekim formları (V1/V2/V3).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#ffffff] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#0369a1] dark:text-[#7dd3fc]">
                  <BookOpen width={14} height={14} stroke="currentColor" fill="none" className="w-3.5 h-3.5" />
                  <span>
                    {isOfflineReady && offlineCount > 0
                      ? `${formattedOfflineCount} Temizlenmiş Genel Kelime`
                      : '84.000+ Temizlenmiş Genel Kelime'}
                  </span>
                </div>
                <p className="text-[#475569] dark:text-[#94a3b8] leading-relaxed">
                  Mükerrer kayıt ve çekim eklerinden arındırılmış, cihaz belleğinde saklanarak internet gerekmeksizin anında Türkçe karşılık veren çevrimdışı sözlük katmanı.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: 100% Offline & Kelime Defterim */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] space-y-1">
              <div className="flex items-center gap-2 font-bold text-[#0f172a] dark:text-[#f8fafc] text-xs">
                <WifiOff width={16} height={16} stroke="currentColor" fill="none" className="w-4 h-4 text-[#16a34a] dark:text-[#34d399] shrink-0" />
                <span>%100 Çevrimdışı (Offline-First)</span>
              </div>
              <p className="text-xs text-[#475569] dark:text-[#94a3b8] leading-relaxed">
                Tüm veri tabanı, arama motoru ve ses sentezleyici cihazınızda yerel çalışır. Metroda, otobüste veya uçuş modunda kesintisiz çalışabilirsiniz.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] space-y-1">
              <div className="flex items-center gap-2 font-bold text-[#0f172a] dark:text-[#f8fafc] text-xs">
                <Heart width={16} height={16} stroke="#f43f5e" fill="#f43f5e" className="w-4 h-4 text-[#f43f5e] shrink-0" />
                <span>Kişisel Kelime Defterim</span>
              </div>
              <p className="text-xs text-[#475569] dark:text-[#94a3b8] leading-relaxed">
                Kartlardaki kalp simgesine dokunarak zorlandığınız kelimeleri defterinize kaydedebilir, türlerine göre filtreleyerek odaklı tekrar yapabilirsiniz.
              </p>
            </div>
          </div>

          {/* Section 4: Contact, Support & Student Feedback */}
          <div className="p-4 rounded-2xl bg-[#ecfdf5] dark:bg-[#0f172a] border border-[#a7f3d0] dark:border-[#334155] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-[#0f172a] dark:text-[#f8fafc] text-xs sm:text-sm">
                <MessageSquareHeart width={16} height={16} stroke="#f43f5e" fill="none" className="w-4 h-4 text-[#f43f5e] shrink-0" />
                <span>İletişim &amp; Destek</span>
              </div>
              {copied && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#059669] dark:text-[#34d399] bg-[#ecfdf5] dark:bg-[#022c22] px-2 py-0.5 rounded-md border border-[#a7f3d0] dark:border-[#065f46] animate-in fade-in duration-150">
                  <Check width={12} height={12} stroke="currentColor" fill="none" className="w-3 h-3" />
                  <span>E-posta adresi kopyalandı!</span>
                </span>
              )}
            </div>

            <p className="text-xs text-[#475569] dark:text-[#94a3b8] leading-relaxed">
              Hatalı gördüğünüz bir kelimeyi, teknik desteği veya önerilerinizi bize iletebilirsiniz. Öğrenci geri bildirimleriyle PrepLingo her geçen gün daha da gelişiyor.
            </p>

            <div className="pt-1 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5">
              <a
                href={`mailto:${supportEmail}?subject=PrepLingo%20%C4%B0leti%C5%9Fim%20ve%20Destek`}
                style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                className="legacy-btn-green px-4 py-2 rounded-xl bg-[#16a34a] hover:bg-[#15803d] active:scale-95 text-[#ffffff] font-semibold text-xs transition-all inline-flex items-center justify-center gap-2 shadow-xs"
              >
                <Mail width={14} height={14} stroke="#ffffff" fill="none" className="w-3.5 h-3.5 shrink-0" />
                <span>{supportEmail}</span>
              </a>

              <button
                type="button"
                onClick={handleFeedbackClick}
                className="px-3.5 py-2 rounded-xl bg-[#ffffff] dark:bg-[#1e293b] border border-[#a7f3d0] dark:border-[#334155] text-[#047857] dark:text-[#6ee7b7] hover:bg-[#d1fae5] dark:hover:bg-[#334155] font-semibold text-xs transition-all cursor-pointer"
              >
                E-posta Adresini Kopyala
              </button>

              <a
                href="https://preplingo-privacy.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-[#ffffff] dark:bg-[#1e293b] border border-[#a7f3d0] dark:border-[#334155] text-[#047857] dark:text-[#6ee7b7] hover:bg-[#d1fae5] dark:hover:bg-[#334155] font-semibold text-xs transition-all inline-flex items-center justify-center gap-2"
              >
                <ShieldCheck width={14} height={14} stroke="currentColor" fill="none" className="w-3.5 h-3.5 shrink-0 text-[#059669] dark:text-[#34d399]" />
                <span>Gizlilik Politikası</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer info & Dismiss */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#f1f5f9] dark:border-[#334155]">
          <div className="flex items-center gap-1.5 text-xs text-[#475569] dark:text-[#94a3b8]">
            <ShieldCheck width={16} height={16} stroke="#10b981" fill="none" className="w-4 h-4 text-[#10b981]" />
            <span>Kişisel verileriniz ve ilerlemeniz yalnızca cihazınızda saklanır.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
            className="legacy-btn-green w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-[#ffffff] font-semibold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
          >
            Anladım
          </button>
        </div>

        {/* Single-line Live Unique Total Word Counter at the very bottom */}
        <div className="pt-2.5 border-t border-[#E2F0D9] dark:border-[#334155] text-center">
          <p className="text-[11px] font-semibold text-[#0E2F0E] dark:text-[#94A3B8] truncate">
            {isOfflineReady && offlineCount > 0
              ? `Toplam Benzersiz Kelime: ${formattedTotalCount} (${formattedPrepCount} Hazırlık Kartı + ${formattedOfflineCount} Çevrimdışı Sözlük)`
              : `Toplam Benzersiz Kelime: ${formattedPrepCount} Hazırlık Kartı · Çevrimdışı sözlük hazırlanıyor...`}
          </p>
        </div>
      </div>
    </div>
  );
};
