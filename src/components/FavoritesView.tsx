import React, { useState, useMemo } from 'react';
import {
  Heart,
  Volume2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  BookOpen,
  Mic,
  TrendingUp,
} from 'lucide-react';
import { WordEntry, PartOfSpeech, CefrLevel, WordStatus } from '../types';
import { VerbConjugationBadge } from '../utils/verbConjugation';
import { ProgressView } from './ProgressView';

interface FavoritesViewProps {
  words: WordEntry[];
  onToggleFavorite: (id: string) => void;
  onUpdateStatus: (id: string, status: WordStatus) => void;
  onPracticeWord?: (word: WordEntry) => void;
  onNavigateToDictionary?: () => void;
  highScore: number;
  classicBestTime: number | null;
  newRecordFlags: { classic: boolean; timeAttack: boolean };
  onClearNewRecordFlags: () => void;
  onNavigateToTab: (tab: 'flashcards' | 'games') => void;
}

type FavoritesSubTab = 'saved' | 'progress';
type FavPosFilter = 'all' | 'verb' | 'noun' | 'adj' | 'adv' | 'conjunction';
type FavSortOption = 'recent' | 'alphabetical';

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  words,
  onToggleFavorite,
  onUpdateStatus,
  onPracticeWord,
  onNavigateToDictionary,
  highScore,
  classicBestTime,
  newRecordFlags,
  onClearNewRecordFlags,
  onNavigateToTab,
}) => {
  const [subTab, setSubTab] = useState<FavoritesSubTab>('saved');
  const [posFilter, setPosFilter] = useState<FavPosFilter>('all');
  const [sortOption, setSortOption] = useState<FavSortOption>('recent');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Filter only favorited words
  const favoriteWords = useMemo(() => {
    return words.filter((w) => w.isFavorite);
  }, [words]);

  // Apply POS filter and sorting
  const filteredAndSortedWords = useMemo(() => {
    let result = [...favoriteWords];

    // Filter by Part of Speech
    if (posFilter !== 'all') {
      result = result.filter((w) => {
        const p = w.partOfSpeech;
        const t = w.type;
        if (posFilter === 'verb') return p === 'verb' || t === 'verb';
        if (posFilter === 'noun') return p === 'noun' || t === 'noun';
        if (posFilter === 'adj') return p === 'adjective' || p === 'adj' || t === 'adj';
        if (posFilter === 'adv') return p === 'adverb' || p === 'adv' || t === 'adv';
        if (posFilter === 'conjunction') return p === 'conjunction' || t === 'conjunction';
        return true;
      });
    }

    // Apply Sorting
    if (sortOption === 'alphabetical') {
      result.sort((a, b) => a.word.trim().localeCompare(b.word.trim(), 'en', { sensitivity: 'base' }));
    }
    // 'recent' retains the order as passed (or custom order)

    return result;
  }, [favoriteWords, posFilter, sortOption]);

  // English Audio speech handler
  const handleSpeakEnglish = (text: string, id: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      setSpeakingId(id);
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeakingId(null);
    }
  };

  const getCefrBadgeClass = (level: CefrLevel) => {
    switch (level) {
      case 'A1':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      case 'A2':
        return 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800';
      case 'B1':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      case 'B2':
        return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
    }
  };

  const getPosBadgeClass = (pos: PartOfSpeech) => {
    switch (pos) {
      case 'verb':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      case 'noun':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      case 'adjective':
      case 'adj':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
      case 'adverb':
      case 'adv':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
      case 'conjunction':
        return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
    }
  };

  const getPosTurkishLabel = (pos: PartOfSpeech) => {
    switch (pos) {
      case 'verb':
        return 'Fiil';
      case 'noun':
        return 'İsim';
      case 'adjective':
      case 'adj':
        return 'Sıfat';
      case 'adverb':
      case 'adv':
        return 'Zarf';
      case 'conjunction':
        return 'Bağlaç';
      default:
        return pos;
    }
  };

  const filterButtons: { id: FavPosFilter; label: string }[] = [
    { id: 'all', label: 'Tümü' },
    { id: 'verb', label: 'Fiil' },
    { id: 'noun', label: 'İsim' },
    { id: 'adj', label: 'Sıfat' },
    { id: 'adv', label: 'Zarf' },
    { id: 'conjunction', label: 'Bağlaç' },
  ];

  const hasNewRecord = Boolean(newRecordFlags.classic || newRecordFlags.timeAttack);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top 2-Tab Segmented Switcher: Kayıtlı Kelimelerim | Gelişimim */}
      <div
        role="tablist"
        aria-label="Defterim ve Gelişim sekmeleri"
        className="max-w-3xl mx-auto p-1.5 rounded-2xl bg-[#ffffff] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] shadow-xs grid grid-cols-2 gap-1.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'saved'}
          onClick={() => setSubTab('saved')}
          style={subTab === 'saved' ? { backgroundColor: '#16a34a', color: '#ffffff' } : undefined}
          className={`min-h-[44px] px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'saved'
              ? 'legacy-btn-green bg-[#16a34a] text-[#ffffff] shadow-xs'
              : 'text-[#475569] dark:text-[#cbd5e1] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a]'
          }`}
        >
          <Heart
            width={16}
            height={16}
            fill={subTab === 'saved' ? '#ffffff' : 'none'}
            stroke={subTab === 'saved' ? '#ffffff' : '#f43f5e'}
            className="w-4 h-4 shrink-0"
          />
          <span className="truncate">Kayıtlı Kelimelerim</span>
          <span
            className={`font-mono tabular-nums text-[11px] font-bold ${
              subTab === 'saved' ? 'text-[#dcfce7]' : 'text-[#64748b] dark:text-[#94a3b8]'
            }`}
          >
            ({favoriteWords.length})
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'progress'}
          onClick={() => setSubTab('progress')}
          style={subTab === 'progress' ? { backgroundColor: '#16a34a', color: '#ffffff' } : undefined}
          className={`min-h-[44px] px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'progress'
              ? 'legacy-btn-green bg-[#16a34a] text-[#ffffff] shadow-xs'
              : 'text-[#475569] dark:text-[#cbd5e1] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a]'
          }`}
        >
          <TrendingUp
            width={16}
            height={16}
            fill="none"
            stroke={subTab === 'progress' ? '#ffffff' : '#16a34a'}
            className="w-4 h-4 shrink-0"
          />
          <span>Gelişimim</span>
          {hasNewRecord && subTab !== 'progress' && (
            <span className="text-[10px] font-bold text-[#d97706] dark:text-[#fbbf24]">
              · Yeni Rekor
            </span>
          )}
        </button>
      </div>

      {subTab === 'progress' ? (
        <ProgressView
          words={words}
          highScore={highScore}
          classicBestTime={classicBestTime}
          newRecordFlags={newRecordFlags}
          onClearNewRecordFlags={onClearNewRecordFlags}
          onUpdateStatus={onUpdateStatus}
          onNavigateToTab={onNavigateToTab}
        />
      ) : (
        <div className="space-y-5 pb-24">
          {/* Top Header Card */}
          <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-5 sm:p-6 border border-[#fecdd3] dark:border-[#334155] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#ffe4e6] dark:bg-[#881337] flex items-center justify-center text-[#f43f5e]">
                <Heart width={20} height={20} fill="#f43f5e" stroke="#f43f5e" className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-[#0f172a] dark:text-[#f8fafc] tracking-tight">
                Kelime Defterim
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8]">
              Sınav öncesi odaklanmak istediğiniz favori kelimeleriniz ve notlarınız.
            </p>
          </div>

          {/* Counter Badge */}
          <div className="self-start sm:self-auto px-4 py-2 rounded-2xl bg-[#fff1f2] dark:bg-[#0f172a] border border-[#fecdd3] dark:border-[#334155] shadow-2xs flex items-center gap-2">
            <Heart width={16} height={16} fill="#f43f5e" stroke="#f43f5e" className="w-4 h-4 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-[#0f172a] dark:text-[#f8fafc] font-mono">
              {favoriteWords.length} Kelime Kaydedildi
            </span>
          </div>
        </div>

        {/* Filter and Sort Toolbar */}
        {favoriteWords.length > 0 && (
          <div className="mt-5 pt-4 border-t border-[#f1f5f9] dark:border-[#334155] flex flex-wrap items-center justify-between gap-3">
            {/* Part of Speech Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              {filterButtons.map((btn) => {
                const isActive = posFilter === btn.id;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => setPosFilter(btn.id)}
                    style={isActive ? { backgroundColor: '#e11d48', color: '#ffffff' } : undefined}
                    className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#e11d48] text-[#ffffff] shadow-sm font-semibold'
                        : 'bg-[#f8fafc] dark:bg-[#0f172a] text-[#475569] dark:text-[#94a3b8] hover:bg-[#fff1f2] dark:hover:bg-[#334155] border border-[#e2e8f0] dark:border-[#334155]'
                    }`}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#475569] dark:text-[#94a3b8] hidden sm:inline">Sıralama:</span>
              <button
                type="button"
                onClick={() => setSortOption(sortOption === 'recent' ? 'alphabetical' : 'recent')}
                className="px-3 py-1.5 rounded-xl bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] text-[#0f172a] dark:text-[#f8fafc] font-semibold hover:border-[#fb7185] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Sıralama biçimini değiştir"
              >
                <ArrowUpDown width={14} height={14} fill="none" stroke="#f43f5e" className="w-3.5 h-3.5" />
                <span>{sortOption === 'recent' ? 'Son Eklenenler' : 'A-Z Alfabetik'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {favoriteWords.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-[#ffffff] dark:bg-[#1e293b] border border-dashed border-[#cbd5e1] dark:border-[#334155] space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[#fff1f2] dark:bg-[#4c0519] border border-[#fecdd3] dark:border-[#881337] flex items-center justify-center text-[#f43f5e]">
            <Heart width={32} height={32} fill="#fda4af" stroke="#f43f5e" className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold font-['Outfit'] text-[#0f172a] dark:text-[#f8fafc]">
              Defteriniz Henüz Boş
            </h3>
            <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8] leading-relaxed">
              Henüz kelime eklemediniz. Kartlardaki kalp simgesine dokunarak kelimelerinizi buraya kaydedebilirsiniz.
            </p>
          </div>
          {onNavigateToDictionary && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onNavigateToDictionary}
                style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                className="legacy-btn-green inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-[#ffffff] font-semibold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <BookOpen width={16} height={16} fill="none" stroke="#ffffff" className="w-4 h-4" />
                <span>Sözlüğe Git ve Kelime Ekle</span>
              </button>
            </div>
          )}
        </div>
      ) : filteredAndSortedWords.length === 0 ? (
        <div className="p-8 text-center rounded-3xl bg-[#ffffff] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] space-y-2">
          <p className="text-sm font-semibold text-[#0f172a] dark:text-[#f8fafc]">
            Seçilen türde kaydedilmiş kelime bulunamadı.
          </p>
          <button
            type="button"
            onClick={() => setPosFilter('all')}
            className="text-xs font-bold text-[#e11d48] dark:text-[#fb7185] hover:underline cursor-pointer"
          >
            Tüm kaydedilenleri göster
          </button>
        </div>
      ) : (
        /* Saved Words List */
        <div className="grid grid-cols-1 gap-3.5">
          {filteredAndSortedWords.map((item) => {
            const isExpanded = expandedCardId === item.id;
            const isSpeakingWord = speakingId === `fav-word-${item.id}`;
            const isSpeakingEx = speakingId === `fav-ex-${item.id}`;
            const isOnlineEntry = Boolean(item.isOnlineDict || item.id.startsWith('online_'));
            const isOfflineEntry = Boolean(item.isOfflineDict || item.id.startsWith('offline_'));
            const hasCollocations = Boolean(
              !isOnlineEntry &&
              !isOfflineEntry &&
              Array.isArray(item.collocations) &&
              item.collocations.length > 0 &&
              item.collocations.some((c) => typeof c === 'string' && c.trim().length > 0)
            );
            const hasTip = Boolean(
              item.academicNote &&
              item.academicNote.trim().length > 0 &&
              !item.isGeneralDict &&
              !isOnlineEntry &&
              !isOfflineEntry
            );

            return (
              <article
                key={item.id}
                className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-5 border border-[#e2e8f0] dark:border-[#334155] hover:border-[#fb7185] dark:hover:border-[#fb7185] shadow-xs hover:shadow-md transition-all"
              >
                {/* Header Row: English Word, Audio, Badges, Heart Button */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-[#0f172a] dark:text-[#f8fafc] tracking-tight">
                        {item.word}
                      </h3>

                      {/* ENGLISH Word Audio Speaker */}
                      <button
                        type="button"
                        onClick={() => handleSpeakEnglish(item.word, `fav-word-${item.id}`)}
                        className={`p-1.5 rounded-xl text-[#64748b] hover:text-[#4f46e5] hover:bg-[#eef2ff] dark:hover:bg-[#1e1b4b] transition-colors ${
                          isSpeakingWord ? 'text-[#4f46e5] bg-[#eef2ff] dark:bg-[#1e1b4b] animate-pulse' : ''
                        }`}
                        title="İngilizce kelime telaffuzunu dinle"
                        aria-label={`İngilizce telaffuz: ${item.word}`}
                      >
                        <Volume2
                          width={20}
                          height={20}
                          fill="none"
                          stroke={isSpeakingWord ? '#4f46e5' : '#64748b'}
                          className="w-5 h-5"
                        />
                      </button>
                    </div>

                    {/* Badges & Learning Status */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {isOfflineEntry ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-[#E2F0D9] dark:bg-[#0F172A] text-[#0E2F0E] dark:text-[#F8FAFC] border border-[#B4C6A6] dark:border-[#334155]">
                          Çevrimdışı Sözlük 📖
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-lg tracking-wide ${getCefrBadgeClass(
                            item.cefrLevel
                          )}`}
                        >
                          {item.cefrLevel}
                        </span>
                      )}

                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-lg ${getPosBadgeClass(
                          item.partOfSpeech
                        )}`}
                      >
                        {item.offlinePosLabel || getPosTurkishLabel(item.partOfSpeech)}
                      </span>

                      {onUpdateStatus && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateStatus(
                              item.id,
                              item.status === 'ogrenildi' ? 'calisiliyor' : 'ogrenildi'
                            )
                          }
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 transition-all ${
                            item.status === 'ogrenildi'
                              ? 'bg-[#ecfdf5] dark:bg-[#022c22] text-[#15803d] dark:text-[#6ee7b7] border-[#a7f3d0] dark:border-[#065f46]'
                              : 'bg-[#fffbeb] dark:bg-[#451a03] text-[#b45309] dark:text-[#fcd34d] border-[#fde68a] dark:border-[#92400e]'
                          }`}
                          title="Öğrenme durumunu değiştir"
                        >
                          {item.status === 'ogrenildi' ? (
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

                    {/* Verb Conjugation (V1 / V2 / V3 or Regular) */}
                    <VerbConjugationBadge
                      word={item.word}
                      type={item.type}
                      partOfSpeech={item.partOfSpeech}
                      className="pt-0.5"
                    />
                  </div>

                  {/* Heart Icon Button with pop animation */}
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(item.id)}
                    className="p-2 rounded-xl text-[#f43f5e] hover:bg-[#fff1f2] dark:hover:bg-[#4c0519] transition-transform active:scale-125 cursor-pointer"
                    title="Kelime defterinden çıkar"
                    aria-label="Kelime defterinden çıkar"
                  >
                    <Heart width={20} height={20} fill="#f43f5e" stroke="#f43f5e" className="w-5 h-5" />
                  </button>
                </div>

                {/* Turkish Meaning - Tap to Expand in place */}
                <div
                  onClick={() => setExpandedCardId(isExpanded ? null : item.id)}
                  className="mt-3.5 pt-3 border-t border-[#f1f5f9] dark:border-[#334155] cursor-pointer flex items-center justify-between gap-2 hover:opacity-90"
                >
                  <p className="text-base sm:text-lg font-bold text-[#0f172a] dark:text-[#f8fafc]">
                    {item.trMeaning}
                  </p>
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#475569] hover:text-[#16a34a] dark:text-[#94a3b8] dark:hover:text-[#34d399] flex items-center gap-1 shrink-0"
                  >
                    <span>{isExpanded ? 'Gizle' : 'Detaylar'}</span>
                    {isExpanded ? (
                      <ChevronUp width={16} height={16} fill="none" stroke="#64748b" className="w-4 h-4" />
                    ) : (
                      <ChevronDown width={16} height={16} fill="none" stroke="#64748b" className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* In-Place Expanded Details Drawer */}
                {isExpanded && (
                  <div className="mt-3.5 pt-3 border-t border-dashed border-[#e2e8f0] dark:border-[#334155] space-y-3 animate-in fade-in duration-150">
                    {/* Turkish Explanation for online dictionary entries (never raw English definition) */}
                    {isOnlineEntry &&
                      item.trDefinition &&
                      item.trDefinition.trim().length > 0 &&
                      item.trDefinition.toLowerCase() !== item.trMeaning.toLowerCase() && (
                        <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8] leading-relaxed">
                          <span className="font-semibold text-[#2E7D32] dark:text-[#10B981] mr-1.5">
                            Türkçe Açıklama:
                          </span>
                          {item.trDefinition}
                        </p>
                      )}

                    {/* Example Sentence with Audio (only shown if a real example sentence exists) */}
                    {item.enExample && item.enExample.trim().length > 0 && (
                      <div className="bg-[#f8fafc] dark:bg-[#0f172a] rounded-2xl p-4 border border-[#e2e8f0] dark:border-[#334155] space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-[#0f172a] dark:text-[#f8fafc] leading-relaxed">
                            &quot;{item.enExample}&quot;
                          </p>
                          <button
                            type="button"
                            onClick={() => handleSpeakEnglish(item.enExample, `fav-ex-${item.id}`)}
                            className={`p-1.5 shrink-0 rounded-xl text-[#475569] hover:text-[#16a34a] hover:bg-[#ecfdf5] dark:hover:bg-[#334155] transition-colors ${
                              isSpeakingEx ? 'text-[#16a34a] animate-pulse' : ''
                            }`}
                            title="İngilizce örnek cümleyi dinle"
                          >
                            <Volume2
                              width={16}
                              height={16}
                              fill="none"
                              stroke={isSpeakingEx ? '#16a34a' : '#64748b'}
                              className="w-4 h-4"
                            />
                          </button>
                        </div>
                        {item.trExample && item.trExample.trim().length > 0 && (
                          <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8] italic">
                            &quot;{item.trExample}&quot;
                          </p>
                        )}
                      </div>
                    )}

                    {/* Academic Exam Tip */}
                    {hasTip && (
                      <div className="flex items-start gap-2.5 text-xs bg-[#fffbeb] dark:bg-[#451a03] p-3.5 rounded-2xl border border-[#fde68a] dark:border-[#92400e] text-[#451a03] dark:text-[#fef3c7]">
                        <Sparkles width={16} height={16} fill="none" stroke="#d97706" className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold block mb-0.5 text-[#451a03] dark:text-[#fde68a]">
                            Hazırlık Sınavı İpucu:
                          </strong>
                          <span className="leading-relaxed">{item.academicNote}</span>
                        </div>
                      </div>
                    )}

                    {/* Collocations */}
                    {hasCollocations && item.collocations && (
                      <div className="text-xs">
                        <span className="font-bold text-[#0f172a] dark:text-[#f8fafc] block mb-1.5">
                          Sık Kullanılan Birlikte Kullanımlar (Collocations):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.collocations.filter(Boolean).map((col, idx) => (
                            <span
                              key={idx}
                              className="bg-[#ffffff] dark:bg-[#0f172a] px-2.5 py-1 rounded-xl border border-[#e2e8f0] dark:border-[#334155] text-[#0f172a] dark:text-[#f8fafc] font-mono text-[11px]"
                            >
                              {col}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pronunciation Practice Action */}
                    {onPracticeWord && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onPracticeWord(item)}
                          className="text-xs font-bold text-[#4f46e5] dark:text-[#818cf8] hover:underline flex items-center gap-1.5 cursor-pointer"
                        >
                          <Mic width={14} height={14} fill="none" stroke="#4f46e5" className="w-3.5 h-3.5" />
                          <span>Telaffuz Testi Yap</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
        </div>
      )}
    </div>
  );
};
