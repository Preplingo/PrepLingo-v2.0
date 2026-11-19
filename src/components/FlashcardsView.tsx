import React, { useState, useEffect, useMemo } from 'react';
import {
  Volume2,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Check,
  Bookmark,
  Heart,
  Sparkles,
  Layers,
  Clock
} from 'lucide-react';
import { WordEntry, CefrFilter, WordStatus } from '../types';
import { speakText } from '../utils/textToSpeech';
import { getCefrBadgeClass, getPosBadgeClass, getPosTurkishLabel } from '../utils/themeBadges';
import { VerbConjugationBadge } from '../utils/verbConjugation';
import confetti from 'canvas-confetti';

interface FlashcardsViewProps {
  words: WordEntry[];
  onToggleFavorite: (id: string) => void;
  onUpdateStatus?: (id: string, status: WordStatus) => void;
}

// Robust Fisher-Yates shuffle algorithm to ensure true uniform randomization
function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  words,
  onToggleFavorite,
  onUpdateStatus,
}) => {
  const [cefrFilter, setCefrFilter] = useState<CefrFilter | 'Defterim'>('Tümü');
  const [deck, setDeck] = useState<WordEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Filter words according to chosen tab
  const eligibleWords = useMemo(() => {
    return words.filter((item) => {
      if (cefrFilter === 'Defterim') {
        return Boolean(item.isFavorite);
      }
      if (cefrFilter === 'A1-A2') {
        return item.cefrLevel === 'A1' || item.cefrLevel === 'A2';
      }
      if (cefrFilter === 'B1-B2') {
        return item.cefrLevel === 'B1' || item.cefrLevel === 'B2';
      }
      return true;
    });
  }, [words, cefrFilter]);

  // Reset deck on filter change and automatically randomize with Fisher-Yates shuffle
  useEffect(() => {
    setDeck(fisherYatesShuffle(eligibleWords));
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [eligibleWords]);

  const currentWord = deck[currentIndex];

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleNext = () => {
    if (currentIndex < deck.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleShuffle = () => {
    if (deck.length <= 1) return;
    const shuffled = fisherYatesShuffle(deck);
    setDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleMarkMastered = () => {
    if (!currentWord) return;
    if (onUpdateStatus) {
      onUpdateStatus(currentWord.id, 'ogrenildi');
    }

    if (currentIndex === deck.length - 1) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      });
    } else {
      handleNext();
    }
  };

  const handleMarkReviewLater = () => {
    if (!currentWord) return;
    if (onUpdateStatus) {
      onUpdateStatus(currentWord.id, 'calisiliyor');
    }

    if (currentIndex < deck.length - 1) {
      handleNext();
    }
  };

  // Speaks English ONLY
  const handleSpeakEnglish = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    setIsSpeaking(true);
    speakText(text, 'en-US', 0.9, () => {
      setIsSpeaking(false);
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.code === 'KeyM') {
        handleMarkMastered();
      } else if (e.code === 'KeyR') {
        handleMarkReviewLater();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const masteredCount = deck.filter((w) => w.status === 'ogrenildi').length;
  const learningCount = deck.filter((w) => w.status === 'calisiliyor').length;
  const progressPercentage = deck.length > 0 ? Math.round(((currentIndex + 1) / deck.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Controls Header */}
      <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-4 sm:p-5 border border-[#e2e8f0] dark:border-[#334155] shadow-sm transition-colors space-y-4">
        {/* CEFR Level & Defterim Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#f1f5f9] dark:bg-[#0f172a] rounded-2xl">
            {(['Tümü', 'A1-A2', 'B1-B2', 'Defterim'] as const).map((tab) => {
              const isActive = cefrFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setCefrFilter(tab)}
                  style={isActive ? { backgroundColor: '#16a34a', color: '#ffffff' } : undefined}
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    isActive
                      ? 'legacy-btn-green bg-[#16a34a] text-[#ffffff] shadow-sm font-bold'
                      : 'text-[#475569] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f8fafc]'
                  }`}
                >
                  {tab === 'Defterim' && (
                    <Heart
                      width={14}
                      height={14}
                      fill={isActive ? '#ffffff' : '#f43f5e'}
                      stroke={isActive ? '#ffffff' : '#f43f5e'}
                      className="w-3.5 h-3.5 shrink-0"
                    />
                  )}
                  <span>{tab === 'Tümü' ? 'Tüm Kartlar' : tab}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShuffle}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#047857] dark:text-[#6ee7b7] bg-[#ecfdf5] hover:bg-[#d1fae5] active:bg-[#a7f3d0] dark:bg-[#064e3b] dark:hover:bg-[#065f46] border border-[#a7f3d0] dark:border-[#059669] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              title="Desteyi yeniden karıştır"
            >
              <Shuffle width={14} height={14} fill="none" stroke="#16a34a" className="w-3.5 h-3.5" />
              <span>Karıştır</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Counters */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#475569] dark:text-[#94a3b8]">
            <span>
              Kart <strong className="text-[#0f172a] dark:text-[#f8fafc] font-mono">{deck.length > 0 ? currentIndex + 1 : 0}</strong> /{' '}
              <span className="font-mono">{deck.length}</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[#15803d] dark:text-[#6ee7b7] font-medium flex items-center gap-1">
                <Check width={12} height={12} fill="none" stroke="#16a34a" className="w-3 h-3" />
                <span>{masteredCount} Öğrenildi</span>
              </span>
              <span className="text-[#b45309] dark:text-[#fcd34d] font-medium flex items-center gap-1">
                <Clock width={12} height={12} fill="none" stroke="#d97706" className="w-3 h-3" />
                <span>{learningCount} Çalışılıyor</span>
              </span>
            </div>
          </div>
          <div className="w-full bg-[#f1f5f9] dark:bg-[#0f172a] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#16a34a] h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Flashcard Container */}
      {deck.length === 0 ? (
        <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-10 text-center border border-[#e2e8f0] dark:border-[#334155]">
          <Layers width={48} height={48} fill="none" stroke="#94a3b8" className="w-12 h-12 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#0f172a] dark:text-[#f8fafc]">Bu destede kelime bulunmuyor</h3>
          <p className="text-sm text-[#475569] dark:text-[#94a3b8] mt-1">
            {cefrFilter === 'Defterim'
              ? 'Henüz Defterim listenizde kelime bulunmuyor. Sözlükten veya oyunlardan kelimeleri kalp simgesine dokunarak Defterim\'e ekleyip burada pratik yapabilirsiniz!'
              : 'Farklı bir seviye filtresi seçmeyi deneyebilirsiniz.'}
          </p>
          <button
            type="button"
            onClick={() => setCefrFilter('Tümü')}
            style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
            className="legacy-btn-green mt-4 px-4 py-2 bg-[#16a34a] text-[#ffffff] rounded-xl text-xs font-semibold hover:bg-[#15803d] transition-colors cursor-pointer"
          >
            Tüm Kartları Göster
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Card Container with edge navigation arrows OUTSIDE the flip-card clickable area */}
          <div className="relative w-full flex items-center justify-center">
            {/* Left Arrow Button - outside the flip-card onClick */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePrev();
              }}
              disabled={currentIndex === 0}
              aria-label="Önceki Kelime"
              title="Önceki Kelime"
              className={`absolute left-1 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-[#ffffff] dark:bg-[#1e293b] border-2 border-[#c7d2fe] dark:border-[#475569] shadow-lg flex items-center justify-center text-2xl font-bold leading-none text-[#334155] dark:text-[#e2e8f0] transition ${
                currentIndex === 0
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-[#eef2ff] dark:hover:bg-[#1e1b4b] active:scale-95 cursor-pointer'
              }`}
            >
              ‹
            </button>

            {/* Flip Card Area (ONLY tapping this area flips the card; mx-14 keeps side gutters outside onClick) */}
            <div
              onClick={handleFlip}
              className="flex-1 min-w-0 mx-14 cursor-pointer select-none transition-all duration-150"
            >
              {!isFlipped ? (
                <div className="card-front text-center p-5 sm:p-8 bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl border-2 border-[#e2e8f0] dark:border-[#334155] shadow-sm hover:border-[#10b981] dark:hover:border-[#34d399] min-h-[360px] flex flex-col justify-between">
                  {/* Top Bar: Level Badge & Bookmark */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs uppercase px-2.5 py-1 rounded-lg tracking-wide ${getCefrBadgeClass(currentWord.cefrLevel)}`}>
                      {currentWord.cefrLevel}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(currentWord.id);
                      }}
                      className="p-2 rounded-xl text-[#94a3b8] hover:text-[#f43f5e] hover:bg-[#fff1f2] dark:hover:bg-[#4c0519] transition-transform active:scale-125 cursor-pointer"
                      title={currentWord.isFavorite ? 'Kelime defterinden çıkar' : 'Kelime defterine kaydet'}
                    >
                      <Heart
                        width={20}
                        height={20}
                        fill={currentWord.isFavorite ? '#f43f5e' : 'none'}
                        stroke={currentWord.isFavorite ? '#f43f5e' : '#94a3b8'}
                        className="w-5 h-5 transition-colors"
                      />
                    </button>
                  </div>

                  {/* Center: Word, Audio, Type */}
                  <div className="my-auto py-4 space-y-3">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <h2 className="text-3xl sm:text-4xl font-bold font-['Outfit'] text-[#0f172a] dark:text-[#f8fafc] break-words">
                        {currentWord.word}
                      </h2>
                      <button
                        type="button"
                        onClick={(e) => handleSpeakEnglish(e, currentWord.word)}
                        className={`p-1.5 rounded-xl text-[#475569] hover:text-[#16a34a] hover:bg-[#ecfdf5] dark:hover:bg-[#334155] transition-colors ${
                          isSpeaking ? 'text-[#16a34a] animate-pulse' : ''
                        }`}
                        title="İngilizce telaffuzu dinle"
                      >
                        <Volume2
                          width={20}
                          height={20}
                          fill="none"
                          stroke={isSpeaking ? '#16a34a' : '#64748b'}
                          className="w-5 h-5"
                        />
                      </button>
                    </div>
                    <div className="pt-1">
                      <span className={`text-xs px-2.5 py-1 rounded-lg inline-block ${getPosBadgeClass(currentWord.partOfSpeech)}`}>
                        {getPosTurkishLabel(currentWord.partOfSpeech)}
                      </span>
                      <VerbConjugationBadge
                        word={currentWord.word}
                        type={currentWord.type}
                        partOfSpeech={currentWord.partOfSpeech}
                        className="justify-center mt-1.5"
                      />
                    </div>
                  </div>

                  {/* Bottom Prompt */}
                  <p className="text-sm text-[#475569] dark:text-[#94a3b8] mt-6 pt-3 border-t border-[#f1f5f9] dark:border-[#334155]">
                    Anlamı görmek için dokunun
                  </p>
                </div>
              ) : (
                <div className="card-back text-center p-5 sm:p-8 bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl border-2 border-[#10b981] dark:border-[#34d399] shadow-sm min-h-[360px] flex flex-col justify-between">
                  {/* Top Bar: Word hint & Bookmark */}
                  <div className="flex items-center justify-between text-xs text-[#047857] dark:text-[#6ee7b7]">
                    <span className="font-bold uppercase tracking-wider">
                      {currentWord.word} · {getPosTurkishLabel(currentWord.partOfSpeech)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(currentWord.id);
                      }}
                      className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#f43f5e] transition-transform active:scale-125 cursor-pointer"
                      title={currentWord.isFavorite ? 'Kelime defterinden çıkar' : 'Kelime defterine kaydet'}
                    >
                      <Heart
                        width={16}
                        height={16}
                        fill={currentWord.isFavorite ? '#f43f5e' : 'none'}
                        stroke={currentWord.isFavorite ? '#f43f5e' : '#94a3b8'}
                        className="w-4 h-4 transition-colors"
                      />
                    </button>
                  </div>

                  {/* Center: Meaning & Examples */}
                  <div className="my-auto py-4 space-y-3">
                    <h3 className="text-2xl sm:text-3xl font-bold text-[#0f172a] dark:text-[#f8fafc] mb-2 break-words">
                      {currentWord.trMeaning}
                    </h3>

                    <VerbConjugationBadge
                      word={currentWord.word}
                      type={currentWord.type}
                      partOfSpeech={currentWord.partOfSpeech}
                      className="justify-center mb-2"
                    />

                    <div className="max-w-lg mx-auto bg-[#f8fafc] dark:bg-[#0f172a] p-3.5 rounded-2xl border border-[#e2e8f0] dark:border-[#334155] space-y-1.5">
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-[#0f172a] dark:text-[#f8fafc] italic font-medium text-sm sm:text-base">
                          &quot;{currentWord.enExample}&quot;
                        </p>
                        <button
                          type="button"
                          onClick={(e) => handleSpeakEnglish(e, currentWord.enExample)}
                          className="p-1 rounded text-[#16a34a] dark:text-[#34d399] hover:bg-[#ecfdf5] dark:hover:bg-[#334155] transition-colors shrink-0"
                          title="İngilizce örnek cümleyi dinle"
                        >
                          <Volume2 width={16} height={16} fill="none" stroke="#16a34a" className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[#475569] dark:text-[#94a3b8] text-sm">
                        &quot;{currentWord.trExample}&quot;
                      </p>
                    </div>
                  </div>

                  {/* Bottom Prompt */}
                  <p className="text-sm text-[#16a34a] dark:text-[#34d399] font-medium mt-6 pt-3 border-t border-[#f1f5f9] dark:border-[#334155]">
                    Kelimeye dönmek için dokunun
                  </p>
                </div>
              )}
            </div>

            {/* Right Arrow Button - outside the flip-card onClick */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNext();
              }}
              disabled={currentIndex === deck.length - 1}
              aria-label="Sonraki Kelime"
              title="Sonraki Kelime"
              className={`absolute right-1 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-[#ffffff] dark:bg-[#1e293b] border-2 border-[#c7d2fe] dark:border-[#475569] shadow-lg flex items-center justify-center text-2xl font-bold leading-none text-[#334155] dark:text-[#e2e8f0] transition ${
                currentIndex === deck.length - 1
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-[#eef2ff] dark:hover:bg-[#1e1b4b] active:scale-95 cursor-pointer'
              }`}
            >
              ›
            </button>
          </div>

          {/* Action Decision Buttons: "Çalışılıyor" (Learning) vs "Öğrenildi" (Mastered) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              type="button"
              onClick={handleMarkReviewLater}
              className="min-h-[50px] py-3 px-4 rounded-2xl bg-[#fffbeb] hover:bg-[#fef3c7] active:bg-[#fde68a] dark:bg-[#451a03] dark:hover:bg-[#78350f] text-[#92400e] dark:text-[#fde68a] border border-[#fde68a] dark:border-[#92400e] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Clock width={16} height={16} fill="none" stroke="#d97706" className="w-4 h-4" />
              <span>Çalışılıyor</span>
              <span className="hidden sm:inline text-[11px] opacity-70">(R)</span>
            </button>

            <button
              type="button"
              onClick={handleMarkMastered}
              style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
              className="legacy-btn-green min-h-[50px] py-3 px-4 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] text-[#ffffff] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Check width={16} height={16} fill="none" stroke="#ffffff" className="w-4 h-4" />
              <span>Öğrenildi</span>
              <span className="hidden sm:inline text-[11px] opacity-80">(M)</span>
            </button>
          </div>

          {/* Previous / Next Deck Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                currentIndex === 0
                  ? 'opacity-40 cursor-not-allowed text-[#94a3b8]'
                  : 'text-[#334155] dark:text-[#cbd5e1] hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] cursor-pointer'
              }`}
            >
              <ChevronLeft width={16} height={16} fill="none" stroke={currentIndex === 0 ? '#94a3b8' : '#475569'} className="w-4 h-4" />
              <span>Önceki</span>
            </button>

            <span className="text-xs font-mono text-[#64748b] dark:text-[#94a3b8]">
              {currentIndex + 1} / {deck.length}
            </span>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === deck.length - 1}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                currentIndex === deck.length - 1
                  ? 'opacity-40 cursor-not-allowed text-[#94a3b8]'
                  : 'text-[#334155] dark:text-[#cbd5e1] hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] cursor-pointer'
              }`}
            >
              <span>Sonraki</span>
              <ChevronRight width={16} height={16} fill="none" stroke={currentIndex === deck.length - 1 ? '#94a3b8' : '#475569'} className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
