import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  Heart,
  Trophy,
  Timer,
  Volume2,
  Layers,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WordEntry, WordStatus } from '../types';
import { speakText } from '../utils/textToSpeech';
import { getCefrBadgeClass } from '../utils/themeBadges';

interface ProgressViewProps {
  words: WordEntry[];
  highScore: number;
  classicBestTime: number | null;
  newRecordFlags: { classic: boolean; timeAttack: boolean };
  onClearNewRecordFlags: () => void;
  onUpdateStatus: (id: string, status: WordStatus) => void;
  onNavigateToTab: (tab: 'flashcards' | 'games') => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  words,
  highScore,
  classicBestTime,
  newRecordFlags,
  onClearNewRecordFlags,
  onUpdateStatus,
  onNavigateToTab,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'ogrenildi' | 'calisiliyor'>('all');

  // Capture any newly broken record flags on mount so the celebration stays visible throughout the visit
  const [celebratingRecords] = useState(() => ({
    classic: Boolean(newRecordFlags.classic),
    timeAttack: Boolean(newRecordFlags.timeAttack),
  }));

  useEffect(() => {
    const hasNewRecord = celebratingRecords.classic || celebratingRecords.timeAttack;
    if (hasNewRecord) {
      confetti({
        particleCount: 75,
        spread: 68,
        origin: { y: 0.42 },
      });
    }
    return () => {
      if (hasNewRecord) {
        onClearNewRecordFlags();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalWords = words.length;
  const masteredWords = words.filter((w) => w.status === 'ogrenildi');
  const learningWords = words.filter((w) => w.status === 'calisiliyor');
  const starredWords = words.filter((w) => w.isFavorite);

  const progressRatio = totalWords > 0 ? Math.min(1, Math.max(0, masteredWords.length / totalWords)) : 0;
  const masteredRate = totalWords > 0 ? Math.round(progressRatio * 100) : 0;

  // True SVG circular progress ring geometry (r = 26 -> circumference ≈ 163.36)
  const ringRadius = 26;
  const ringCircumference = 2 * Math.PI * ringRadius;
  // At 0 mastered words: render ONLY a millimetric ~1.2% starting marker at 12 o'clock, leaving the rest empty
  const isZeroProgress = masteredWords.length === 0;
  const ringDashLength = isZeroProgress
    ? ringCircumference * 0.012
    : Math.max(ringCircumference * 0.015, ringCircumference * progressRatio);

  // CEFR breakdowns
  const aLevelWords = words.filter((w) => w.cefrLevel === 'A1' || w.cefrLevel === 'A2');
  const aLevelMastered = aLevelWords.filter((w) => w.status === 'ogrenildi');
  const aLevelRate = aLevelWords.length > 0 ? Math.round((aLevelMastered.length / aLevelWords.length) * 100) : 0;

  const bLevelWords = words.filter((w) => w.cefrLevel === 'B1' || w.cefrLevel === 'B2');
  const bLevelMastered = bLevelWords.filter((w) => w.status === 'ogrenildi');
  const bLevelRate = bLevelWords.length > 0 ? Math.round((bLevelMastered.length / bLevelWords.length) * 100) : 0;

  // Filtered list for detailed view (strictly A-Z by English word)
  const displayedWords = words
    .filter((w) => {
      if (filterStatus === 'ogrenildi') return w.status === 'ogrenildi';
      if (filterStatus === 'calisiliyor') return w.status === 'calisiliyor';
      return true;
    })
    .sort((a, b) => a.word.trim().localeCompare(b.word.trim(), 'en', { sensitivity: 'base' }));

  const handleSpeakEnglish = (word: string) => {
    speakText(word, 'en-US', 1.0);
  };

  return (
    <div className="space-y-6 pb-24 max-w-3xl mx-auto">
      {/* Overview Banner */}
      <div className="bg-[#1e1b4b] bg-gradient-to-br from-[#312e81] via-[#1e1b4b] to-[#020617] rounded-3xl p-6 sm:p-8 text-[#ffffff] shadow-lg space-y-6 border border-[#3730a3]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold tracking-widest text-[#a5b4fc] flex items-center gap-1.5">
              <TrendingUp width={16} height={16} fill="none" stroke="#a5b4fc" className="w-4 h-4" />
              <span>Hazırlık Kelime Hakimiyeti</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] tracking-tight text-[#ffffff]">
              Gelişim Tablonuz
            </h2>
            <p className="text-xs sm:text-sm text-[#c7d2fe]">
              Muafiyet ve hazırlık sınavlarına yönelik kelime öğrenme durumunuz
            </p>
          </div>

          {/* Mastered Percentage Ring Card (Accurate SVG Progress Ring) */}
          <div className="flex items-center gap-3.5 bg-[#312e81] px-4 py-3 rounded-2xl border border-[#4338ca] self-start sm:self-auto">
            <div className="text-right">
              <span className="text-[11px] text-[#c7d2fe] block uppercase font-medium">Genel Başarı</span>
              <span className="text-2xl font-extrabold font-mono text-[#ffffff]">%{masteredRate}</span>
            </div>
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg
                viewBox="0 0 64 64"
                width={64}
                height={64}
                className="w-full h-full"
                aria-label={`Öğrenilen kelime oranı yüzde ${masteredRate}`}
              >
                {/* Neutral empty ring track */}
                <circle
                  cx="32"
                  cy="32"
                  r={ringRadius}
                  fill="none"
                  stroke="#475569"
                  strokeOpacity="0.6"
                  strokeWidth="4.5"
                />
                {/* Proportional emerald progress arc (or millimetric 12 o'clock starting tick at 0%) */}
                <circle
                  cx="32"
                  cy="32"
                  r={ringRadius}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="4.5"
                  strokeLinecap={isZeroProgress || progressRatio < 0.03 ? 'butt' : 'round'}
                  strokeDasharray={`${ringDashLength.toFixed(2)} ${ringCircumference.toFixed(2)}`}
                  transform={isZeroProgress ? 'rotate(-92.2 32 32)' : 'rotate(-90 32 32)'}
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-[#ffffff] leading-none px-1 text-center">
                {masteredWords.length}/{totalWords}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Word KPI Cards */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 pt-1">
          {/* Öğrenildi */}
          <div className="bg-[#0f172a] rounded-2xl p-3.5 border border-[#312e81] space-y-1">
            <span className="text-[#34d399] text-xs font-medium flex items-center gap-1">
              <CheckCircle2 width={14} height={14} fill="none" stroke="#34d399" className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Öğrenildi</span>
            </span>
            <span className="text-2xl font-bold font-mono text-[#ffffff] block">
              {masteredWords.length}
            </span>
            <span className="text-[10px] text-[#c7d2fe] block">kelime tamamlandı</span>
          </div>

          {/* Çalışılıyor */}
          <div className="bg-[#0f172a] rounded-2xl p-3.5 border border-[#312e81] space-y-1">
            <span className="text-[#fbbf24] text-xs font-medium flex items-center gap-1">
              <Clock width={14} height={14} fill="none" stroke="#fbbf24" className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Çalışılıyor</span>
            </span>
            <span className="text-2xl font-bold font-mono text-[#ffffff] block">
              {learningWords.length}
            </span>
            <span className="text-[10px] text-[#c7d2fe] block">tekrar edilecek</span>
          </div>

          {/* Defterim */}
          <div className="bg-[#0f172a] rounded-2xl p-3.5 border border-[#312e81] space-y-1">
            <span className="text-[#fda4af] text-xs font-medium flex items-center gap-1">
              <Heart width={14} height={14} fill="#f43f5e" stroke="#f43f5e" className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Defterim</span>
            </span>
            <span className="text-2xl font-bold font-mono text-[#ffffff] block">
              {starredWords.length}
            </span>
            <span className="text-[10px] text-[#c7d2fe] block">kayıtlı kelime</span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Game Records Section (60s Time Attack + Classic Best Time) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm sm:text-base font-bold text-[#0f172a] dark:text-[#f8fafc] flex items-center gap-2">
            <Trophy width={16} height={16} fill="none" stroke="#f59e0b" className="w-4 h-4" />
            <span>Oyun Rekorların</span>
          </h3>
          {(celebratingRecords.classic || celebratingRecords.timeAttack) && (
            <span
              style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
              className="px-2.5 py-1 rounded-full text-[11px] font-extrabold shadow-sm flex items-center gap-1 animate-pulse"
            >
              <Sparkles width={12} height={12} fill="none" stroke="#ffffff" className="w-3 h-3" />
              <span>Rekor Kırdın!</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* 60s Time Attack Record Card */}
          <div
            className={`relative rounded-3xl p-4 sm:p-5 bg-[#ffffff] dark:bg-[#1e293b] border transition-all shadow-sm space-y-3 ${
              celebratingRecords.timeAttack
                ? 'border-2 border-[#f59e0b] dark:border-[#fbbf24] ring-4 ring-[#fde68a] dark:ring-[#78350f] shadow-lg'
                : 'border-[#e2e8f0] dark:border-[#334155]'
            }`}
          >
            {celebratingRecords.timeAttack && (
              <span
                style={{ backgroundColor: '#f59e0b', color: '#ffffff' }}
                className="absolute -top-3 right-3 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold tracking-wide shadow-md flex items-center gap-1 animate-bounce"
              >
                <Sparkles width={12} height={12} fill="none" stroke="#ffffff" className="w-3 h-3" />
                <span>Yeni Rekor!</span>
              </span>
            )}

            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-[#fffbeb] dark:bg-[#451a03] border border-[#fde68a] dark:border-[#92400e] shrink-0">
                <Trophy width={20} height={20} fill="none" stroke="#d97706" className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-[#0f172a] dark:text-[#f8fafc] block truncate">
                  60s Yarış
                </span>
                <span className="text-[11px] text-[#475569] dark:text-[#94a3b8] block truncate">
                  En Yüksek Skor
                </span>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#d97706] dark:text-[#fbbf24] block">
                {highScore > 0 ? highScore : '—'}
              </span>
              <span className="text-[11px] text-[#475569] dark:text-[#94a3b8] block mt-0.5">
                {highScore > 0 ? 'kişisel en yüksek puan' : 'Henüz skor kaydedilmedi'}
              </span>
            </div>
          </div>

          {/* Classic Matching Best Time Record Card */}
          <div
            className={`relative rounded-3xl p-4 sm:p-5 bg-[#ffffff] dark:bg-[#1e293b] border transition-all shadow-sm space-y-3 ${
              celebratingRecords.classic
                ? 'border-2 border-[#10b981] dark:border-[#34d399] ring-4 ring-[#a7f3d0] dark:ring-[#065f46] shadow-lg'
                : 'border-[#e2e8f0] dark:border-[#334155]'
            }`}
          >
            {celebratingRecords.classic && (
              <span
                style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                className="absolute -top-3 right-3 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold tracking-wide shadow-md flex items-center gap-1 animate-bounce"
              >
                <Sparkles width={12} height={12} fill="none" stroke="#ffffff" className="w-3 h-3" />
                <span>Yeni Rekor!</span>
              </span>
            )}

            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-[#ecfdf5] dark:bg-[#022c22] border border-[#a7f3d0] dark:border-[#065f46] shrink-0">
                <Timer width={20} height={20} fill="none" stroke="#16a34a" className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-[#0f172a] dark:text-[#f8fafc] block truncate">
                  Klasik Eşleştirme
                </span>
                <span className="text-[11px] text-[#475569] dark:text-[#94a3b8] block truncate">
                  En İyi Süre
                </span>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#16a34a] dark:text-[#34d399] block">
                {classicBestTime !== null ? `${classicBestTime} sn` : '—'}
              </span>
              <span className="text-[11px] text-[#475569] dark:text-[#94a3b8] block mt-0.5">
                {classicBestTime !== null ? 'en hızlı 6\'lı tamamlama' : 'Henüz süre kaydedilmedi'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CEFR Level Breakdown Card */}
      <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-5 sm:p-6 border border-[#e2e8f0] dark:border-[#334155] shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#0f172a] dark:text-[#f8fafc] flex items-center gap-2">
          <Sparkles width={16} height={16} fill="none" stroke="#16a34a" className="w-4 h-4" />
          <span>CEFR Seviyelerine Göre İlerleme</span>
        </h3>

        <div className="space-y-4">
          {/* A1 - A2 Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0f172a] dark:text-[#f8fafc]">
                A1 - A2 Seviyesi (Temel Hazırlık)
              </span>
              <span className="font-mono text-[#475569] dark:text-[#94a3b8]">
                {aLevelMastered.length} / {aLevelWords.length} kelime (%{aLevelRate})
              </span>
            </div>
            <div className="w-full bg-[#f1f5f9] dark:bg-[#0f172a] rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#10b981] h-full rounded-full transition-all duration-500"
                style={{ width: `${aLevelRate}%` }}
              />
            </div>
          </div>

          {/* B1 - B2 Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0f172a] dark:text-[#f8fafc]">
                B1 - B2 Seviyesi (Akademik Yeterlilik / Proficiency)
              </span>
              <span className="font-mono text-[#475569] dark:text-[#94a3b8]">
                {bLevelMastered.length} / {bLevelWords.length} kelime (%{bLevelRate})
              </span>
            </div>
            <div className="w-full bg-[#f1f5f9] dark:bg-[#0f172a] rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#16a34a] h-full rounded-full transition-all duration-500"
                style={{ width: `${bLevelRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Study Action Shortcuts */}
        <div className="pt-3 border-t border-[#f1f5f9] dark:border-[#334155] flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigateToTab('flashcards')}
            className="px-4 py-2 rounded-xl bg-[#f8fafc] hover:bg-[#ecfdf5] dark:bg-[#0f172a] dark:hover:bg-[#334155] border border-[#e2e8f0] dark:border-[#334155] text-xs font-semibold text-[#0f172a] dark:text-[#f8fafc] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Layers width={16} height={16} fill="none" stroke="#16a34a" className="w-4 h-4" />
            <span>Kartlarla Tekrar Et</span>
            <ArrowRight width={14} height={14} fill="none" stroke="#475569" className="w-3.5 h-3.5 ml-1" />
          </button>
          <button
            type="button"
            onClick={() => onNavigateToTab('games')}
            className="px-4 py-2 rounded-xl bg-[#f8fafc] hover:bg-[#ecfdf5] dark:bg-[#0f172a] dark:hover:bg-[#334155] border border-[#e2e8f0] dark:border-[#334155] text-xs font-semibold text-[#0f172a] dark:text-[#f8fafc] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trophy width={16} height={16} fill="none" stroke="#f59e0b" className="w-4 h-4" />
            <span>Eşleştirme Oyunu Oyna</span>
            <ArrowRight width={14} height={14} fill="none" stroke="#475569" className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>

      {/* Word List by Status */}
      <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-5 sm:p-6 border border-[#e2e8f0] dark:border-[#334155] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-[#0f172a] dark:text-[#f8fafc]">
            Kelimeler ve Durumları
          </h3>

          {/* Filter segment */}
          <div className="flex items-center gap-1 p-1 bg-[#f1f5f9] dark:bg-[#0f172a] rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              style={filterStatus === 'all' ? { backgroundColor: '#16a34a', color: '#ffffff' } : undefined}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                filterStatus === 'all'
                  ? 'legacy-btn-green bg-[#16a34a] text-[#ffffff] shadow-xs font-bold'
                  : 'text-[#475569] dark:text-[#94a3b8]'
              }`}
            >
              Tümü ({words.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('ogrenildi')}
              style={filterStatus === 'ogrenildi' ? { backgroundColor: '#16a34a', color: '#ffffff' } : undefined}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                filterStatus === 'ogrenildi'
                  ? 'legacy-btn-green bg-[#16a34a] text-[#ffffff] shadow-xs font-bold'
                  : 'text-[#15803d] dark:text-[#34d399]'
              }`}
            >
              Öğrenildi ({masteredWords.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('calisiliyor')}
              style={filterStatus === 'calisiliyor' ? { backgroundColor: '#d97706', color: '#ffffff' } : undefined}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                filterStatus === 'calisiliyor'
                  ? 'bg-[#d97706] text-[#ffffff] shadow-xs font-bold'
                  : 'text-[#b45309] dark:text-[#fbbf24]'
              }`}
            >
              Çalışılıyor ({learningWords.length})
            </button>
          </div>
        </div>

        {/* Word rows */}
        <div className="divide-y divide-[#f1f5f9] dark:divide-[#334155] max-h-96 overflow-y-auto pr-1">
          {displayedWords.length === 0 ? (
            <div className="py-8 text-center text-[#475569] dark:text-[#94a3b8] text-xs">
              {filterStatus === 'ogrenildi'
                ? 'Henüz öğrenildi olarak işaretlenmiş kelime bulunmuyor.'
                : filterStatus === 'calisiliyor'
                ? 'Çalışılmakta olan kelime bulunmuyor.'
                : 'Gösterilecek kelime bulunamadı.'}
            </div>
          ) : (
            displayedWords.map((word) => (
              <div
                key={word.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleSpeakEnglish(word.word)}
                    className="p-1 rounded-lg text-[#475569] hover:text-[#16a34a] hover:bg-[#ecfdf5] dark:hover:bg-[#334155] transition-colors shrink-0 cursor-pointer"
                    title="İngilizce telaffuzu dinle"
                  >
                    <Volume2 width={16} height={16} fill="none" stroke="#64748b" className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-[#0f172a] dark:text-[#f8fafc] truncate">
                        {word.word}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${getCefrBadgeClass(word.cefrLevel)}`}>
                        {word.cefrLevel}
                      </span>
                    </div>
                    <p className="text-xs text-[#475569] dark:text-[#94a3b8] truncate">
                      {word.trMeaning}
                    </p>
                  </div>
                </div>

                {/* Status Action / Toggle Button */}
                {filterStatus === 'ogrenildi' ? (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(word.id, 'calisiliyor')}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 shrink-0 transition-all bg-[#fff1f2] hover:bg-[#ffe4e6] text-[#be123c] dark:bg-[#4c0519] dark:hover:bg-[#881337] dark:text-[#fda4af] border-[#fecdd3] dark:border-[#881337] cursor-pointer active:scale-95 shadow-2xs"
                    title="Öğrenildi listesinden çıkar ve tekrar çalışma havuzuna al"
                  >
                    <X width={14} height={14} fill="none" stroke="#e11d48" className="w-3.5 h-3.5" />
                    <span>Listeden Çıkar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateStatus(
                        word.id,
                        word.status === 'ogrenildi' ? 'calisiliyor' : 'ogrenildi'
                      )
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                      word.status === 'ogrenildi'
                        ? 'bg-[#ecfdf5] dark:bg-[#022c22] text-[#15803d] dark:text-[#6ee7b7] border-[#a7f3d0] dark:border-[#065f46]'
                        : 'bg-[#fffbeb] dark:bg-[#451a03] text-[#b45309] dark:text-[#fcd34d] border-[#fde68a] dark:border-[#92400e]'
                    }`}
                    title="Durumu değiştir"
                  >
                    {word.status === 'ogrenildi' ? (
                      <>
                        <CheckCircle2 width={14} height={14} fill="none" stroke="#16a34a" className="w-3.5 h-3.5" />
                        <span>Öğrenildi</span>
                      </>
                    ) : (
                      <>
                        <Clock width={14} height={14} fill="none" stroke="#d97706" className="w-3.5 h-3.5" />
                        <span>Çalışılıyor</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
