import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  FilePenLine,
  ListChecks,
  FileText,
  ArrowLeftRight,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Heart,
  Volume2,
  RotateCcw,
  Trophy,
  BookOpen,
  Sparkles,
  Check,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WordEntry } from '../types';
import {
  ExerciseMode,
  ExerciseLevelFilter,
  OptionLetter,
  QuizOption,
  MultipleChoiceQuestion,
  ClozeTestSession,
  SynonymQuestion,
  getClozePassagesForFilter,
  generateMultipleChoiceQuiz,
  buildClozeTestSession,
  generateSynonymQuiz,
  getPosTurkishName,
} from '../data/exerciseGenerator';
import { speakText } from '../utils/textToSpeech';

interface ExercisesViewProps {
  words: WordEntry[];
  onToggleFavorite: (id: string, fallbackEntry?: WordEntry) => void;
  onAddWordsToFavorites: (wordIds: string[], fallbackEntries?: WordEntry[]) => void;
}

interface ExerciseStats {
  totalCompletedTests: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
}

const STATS_STORAGE_KEY = 'preplingo_exercise_stats_v1';

function loadStats(): ExerciseStats {
  if (typeof window === 'undefined') {
    return { totalCompletedTests: 0, totalQuestionsAnswered: 0, totalCorrect: 0 };
  }
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return { totalCompletedTests: 0, totalQuestionsAnswered: 0, totalCorrect: 0 };
    const parsed = JSON.parse(raw);
    return {
      totalCompletedTests: Number(parsed?.totalCompletedTests) || 0,
      totalQuestionsAnswered: Number(parsed?.totalQuestionsAnswered) || 0,
      totalCorrect: Number(parsed?.totalCorrect) || 0,
    };
  } catch {
    return { totalCompletedTests: 0, totalQuestionsAnswered: 0, totalCorrect: 0 };
  }
}

function saveStats(stats: ExerciseStats) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage quota errors
  }
}

interface ReviewItem {
  word: WordEntry;
  secondaryWord?: WordEntry;
  isCorrect: boolean;
  chosenWordText?: string;
}

export const ExercisesView: React.FC<ExercisesViewProps> = ({
  words,
  onToggleFavorite,
  onAddWordsToFavorites,
}) => {
  const [activeMode, setActiveMode] = useState<ExerciseMode | null>(null);
  const [levelFilter, setLevelFilter] = useState<ExerciseLevelFilter>('all');
  const [emptyNotice, setEmptyNotice] = useState<string | null>(null);
  const [stats, setStats] = useState<ExerciseStats>(() => loadStats());

  // Multiple Choice session state
  const [mcQuestions, setMcQuestions] = useState<MultipleChoiceQuestion[]>([]);
  const [mcIndex, setMcIndex] = useState(0);
  const [mcAnswers, setMcAnswers] = useState<Record<number, OptionLetter>>({});

  // Cloze Test session state
  const [clozePassageIndex, setClozePassageIndex] = useState(0);
  const [clozeSession, setClozeSession] = useState<ClozeTestSession | null>(null);
  const [activeBlankIdx, setActiveBlankIdx] = useState(0);
  const [clozeAnswers, setClozeAnswers] = useState<Record<number, OptionLetter>>({});

  // Synonyms session state
  const [synQuestions, setSynQuestions] = useState<SynonymQuestion[]>([]);
  const [synIndex, setSynIndex] = useState(0);
  const [synAnswers, setSynAnswers] = useState<Record<number, OptionLetter>>({});
  const [synJustAddedKeys, setSynJustAddedKeys] = useState<Record<string, boolean>>({});
  const [synDuplicateNotice, setSynDuplicateNotice] = useState<string | null>(null);
  const synNoticeTimeoutRef = useRef<number | null>(null);

  // Summary screen flag
  const [showSummary, setShowSummary] = useState(false);

  // Cleanup duplicate notice timer on unmount
  useEffect(() => {
    return () => {
      if (synNoticeTimeoutRef.current !== null) {
        window.clearTimeout(synNoticeTimeoutRef.current);
      }
    };
  }, []);

  const clearSynNotebookFeedback = useCallback(() => {
    setSynJustAddedKeys({});
    setSynDuplicateNotice(null);
    if (synNoticeTimeoutRef.current !== null) {
      window.clearTimeout(synNoticeTimeoutRef.current);
      synNoticeTimeoutRef.current = null;
    }
  }, []);

  // Live favorite & word lookup so notebook actions reflect immediately without resetting the active test
  const favoriteIdSet = useMemo(() => {
    const set = new Set<string>();
    for (const w of words) {
      if (w.isFavorite) set.add(w.id);
    }
    return set;
  }, [words]);

  const favoriteWordKeySet = useMemo(() => {
    const set = new Set<string>();
    for (const w of words) {
      if (w.isFavorite && w.word) {
        set.add(w.word.toLowerCase().trim());
      }
    }
    return set;
  }, [words]);

  const wordsByKey = useMemo(() => {
    const map = new Map<string, WordEntry>();
    for (const w of words) {
      if (!w.word) continue;
      const key = w.word.toLowerCase().trim();
      const existing = map.get(key);
      if (!existing || (!existing.isFavorite && w.isFavorite)) {
        map.set(key, w);
      }
    }
    return map;
  }, [words]);

  // Strictly filtered Cloze passages for the currently selected CEFR level
  const filteredClozePassages = useMemo(
    () => getClozePassagesForFilter(levelFilter),
    [levelFilter]
  );

  const recordTestCompletion = useCallback((correctCount: number, totalCount: number) => {
    setStats((prev) => {
      const next: ExerciseStats = {
        totalCompletedTests: prev.totalCompletedTests + 1,
        totalQuestionsAnswered: prev.totalQuestionsAnswered + totalCount,
        totalCorrect: prev.totalCorrect + correctCount,
      };
      saveStats(next);
      return next;
    });

    if (totalCount > 0 && correctCount / totalCount >= 0.8) {
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.48 },
      });
    }
  }, []);

  const handleSelectFilter = (nextFilter: ExerciseLevelFilter) => {
    setLevelFilter(nextFilter);
    setClozePassageIndex(0);
    setEmptyNotice(null);
  };

  // Launch handlers
  const startMultipleChoice = useCallback(
    (overrideFilter?: ExerciseLevelFilter) => {
      const filterToUse = overrideFilter ?? levelFilter;
      const generated = generateMultipleChoiceQuiz(words, filterToUse, 10);
      if (generated.length === 0) {
        setEmptyNotice(
          'Seçili seviyede örnek cümleli yeterli kelime bulunamadı. "Tümü", "A1–A2" veya "B1–B2" seviyelerinden birini seçebilirsiniz.'
        );
        return;
      }
      setEmptyNotice(null);
      setMcQuestions(generated);
      setMcIndex(0);
      setMcAnswers({});
      setShowSummary(false);
      setActiveMode('multiple-choice');
    },
    [words, levelFilter]
  );

  const startClozeTest = useCallback(
    (passageIdx?: number, overrideFilter?: ExerciseLevelFilter) => {
      const filterToUse = overrideFilter ?? levelFilter;
      const targetIdx = typeof passageIdx === 'number' ? passageIdx : 0;
      const session = buildClozeTestSession(words, filterToUse, targetIdx);
      if (!session) {
        setEmptyNotice(
          'Seçili seviyede Cloze Test paragrafı bulunamadı. "Tümü", "A1–A2" veya "B1–B2" seviyesini seçebilirsiniz.'
        );
        return;
      }
      setEmptyNotice(null);
      setClozePassageIndex(session.passageIndex);
      setClozeSession(session);
      setActiveBlankIdx(0);
      setClozeAnswers({});
      setShowSummary(false);
      setActiveMode('cloze-test');
    },
    [words, levelFilter]
  );

  const startSynonyms = useCallback(
    (overrideFilter?: ExerciseLevelFilter) => {
      const filterToUse = overrideFilter ?? levelFilter;
      const generated = generateSynonymQuiz(words, filterToUse, 10);
      if (generated.length === 0) {
        setEmptyNotice(
          'Seçili seviyede eş anlamlı sorusu bulunamadı. "Tümü", "A1–A2" veya "B1–B2" seviyelerinden birini seçebilirsiniz.'
        );
        return;
      }
      setEmptyNotice(null);
      setSynQuestions(generated);
      setSynIndex(0);
      setSynAnswers({});
      clearSynNotebookFeedback();
      setShowSummary(false);
      setActiveMode('synonyms');
    },
    [words, levelFilter, clearSynNotebookFeedback]
  );

  const handleBackToHub = () => {
    clearSynNotebookFeedback();
    setActiveMode(null);
    setShowSummary(false);
  };

  // Option selection handlers
  const handleSelectMcOption = (letter: OptionLetter) => {
    if (mcAnswers[mcIndex]) return;
    setMcAnswers((prev) => ({ ...prev, [mcIndex]: letter }));
  };

  const handleNextMc = () => {
    if (mcIndex + 1 < mcQuestions.length) {
      setMcIndex((prev) => prev + 1);
    } else {
      const correctCount = mcQuestions.reduce(
        (acc, q, idx) => acc + (mcAnswers[idx] === q.correctLetter ? 1 : 0),
        0
      );
      recordTestCompletion(correctCount, mcQuestions.length);
      setShowSummary(true);
    }
  };

  const handleSelectClozeOption = (letter: OptionLetter) => {
    if (clozeAnswers[activeBlankIdx]) return;
    setClozeAnswers((prev) => ({ ...prev, [activeBlankIdx]: letter }));
  };

  const handleNextClozeBlank = () => {
    if (!clozeSession) return;
    const total = clozeSession.blanks.length;
    const answeredCount = Object.keys(clozeAnswers).length;
    if (answeredCount >= total) {
      const correctCount = clozeSession.blanks.reduce(
        (acc, b, idx) => acc + (clozeAnswers[idx] === b.correctLetter ? 1 : 0),
        0
      );
      recordTestCompletion(correctCount, total);
      setShowSummary(true);
      return;
    }

    for (let offset = 1; offset <= total; offset++) {
      const candidate = (activeBlankIdx + offset) % total;
      if (!clozeAnswers[candidate]) {
        setActiveBlankIdx(candidate);
        return;
      }
    }
  };

  const handleSelectSynOption = (letter: OptionLetter) => {
    if (synAnswers[synIndex]) return;
    setSynAnswers((prev) => ({ ...prev, [synIndex]: letter }));
  };

  const handleNextSyn = () => {
    clearSynNotebookFeedback();
    if (synIndex + 1 < synQuestions.length) {
      setSynIndex((prev) => prev + 1);
    } else {
      const correctCount = synQuestions.reduce(
        (acc, q, idx) => acc + (synAnswers[idx] === q.correctLetter ? 1 : 0),
        0
      );
      recordTestCompletion(correctCount, synQuestions.length);
      setShowSummary(true);
    }
  };

  const formatWordLabel = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  };

  const handleAddSynonymWordToNotebook = (word: WordEntry) => {
    const normalizedKey = word.word.toLowerCase().trim();
    const displayWord = formatWordLabel(word.word);

    // Prevent double-clicking after the word has already been added on this question
    if (synJustAddedKeys[normalizedKey]) return;

    // If the word is already in Defterim, warn the user without duplicating or removing it
    if (favoriteIdSet.has(word.id) || favoriteWordKeySet.has(normalizedKey)) {
      setSynDuplicateNotice(`"${displayWord}" kelimesi zaten defterinizde mevcuttur.`);
      if (synNoticeTimeoutRef.current !== null) {
        window.clearTimeout(synNoticeTimeoutRef.current);
      }
      synNoticeTimeoutRef.current = window.setTimeout(() => {
        setSynDuplicateNotice(null);
        synNoticeTimeoutRef.current = null;
      }, 4500);
      return;
    }

    // Add word along with its Turkish meaning to Defterim
    const existingEntry = wordsByKey.get(normalizedKey);
    if (existingEntry) {
      onAddWordsToFavorites([existingEntry.id], [existingEntry]);
    } else {
      onAddWordsToFavorites([word.id], [word]);
    }

    setSynJustAddedKeys((prev) => ({ ...prev, [normalizedKey]: true }));
    setSynDuplicateNotice(null);
    if (synNoticeTimeoutRef.current !== null) {
      window.clearTimeout(synNoticeTimeoutRef.current);
      synNoticeTimeoutRef.current = null;
    }
  };

  const renderSynonymAddButton = (word: WordEntry) => {
    const normalizedKey = word.word.toLowerCase().trim();
    const displayWord = formatWordLabel(word.word);
    const isJustAdded = Boolean(synJustAddedKeys[normalizedKey]);
    const isAlreadySaved = favoriteIdSet.has(word.id) || favoriteWordKeySet.has(normalizedKey);
    const isHeartFilled = isJustAdded || isAlreadySaved;

    return (
      <button
        type="button"
        disabled={isJustAdded}
        aria-disabled={isJustAdded}
        onClick={(e) => {
          e.stopPropagation();
          handleAddSynonymWordToNotebook(word);
        }}
        className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
          isJustAdded
            ? 'bg-[#dcfce7] dark:bg-[#064e3b] border-[#16a34a] dark:border-[#10b981] text-[#15803d] dark:text-[#6ee7b7] cursor-default'
            : isAlreadySaved
            ? 'bg-[#fff1f2] dark:bg-[#4c0519] border-[#fda4af] dark:border-[#be123c] text-[#9f1239] dark:text-[#fecdd3] hover:border-[#ef4444] cursor-pointer active:scale-95'
            : 'bg-[#ffffff] dark:bg-[#0f172a] border-[#cbd5e1] dark:border-[#475569] text-[#0f172a] dark:text-[#f8fafc] hover:border-[#fb7185] cursor-pointer active:scale-95'
        }`}
        title={
          isJustAdded
            ? `"${displayWord}" Defterime eklendi`
            : isAlreadySaved
            ? `"${displayWord}" kelimesi zaten defterinizde mevcuttur`
            : `"${displayWord}" (${word.trMeaning}) kelimesini Defterime ekle`
        }
      >
        <Heart
          width={15}
          height={15}
          fill={isHeartFilled ? '#ef4444' : 'none'}
          stroke={isHeartFilled ? '#ef4444' : '#f43f5e'}
          className="w-4 h-4 shrink-0"
        />
        <span>{isJustAdded ? 'Eklendi ✓' : `"${displayWord}" Ekle`}</span>
      </button>
    );
  };

  // Helper: inline one-click Defterime Ekle button
  const renderNotebookToggle = (word: WordEntry, compact = false) => {
    const isSaved = favoriteIdSet.has(word.id);
    if (compact) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(word.id, word);
          }}
          className={`min-h-[34px] min-w-[34px] px-2 py-1 rounded-lg border text-[11px] font-semibold inline-flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0 ${
            isSaved
              ? 'bg-[#fff1f2] dark:bg-[#4c0519] border-[#fb7185] text-[#be123c] dark:text-[#fda4af]'
              : 'bg-[#f8fafc] dark:bg-[#0f172a] border-[#e2e8f0] dark:border-[#334155] text-[#475569] dark:text-[#cbd5e1] hover:border-[#fb7185]'
          }`}
          title={isSaved ? 'Defterimden çıkar' : `"${word.word}" kelimesini Defterime ekle`}
          aria-label={isSaved ? `${word.word} defterimden çıkar` : `${word.word} defterime ekle`}
        >
          <Heart
            width={13}
            height={13}
            fill={isSaved ? '#f43f5e' : 'none'}
            stroke={isSaved ? '#f43f5e' : '#64748b'}
            className="w-3.5 h-3.5 shrink-0"
          />
          <span className="hidden sm:inline whitespace-nowrap">{isSaved ? 'Defterimde' : 'Ekle'}</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(word.id, word);
        }}
        className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
          isSaved
            ? 'bg-[#fff1f2] dark:bg-[#4c0519] border-[#fb7185] text-[#be123c] dark:text-[#fda4af]'
            : 'bg-[#ffffff] dark:bg-[#0f172a] border-[#cbd5e1] dark:border-[#475569] text-[#0f172a] dark:text-[#f8fafc] hover:border-[#fb7185]'
        }`}
        title={isSaved ? 'Defterimden çıkar' : 'Defterime ekle'}
      >
        <Heart
          width={15}
          height={15}
          fill={isSaved ? '#f43f5e' : 'none'}
          stroke="#f43f5e"
          className="w-4 h-4 shrink-0"
        />
        <span>{isSaved ? 'Defterimde' : 'Defterime Ekle'}</span>
      </button>
    );
  };

  // Helper: render 5 options (A, B, C, D, E) consistently across all 3 exam modes
  const renderOptionList = (
    options: QuizOption[],
    selectedLetter: OptionLetter | undefined,
    correctLetter: OptionLetter,
    onSelect: (letter: OptionLetter) => void
  ) => {
    const isAnswered = Boolean(selectedLetter);

    return (
      <div className="space-y-2.5" role="radiogroup" aria-label="Test seçenekleri">
        {options.map((opt) => {
          const isSelected = selectedLetter === opt.letter;
          const isCorrect = opt.letter === correctLetter;

          let containerClass =
            'bg-[#FFFFFF] dark:bg-[#1E293B] border-[#B4C6A6] dark:border-[#334155] hover:border-[#388E3C] dark:hover:border-[#4F46E5] text-[#0E2F0E] dark:text-[#F8FAFC]';
          let letterClass =
            'bg-[#E2F0D9] dark:bg-[#0F172A] text-[#0E2F0E] dark:text-[#F8FAFC] border-[#B4C6A6] dark:border-[#334155]';

          if (isAnswered) {
            if (isCorrect) {
              containerClass =
                'bg-[#C8E6C9] dark:bg-[#059669] border-[#81C784] dark:border-[#10B981] text-[#0E2F0E] dark:text-[#FFFFFF]';
              letterClass =
                'bg-[#388E3C] dark:bg-[#10B981] text-[#FFFFFF] border-[#2E7D32] dark:border-[#059669]';
            } else if (isSelected && !isCorrect) {
              containerClass =
                'bg-[#FFF1F2] dark:bg-[#4C0519] border-[#E11D48] dark:border-[#FB7185] text-[#9F1239] dark:text-[#FECDD3]';
              letterClass = 'bg-[#E11D48] text-[#FFFFFF] border-[#BE123C]';
            } else {
              containerClass =
                'bg-[#F3F9EF] dark:bg-[#0F172A] border-[#B4C6A6] dark:border-[#334155] text-[#2D4A2D] dark:text-[#94A3B8]';
            }
          }

          return (
            <div
              key={opt.letter}
              className={`w-full rounded-2xl border-2 transition-all flex items-center justify-between gap-2 px-3.5 py-2.5 min-h-[54px] ${containerClass} ${
                !isAnswered ? 'cursor-pointer active:scale-[0.99]' : ''
              }`}
              onClick={() => {
                if (!isAnswered) onSelect(opt.letter);
              }}
              role="radio"
              aria-checked={isSelected}
              tabIndex={isAnswered ? -1 : 0}
              onKeyDown={(e) => {
                if (!isAnswered && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onSelect(opt.letter);
                }
              }}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span
                  className={`w-8 h-8 rounded-xl border font-mono font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${letterClass}`}
                >
                  {opt.letter}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="font-semibold text-sm sm:text-base">{opt.text}</span>
                    {isAnswered && (
                      <span className="text-xs text-[#475569] dark:text-[#cbd5e1] truncate">
                        — {opt.wordEntry.trMeaning}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isAnswered && isCorrect && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#15803d] dark:text-[#34d399]">
                    <CheckCircle2 width={16} height={16} fill="none" stroke="currentColor" className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">Doğru</span>
                  </span>
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#be123c] dark:text-[#fda4af]">
                    <XCircle width={16} height={16} fill="none" stroke="currentColor" className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">Yanlış</span>
                  </span>
                )}
                {isAnswered && renderNotebookToggle(opt.wordEntry, true)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // =========================================================================
  // 1. TEST SUMMARY / SCORE SCREEN
  // =========================================================================
  if (activeMode && showSummary) {
    let totalCount = 0;
    let correctCount = 0;
    let modeTitle = '';
    const reviewItems: ReviewItem[] = [];

    if (activeMode === 'multiple-choice') {
      modeTitle = 'Çoktan Seçmeli (Multiple Choice)';
      totalCount = mcQuestions.length;
      mcQuestions.forEach((q, idx) => {
        const chosen = mcAnswers[idx];
        const isCorrect = chosen === q.correctLetter;
        if (isCorrect) correctCount++;
        const chosenOpt = q.options.find((o) => o.letter === chosen);
        reviewItems.push({
          word: q.targetWord,
          isCorrect,
          chosenWordText: chosenOpt?.text,
        });
      });
    } else if (activeMode === 'cloze-test' && clozeSession) {
      modeTitle = `Cloze Test (${clozeSession.cefrBadge}) · ${clozeSession.titleTr}`;
      totalCount = clozeSession.blanks.length;
      clozeSession.blanks.forEach((b, idx) => {
        const chosen = clozeAnswers[idx];
        const isCorrect = chosen === b.correctLetter;
        if (isCorrect) correctCount++;
        const chosenOpt = b.options.find((o) => o.letter === chosen);
        reviewItems.push({
          word: b.targetWord,
          isCorrect,
          chosenWordText: chosenOpt?.text,
        });
      });
    } else if (activeMode === 'synonyms') {
      modeTitle = 'Eş Anlamlılar (Synonyms)';
      totalCount = synQuestions.length;
      synQuestions.forEach((q, idx) => {
        const chosen = synAnswers[idx];
        const isCorrect = chosen === q.correctLetter;
        if (isCorrect) correctCount++;
        const chosenOpt = q.options.find((o) => o.letter === chosen);
        reviewItems.push({
          word: q.promptWord,
          secondaryWord: q.correctSynonym,
          isCorrect,
          chosenWordText: chosenOpt?.text,
        });
      });
    }

    const wrongCount = Math.max(0, totalCount - correctCount);
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    const unsavedMissedEntries = reviewItems
      .filter((r) => !r.isCorrect)
      .flatMap((r) => (r.secondaryWord ? [r.word, r.secondaryWord] : [r.word]))
      .filter((entry, index, arr) => arr.findIndex((e) => e.id === entry.id) === index)
      .filter((entry) => !favoriteIdSet.has(entry.id));

    const performanceNote =
      accuracy >= 85
        ? 'Harika bir performans! Bu seviyedeki kelimelere çok güçlü bir hakimiyet gösterdiniz.'
        : accuracy >= 60
        ? 'İyi ilerliyorsunuz! Yanlış yaptığınız kelimeleri Defterim listesine ekleyip tekrar ederek skoru yükseltebilirsiniz.'
        : 'Güzel bir başlangıç! Hatalı sorulardaki kelimeleri tek tıkla Defterime ekleyip kartlarla pekiştirebilirsiniz.';

    return (
      <div className="max-w-3xl mx-auto space-y-5 pb-24 animate-in fade-in duration-200">
        {/* Result Summary Card */}
        <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] dark:border-[#334155] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#16a34a] dark:text-[#34d399]">{modeTitle}</p>
              <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-[#0f172a] dark:text-[#f8fafc] tracking-tight">
                Test Tamamlandı
              </h2>
              <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8] leading-relaxed max-w-xl">
                {performanceNote}
              </p>
            </div>

            <div className="self-start sm:self-auto px-5 py-3.5 rounded-2xl bg-[#ecfdf5] dark:bg-[#022c22] border border-[#a7f3d0] dark:border-[#065f46] text-center shrink-0">
              <span className="text-[11px] font-semibold text-[#047857] dark:text-[#6ee7b7] block">
                Başarı Oranı
              </span>
              <span className="text-3xl font-extrabold font-mono tabular-nums text-[#15803d] dark:text-[#34d399]">
                %{accuracy}
              </span>
            </div>
          </div>

          {/* Correct / Wrong / Total KPI strip */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="rounded-2xl p-3.5 bg-[#ecfdf5] dark:bg-[#0f172a] border border-[#a7f3d0] dark:border-[#334155]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#15803d] dark:text-[#34d399]">
                <CheckCircle2 width={15} height={15} fill="none" stroke="currentColor" className="w-4 h-4 shrink-0" />
                <span>Doğru</span>
              </div>
              <span className="text-2xl font-extrabold font-mono tabular-nums text-[#0f172a] dark:text-[#f8fafc] block mt-1">
                {correctCount}
              </span>
            </div>

            <div className="rounded-2xl p-3.5 bg-[#fff1f2] dark:bg-[#0f172a] border border-[#fecdd3] dark:border-[#334155]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#be123c] dark:text-[#fda4af]">
                <XCircle width={15} height={15} fill="none" stroke="currentColor" className="w-4 h-4 shrink-0" />
                <span>Yanlış</span>
              </div>
              <span className="text-2xl font-extrabold font-mono tabular-nums text-[#0f172a] dark:text-[#f8fafc] block mt-1">
                {wrongCount}
              </span>
            </div>

            <div className="rounded-2xl p-3.5 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] dark:text-[#cbd5e1]">
                <Trophy width={15} height={15} fill="none" stroke="#d97706" className="w-4 h-4 shrink-0" />
                <span>Toplam</span>
              </div>
              <span className="text-2xl font-extrabold font-mono tabular-nums text-[#0f172a] dark:text-[#f8fafc] block mt-1">
                {correctCount}/{totalCount}
              </span>
            </div>
          </div>

          {/* Cloze Test Passage Turkish Summary */}
          {activeMode === 'cloze-test' && clozeSession && (
            <div className="p-4 rounded-2xl bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] space-y-1">
              <span className="text-xs font-bold text-[#0f172a] dark:text-[#f8fafc] block">
                Paragraf Özeti (Türkçe)
              </span>
              <p className="text-xs sm:text-sm text-[#475569] dark:text-[#cbd5e1] leading-relaxed">
                {clozeSession.passageSummaryTr}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                if (activeMode === 'multiple-choice') startMultipleChoice();
                else if (activeMode === 'cloze-test') startClozeTest(clozePassageIndex + 1);
                else startSynonyms();
              }}
              style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
              className="legacy-btn-green min-h-[44px] px-5 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-[#ffffff] font-semibold text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <RotateCcw width={16} height={16} fill="none" stroke="#ffffff" className="w-4 h-4 shrink-0" />
              <span>{activeMode === 'cloze-test' ? 'Sonraki Paragrafa Geç' : 'Yeni Test Çöz'}</span>
            </button>

            <button
              type="button"
              onClick={handleBackToHub}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#0f172a] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] border border-[#e2e8f0] dark:border-[#334155] text-[#0f172a] dark:text-[#f8fafc] font-semibold text-xs sm:text-sm inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft width={16} height={16} fill="none" stroke="currentColor" className="w-4 h-4 shrink-0" />
              <span>Alıştırmalara Dön</span>
            </button>

            {unsavedMissedEntries.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  onAddWordsToFavorites(
                    unsavedMissedEntries.map((e) => e.id),
                    unsavedMissedEntries
                  )
                }
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#fff1f2] dark:bg-[#4c0519] hover:bg-[#ffe4e6] dark:hover:bg-[#881337] border border-[#fda4af] dark:border-[#be123c] text-[#be123c] dark:text-[#fecdd3] font-semibold text-xs sm:text-sm inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Heart width={15} height={15} fill="#f43f5e" stroke="#f43f5e" className="w-4 h-4 shrink-0" />
                <span>Yanlışları Defterime Ekle ({unsavedMissedEntries.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Tested Words Review List */}
        <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-5 sm:p-6 border border-[#e2e8f0] dark:border-[#334155] shadow-xs space-y-3">
          <h3 className="text-sm sm:text-base font-bold font-['Outfit'] text-[#0f172a] dark:text-[#f8fafc]">
            Testteki Kelimeler ({reviewItems.length})
          </h3>
          <div className="divide-y divide-[#f1f5f9] dark:divide-[#334155]">
            {reviewItems.map((item, idx) => (
              <div
                key={`${item.word.id}_${idx}`}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  {item.isCorrect ? (
                    <CheckCircle2
                      width={18}
                      height={18}
                      fill="none"
                      stroke="#16a34a"
                      className="w-4 h-4 shrink-0 mt-0.5"
                    />
                  ) : (
                    <XCircle
                      width={18}
                      height={18}
                      fill="none"
                      stroke="#e11d48"
                      className="w-4 h-4 shrink-0 mt-0.5"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-bold text-sm text-[#0f172a] dark:text-[#f8fafc]">
                        {item.word.word}
                        {item.secondaryWord ? ` = ${item.secondaryWord.word}` : ''}
                      </span>
                      <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">
                        {item.word.cefrLevel} · {getPosTurkishName(item.word.partOfSpeech || item.word.type)}
                      </span>
                      <button
                        type="button"
                        onClick={() => speakText(item.word.word, 'en-US', 0.95)}
                        className="p-1 rounded-lg text-[#64748b] hover:text-[#16a34a] transition-colors cursor-pointer"
                        title="Telaffuzu dinle"
                      >
                        <Volume2 width={14} height={14} fill="none" stroke="currentColor" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-[#475569] dark:text-[#cbd5e1] mt-0.5">
                      {item.word.trMeaning}
                      {!item.isCorrect && item.chosenWordText && (
                        <span className="text-[#be123c] dark:text-[#fda4af]">
                          {' '}· Seçiminiz: {item.chosenWordText}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  {renderNotebookToggle(item.word, true)}
                  {item.secondaryWord && renderNotebookToggle(item.secondaryWord, true)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. ACTIVE TEST: MULTIPLE CHOICE (5-OPTION A-E)
  // =========================================================================
  if (activeMode === 'multiple-choice' && mcQuestions.length > 0) {
    const currentQ = mcQuestions[mcIndex];
    const selectedLetter = mcAnswers[mcIndex];
    const isAnswered = Boolean(selectedLetter);
    const isCorrect = selectedLetter === currentQ.correctLetter;
    const chosenOption = currentQ.options.find((o) => o.letter === selectedLetter);

    const liveCorrect = Object.entries(mcAnswers).filter(
      ([idx, letter]) => mcQuestions[Number(idx)]?.correctLetter === letter
    ).length;
    const liveWrong = Object.keys(mcAnswers).length - liveCorrect;
    const progressPct = Math.round(((mcIndex + (isAnswered ? 1 : 0)) / mcQuestions.length) * 100);

    return (
      <div className="max-w-3xl mx-auto space-y-4 pb-24 animate-in fade-in duration-200">
        {/* Top Exam Progress Bar */}
        <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-2xl p-4 border border-[#e2e8f0] dark:border-[#334155] shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleBackToHub}
              className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-semibold text-[#475569] dark:text-[#cbd5e1] hover:bg-[#f1f5f9] dark:hover:bg-[#0f172a] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft width={15} height={15} fill="none" stroke="currentColor" className="w-4 h-4" />
              <span>Alıştırmalar</span>
            </button>

            <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
              <span className="font-semibold text-[#0f172a] dark:text-[#f8fafc]">
                Soru {mcIndex + 1}/{mcQuestions.length}
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-[#15803d] dark:text-[#34d399]">
                <CheckCircle2 width={14} height={14} fill="none" stroke="currentColor" className="w-3.5 h-3.5" />
                {liveCorrect}
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-[#be123c] dark:text-[#fda4af]">
                <XCircle width={14} height={14} fill="none" stroke="currentColor" className="w-3.5 h-3.5" />
                {liveWrong}
              </span>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-[#f1f5f9] dark:bg-[#0f172a] overflow-hidden">
            <div
              className="h-full bg-[#16a34a] rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-5 sm:p-7 border border-[#e2e8f0] dark:border-[#334155] shadow-sm space-y-5">
          {/* Quiet unboxed metadata line */}
          <div className="flex items-center justify-between gap-2 text-xs text-[#64748b] dark:text-[#94a3b8]">
            <span>
              Çoktan Seçmeli · {currentQ.cefrLabel} ·{' '}
              {getPosTurkishName(currentQ.targetWord.partOfSpeech || currentQ.targetWord.type)}
            </span>
            {isAnswered && (
              <button
                type="button"
                onClick={() => speakText(currentQ.fullSentenceEn, 'en-US', 0.92)}
                className="inline-flex items-center gap-1 text-[#16a34a] dark:text-[#34d399] font-semibold hover:underline cursor-pointer"
                title="Cümleyi dinle"
              >
                <Volume2 width={15} height={15} fill="none" stroke="currentColor" className="w-4 h-4" />
                <span>Cümleyi Dinle</span>
              </button>
            )}
          </div>

          {/* Sentence with Blank */}
          <p className="text-base sm:text-lg font-medium leading-[1.8] text-[#0f172a] dark:text-[#f8fafc]">
            {currentQ.sentenceBefore}
            <span
              className={`inline-block mx-1 px-2.5 py-0.5 rounded-lg font-bold border-b-2 transition-colors ${
                !isAnswered
                  ? 'bg-[#ecfdf5] dark:bg-[#0f172a] border-[#16a34a] text-[#15803d] dark:text-[#34d399] font-mono'
                  : isCorrect
                  ? 'bg-[#dcfce7] dark:bg-[#064e3b] border-[#16a34a] text-[#15803d] dark:text-[#6ee7b7]'
                  : 'bg-[#fef3c7] dark:bg-[#451a03] border-[#d97706] text-[#92400e] dark:text-[#fcd34d]'
              }`}
            >
              {isAnswered
                ? currentQ.options.find((o) => o.letter === currentQ.correctLetter)?.text
                : '________'}
            </span>
            {currentQ.sentenceAfter}
          </p>

          {/* 5 Options A-E */}
          {renderOptionList(
            currentQ.options,
            selectedLetter,
            currentQ.correctLetter,
            handleSelectMcOption
          )}

          {/* Instant Feedback & Explanation Panel */}
          {isAnswered && (
            <div
              className={`rounded-2xl p-4 sm:p-5 border space-y-3 animate-in fade-in duration-150 ${
                isCorrect
                  ? 'bg-[#ecfdf5] dark:bg-[#022c22] border-[#a7f3d0] dark:border-[#065f46]'
                  : 'bg-[#fff1f2] dark:bg-[#1e293b] border-[#fecdd3] dark:border-[#9f1239]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <CheckCircle2 width={20} height={20} fill="none" stroke="#16a34a" className="w-5 h-5 shrink-0" />
                  ) : (
                    <XCircle width={20} height={20} fill="none" stroke="#e11d48" className="w-5 h-5 shrink-0" />
                  )}
                  <span
                    className={`font-bold text-sm ${
                      isCorrect
                        ? 'text-[#065f46] dark:text-[#6ee7b7]'
                        : 'text-[#9f1239] dark:text-[#fda4af]'
                    }`}
                  >
                    {isCorrect
                      ? `Doğru Cevap! (${currentQ.correctLetter})`
                      : `Yanlış Cevap — Doğru şık: ${currentQ.correctLetter} (${currentQ.targetWord.word})`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => speakText(currentQ.targetWord.word, 'en-US', 0.92)}
                  className="text-xs font-semibold text-[#0f172a] dark:text-[#f8fafc] inline-flex items-center gap-1 hover:text-[#16a34a] cursor-pointer"
                >
                  <Volume2 width={14} height={14} fill="none" stroke="currentColor" className="w-3.5 h-3.5" />
                  <span>{currentQ.targetWord.word}</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-[#334155] dark:text-[#e2e8f0] leading-relaxed">
                {currentQ.explanationTr}
              </p>

              {!isCorrect && chosenOption && (
                <p className="text-xs text-[#9f1239] dark:text-[#fda4af]">
                  Seçtiğiniz <strong>{chosenOption.wordEntry.word}</strong> kelimesi{' '}
                  &ldquo;{chosenOption.wordEntry.trMeaning}&rdquo; anlamına gelir.
                </p>
              )}

              {currentQ.fullSentenceTr && (
                <p className="text-xs text-[#475569] dark:text-[#94a3b8] italic pt-1 border-t border-[#e2e8f0] dark:border-[#334155]">
                  Çeviri: &ldquo;{currentQ.fullSentenceTr}&rdquo;
                </p>
              )}

              {currentQ.examTip && (
                <p className="text-xs text-[#92400e] dark:text-[#fcd34d] flex items-start gap-1.5">
                  <Sparkles width={14} height={14} fill="none" stroke="currentColor" className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    <strong>Sınav İpucu:</strong> {currentQ.examTip}
                  </span>
                </p>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
                {renderNotebookToggle(currentQ.targetWord)}

                <button
                  type="button"
                  onClick={handleNextMc}
                  style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                  className="legacy-btn-green min-h-[42px] px-5 py-2 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-[#ffffff] font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap ml-auto"
                >
                  <span>{mcIndex + 1 < mcQuestions.length ? 'Sonraki Soru' : 'Skoru Gör'}</span>
                  <ArrowRight width={16} height={16} fill="none" stroke="#ffffff" className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. ACTIVE TEST: CLOZE TEST (5-BLANK PARAGRAPH STRICTLY BY CEFR LEVEL)
  // =========================================================================
  if (activeMode === 'cloze-test' && clozeSession) {
    const activeBlank = clozeSession.blanks[activeBlankIdx];
    const selectedLetter = clozeAnswers[activeBlankIdx];
    const isAnswered = Boolean(selectedLetter);
    const isCorrect = selectedLetter === activeBlank.correctLetter;
    const chosenOption = activeBlank.options.find((o) => o.letter === selectedLetter);

    const answeredCount = Object.keys(clozeAnswers).length;
    const liveCorrect = Object.entries(clozeAnswers).filter(
      ([idx, letter]) => clozeSession.blanks[Number(idx)]?.correctLetter === letter
    ).length;
    const liveWrong = answeredCount - liveCorrect;
    const allAnswered = answeredCount >= clozeSession.blanks.length;

    return (
      <div className="max-w-3xl mx-auto space-y-4 pb-24 animate-in fade-in duration-200">
        {/* Top Cloze Header Bar */}
        <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-2xl p-4 border border-[#e2e8f0] dark:border-[#334155] shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleBackToHub}
              className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-semibold text-[#475569] dark:text-[#cbd5e1] hover:bg-[#f1f5f9] dark:hover:bg-[#0f172a] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft width={15} height={15} fill="none" stroke="currentColor" className="w-4 h-4" />
              <span>Alıştırmalar</span>
            </button>

            <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
              <span className="font-semibold text-[#0f172a] dark:text-[#f8fafc]">
                Paragraf {clozeSession.passageIndex + 1}/{clozeSession.totalPassagesInFilter}
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-[#15803d] dark:text-[#34d399]">
                <CheckCircle2 width={14} height={14} fill="none" stroke="currentColor" className="w-3.5 h-3.5" />
                {liveCorrect}
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-[#be123c] dark:text-[#fda4af]">
                <XCircle width={14} height={14} fill="none" stroke="currentColor" className="w-3.5 h-3.5" />
                {liveWrong}
              </span>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-[#f1f5f9] dark:bg-[#0f172a] overflow-hidden">
            <div
              className="h-full bg-[#16a34a] rounded-full transition-all duration-300"
              style={{ width: `${Math.round((answeredCount / clozeSession.blanks.length) * 100)}%` }}
            />
          </div>
        </div>

        {/* Zone 1: Interactive Paragraph */}
        <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-5 sm:p-6 border border-[#e2e8f0] dark:border-[#334155] shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">
                Cloze Test · {clozeSession.cefrBadge} · {clozeSession.topicTr}
              </p>
              <h2 className="text-base sm:text-lg font-bold font-['Outfit'] text-[#0f172a] dark:text-[#f8fafc]">
                {clozeSession.titleTr}
              </h2>
            </div>

            {/* Strictly filtered passage switcher */}
            <div className="flex flex-wrap items-center gap-1">
              {filteredClozePassages.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => startClozeTest(idx)}
                  style={
                    idx === clozeSession.passageIndex
                      ? { backgroundColor: '#16a34a', color: '#ffffff' }
                      : undefined
                  }
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    idx === clozeSession.passageIndex
                      ? 'bg-[#16a34a] text-[#ffffff]'
                      : 'bg-[#f1f5f9] dark:bg-[#0f172a] text-[#475569] dark:text-[#94a3b8] hover:bg-[#e2e8f0] dark:hover:bg-[#334155]'
                  }`}
                  title={`${p.cefrBadge} · ${p.titleTr}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm sm:text-[15.5px] leading-[1.95] text-[#1e293b] dark:text-[#e2e8f0]">
            {clozeSession.segments.map((seg, segIdx) => {
              const blank = clozeSession.blanks[segIdx];
              const blankAnswer = clozeAnswers[segIdx];
              const blankCorrect = blank && blankAnswer === blank.correctLetter;
              const isFocused = segIdx === activeBlankIdx;

              return (
                <React.Fragment key={segIdx}>
                  {seg}
                  {blank && (
                    <button
                      type="button"
                      onClick={() => setActiveBlankIdx(segIdx)}
                      className={`inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-lg font-semibold text-xs sm:text-sm border transition-all cursor-pointer align-baseline ${
                        blankAnswer
                          ? blankCorrect
                            ? 'bg-[#dcfce7] dark:bg-[#064e3b] border-[#16a34a] text-[#15803d] dark:text-[#6ee7b7]'
                            : 'bg-[#fff1f2] dark:bg-[#4c0519] border-[#e11d48] text-[#be123c] dark:text-[#fda4af]'
                          : isFocused
                          ? 'bg-[#ecfdf5] dark:bg-[#064e3b] border-2 border-[#16a34a] text-[#15803d] dark:text-[#6ee7b7] shadow-2xs'
                          : 'bg-[#f1f5f9] dark:bg-[#0f172a] border-[#cbd5e1] dark:border-[#475569] text-[#334155] dark:text-[#cbd5e1] hover:border-[#16a34a]'
                      }`}
                    >
                      <span className="font-mono text-[11px] font-bold">({blank.blankNumber})</span>
                      {blankAnswer ? (
                        <>
                          <span>
                            {blank.options.find((o) => o.letter === blank.correctLetter)?.text}
                          </span>
                          {blankCorrect ? (
                            <Check width={12} height={12} stroke="currentColor" className="w-3 h-3 shrink-0" />
                          ) : (
                            <XCircle width={12} height={12} stroke="currentColor" className="w-3 h-3 shrink-0" />
                          )}
                        </>
                      ) : (
                        <span className="font-mono">____</span>
                      )}
                    </button>
                  )}
                </React.Fragment>
              );
            })}
          </p>
        </div>

        {/* Zone 2: Active Blank Selector & 5 Options */}
        <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-5 sm:p-6 border border-[#e2e8f0] dark:border-[#334155] shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold font-['Outfit'] text-[#0f172a] dark:text-[#f8fafc]">
              Boşluk ({activeBlank.blankNumber}) için doğru seçeneği işaretleyin
            </span>
            <div className="flex items-center gap-1.5">
              {clozeSession.blanks.map((b, idx) => {
                const ans = clozeAnswers[idx];
                const ok = ans === b.correctLetter;
                const active = idx === activeBlankIdx;
                return (
                  <button
                    key={b.blankNumber}
                    type="button"
                    onClick={() => setActiveBlankIdx(idx)}
                    style={
                      active && !ans ? { backgroundColor: '#16a34a', color: '#ffffff' } : undefined
                    }
                    className={`min-w-[34px] h-8 px-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer inline-flex items-center justify-center gap-1 ${
                      ans
                        ? ok
                          ? 'bg-[#dcfce7] dark:bg-[#064e3b] border-[#16a34a] text-[#15803d] dark:text-[#6ee7b7]'
                          : 'bg-[#fff1f2] dark:bg-[#4c0519] border-[#e11d48] text-[#be123c] dark:text-[#fda4af]'
                        : active
                        ? 'bg-[#16a34a] border-[#16a34a] text-[#ffffff]'
                        : 'bg-[#f8fafc] dark:bg-[#0f172a] border-[#e2e8f0] dark:border-[#334155] text-[#475569] dark:text-[#cbd5e1]'
                    }`}
                  >
                    {b.blankNumber}
                  </button>
                );
              })}
            </div>
          </div>

          {renderOptionList(
            activeBlank.options,
            selectedLetter,
            activeBlank.correctLetter,
            handleSelectClozeOption
          )}

          {/* Instant Feedback Panel for Active Blank */}
          {isAnswered && (
            <div
              className={`rounded-2xl p-4 border space-y-3 animate-in fade-in duration-150 ${
                isCorrect
                  ? 'bg-[#ecfdf5] dark:bg-[#022c22] border-[#a7f3d0] dark:border-[#065f46]'
                  : 'bg-[#fff1f2] dark:bg-[#1e293b] border-[#fecdd3] dark:border-[#9f1239]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <CheckCircle2 width={18} height={18} fill="none" stroke="#16a34a" className="w-5 h-5 shrink-0" />
                  ) : (
                    <XCircle width={18} height={18} fill="none" stroke="#e11d48" className="w-5 h-5 shrink-0" />
                  )}
                  <span
                    className={`font-bold text-sm ${
                      isCorrect
                        ? 'text-[#065f46] dark:text-[#6ee7b7]'
                        : 'text-[#9f1239] dark:text-[#fda4af]'
                    }`}
                  >
                    {isCorrect
                      ? `Doğru Cevap! (${activeBlank.correctLetter})`
                      : `Yanlış Cevap — Doğru şık: ${activeBlank.correctLetter} (${activeBlank.targetWord.word})`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => speakText(activeBlank.targetWord.word, 'en-US', 0.92)}
                  className="text-xs font-semibold text-[#0f172a] dark:text-[#f8fafc] inline-flex items-center gap-1 hover:text-[#16a34a] cursor-pointer"
                >
                  <Volume2 width={14} height={14} fill="none" stroke="currentColor" className="w-3.5 h-3.5" />
                  <span>{activeBlank.targetWord.word}</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-[#334155] dark:text-[#e2e8f0] leading-relaxed">
                {activeBlank.explanationTr}
              </p>

              {!isCorrect && chosenOption && (
                <p className="text-xs text-[#9f1239] dark:text-[#fda4af]">
                  Seçtiğiniz <strong>{chosenOption.wordEntry.word}</strong> kelimesi{' '}
                  &ldquo;{chosenOption.wordEntry.trMeaning}&rdquo; anlamına gelir.
                </p>
              )}

              <div className="pt-1 flex flex-wrap items-center justify-between gap-2.5">
                {renderNotebookToggle(activeBlank.targetWord)}

                <button
                  type="button"
                  onClick={handleNextClozeBlank}
                  style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                  className="legacy-btn-green min-h-[42px] px-5 py-2 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-[#ffffff] font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap ml-auto"
                >
                  <span>{allAnswered ? 'Paragraf Sonucunu Gör' : 'Sonraki Boşluk'}</span>
                  <ArrowRight width={16} height={16} fill="none" stroke="#ffffff" className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. ACTIVE TEST: SYNONYMS (EŞ ANLAMLILAR)
  // =========================================================================
  if (activeMode === 'synonyms' && synQuestions.length > 0) {
    const currentQ = synQuestions[synIndex];
    const selectedLetter = synAnswers[synIndex];
    const isAnswered = Boolean(selectedLetter);
    const isCorrect = selectedLetter === currentQ.correctLetter;
    const chosenOption = currentQ.options.find((o) => o.letter === selectedLetter);

    const liveCorrect = Object.entries(synAnswers).filter(
      ([idx, letter]) => synQuestions[Number(idx)]?.correctLetter === letter
    ).length;
    const liveWrong = Object.keys(synAnswers).length - liveCorrect;
    const progressPct = Math.round(((synIndex + (isAnswered ? 1 : 0)) / synQuestions.length) * 100);

    return (
      <div className="max-w-3xl mx-auto space-y-4 pb-24 animate-in fade-in duration-200">
        {/* Top Progress Bar */}
        <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-2xl p-4 border border-[#e2e8f0] dark:border-[#334155] shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleBackToHub}
              className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-semibold text-[#475569] dark:text-[#cbd5e1] hover:bg-[#f1f5f9] dark:hover:bg-[#0f172a] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft width={15} height={15} fill="none" stroke="currentColor" className="w-4 h-4" />
              <span>Alıştırmalar</span>
            </button>

            <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
              <span className="font-semibold text-[#0f172a] dark:text-[#f8fafc]">
                Soru {synIndex + 1}/{synQuestions.length}
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-[#15803d] dark:text-[#34d399]">
                <CheckCircle2 width={14} height={14} fill="none" stroke="currentColor" className="w-3.5 h-3.5" />
                {liveCorrect}
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-[#be123c] dark:text-[#fda4af]">
                <XCircle width={14} height={14} fill="none" stroke="currentColor" className="w-3.5 h-3.5" />
                {liveWrong}
              </span>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-[#f1f5f9] dark:bg-[#0f172a] overflow-hidden">
            <div
              className="h-full bg-[#16a34a] rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Synonym Question Card */}
        <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-5 sm:p-7 border border-[#e2e8f0] dark:border-[#334155] shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">
              Eş Anlamlılar · {currentQ.cefrLabel} ·{' '}
              {getPosTurkishName(currentQ.promptWord.partOfSpeech || currentQ.promptWord.type)}
            </span>
            {renderNotebookToggle(currentQ.promptWord, true)}
          </div>

          <div className="p-5 rounded-2xl bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] space-y-2 text-center">
            <p className="text-xs font-medium text-[#64748b] dark:text-[#94a3b8]">
              Aşağıdaki kelimenin en yakın eş anlamlısını seçin
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] tracking-tight text-[#0f172a] dark:text-[#f8fafc]">
                {currentQ.promptWord.word}
              </h2>
              <button
                type="button"
                onClick={() => speakText(currentQ.promptWord.word, 'en-US', 0.92)}
                className="p-2 rounded-xl bg-[#ffffff] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] text-[#475569] dark:text-[#cbd5e1] hover:text-[#16a34a] transition-colors cursor-pointer"
                title="Telaffuzu dinle"
                aria-label={`${currentQ.promptWord.word} telaffuzunu dinle`}
              >
                <Volume2 width={18} height={18} fill="none" stroke="currentColor" className="w-4 h-4" />
              </button>
            </div>
            {currentQ.contextSentenceEn && (
              <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8] italic max-w-xl mx-auto pt-1">
                &ldquo;{currentQ.contextSentenceEn}&rdquo;
              </p>
            )}
          </div>

          {/* 5 Synonym Options A-E */}
          {renderOptionList(
            currentQ.options,
            selectedLetter,
            currentQ.correctLetter,
            handleSelectSynOption
          )}

          {/* Instant Feedback Panel */}
          {isAnswered && (
            <div
              className={`rounded-2xl p-4 sm:p-5 border space-y-3 animate-in fade-in duration-150 ${
                isCorrect
                  ? 'bg-[#ecfdf5] dark:bg-[#022c22] border-[#a7f3d0] dark:border-[#065f46]'
                  : 'bg-[#fff1f2] dark:bg-[#1e293b] border-[#fecdd3] dark:border-[#9f1239]'
              }`}
            >
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <CheckCircle2 width={20} height={20} fill="none" stroke="#16a34a" className="w-5 h-5 shrink-0" />
                ) : (
                  <XCircle width={20} height={20} fill="none" stroke="#e11d48" className="w-5 h-5 shrink-0" />
                )}
                <span
                  className={`font-bold text-sm ${
                    isCorrect
                      ? 'text-[#065f46] dark:text-[#6ee7b7]'
                      : 'text-[#9f1239] dark:text-[#fda4af]'
                  }`}
                >
                  {isCorrect
                    ? `Doğru Cevap! ${currentQ.promptWord.word} = ${currentQ.correctSynonym.word}`
                    : `Yanlış Cevap — Doğru şık: ${currentQ.correctLetter} (${currentQ.correctSynonym.word})`}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#334155] dark:text-[#e2e8f0] leading-relaxed">
                {currentQ.explanationTr}
              </p>

              {!isCorrect && chosenOption && (
                <p className="text-xs text-[#9f1239] dark:text-[#fda4af]">
                  Seçtiğiniz <strong>{chosenOption.wordEntry.word}</strong> kelimesi{' '}
                  &ldquo;{chosenOption.wordEntry.trMeaning}&rdquo; anlamına gelir.
                </p>
              )}

              {currentQ.contextSentenceTr && (
                <p className="text-xs text-[#475569] dark:text-[#94a3b8] italic pt-1 border-t border-[#e2e8f0] dark:border-[#334155]">
                  Örnek Çeviri: &ldquo;{currentQ.contextSentenceTr}&rdquo;
                </p>
              )}

              <div className="pt-2 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {renderSynonymAddButton(currentQ.promptWord)}
                    {renderSynonymAddButton(currentQ.correctSynonym)}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextSyn}
                    style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                    className="legacy-btn-green min-h-[42px] px-5 py-2 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-[#ffffff] font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap ml-auto"
                  >
                    <span>{synIndex + 1 < synQuestions.length ? 'Sonraki Soru' : 'Skoru Gör'}</span>
                    <ArrowRight width={16} height={16} fill="none" stroke="#ffffff" className="w-4 h-4" />
                  </button>
                </div>

                {synDuplicateNotice && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#fffbeb] dark:bg-[#451a03] border border-[#fcd34d] dark:border-[#b45309] text-xs font-medium text-[#92400e] dark:text-[#fde68a] animate-in fade-in duration-150"
                  >
                    <AlertCircle
                      width={16}
                      height={16}
                      fill="none"
                      stroke="currentColor"
                      className="w-4 h-4 shrink-0"
                    />
                    <span>{synDuplicateNotice}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 5. MAIN HUB: STRICT CEFR LEVEL FILTER + 3 EXAM PACKAGES
  // =========================================================================
  const overallAccuracy =
    stats.totalQuestionsAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalQuestionsAnswered) * 100)
      : 0;

  const filterOptions: { id: ExerciseLevelFilter; label: string }[] = [
    { id: 'all', label: 'Tümü' },
    { id: 'a1-a2', label: 'A1–A2' },
    { id: 'b1-b2', label: 'B1–B2' },
  ];

  // Contextual card descriptions matching the active CEFR level
  const mcDesc =
    levelFilter === 'a1-a2'
      ? 'Günlük yaşam, okul hayatı, hobiler, seyahat ve hava durumu konularında kısa ve anlaşılır 5 şıklı (A–E) sorular.'
      : levelFilter === 'b1-b2'
      ? 'Üniversite hazırlık, YDS ve YÖKDİL düzeyinde (akademik, bilim, ekonomi, çevre) 5 şıklı (A–E) cümle tamamlama soruları.'
      : 'Seçtiğiniz seviyeye uygun cümle içinde boşluk doldurma formatında 5 şıklı (A–E) kelime soruları.';

  const clozeDesc =
    levelFilter === 'a1-a2'
      ? 'Temel zaman yapılarını (Present Simple, Past Simple, Future) ve günlük kelimeleri ölçen 4–5 cümlelik kısa metinler.'
      : levelFilter === 'b1-b2'
      ? 'Üniversite hazırlık ve akademik düzeyde (psikoloji, şehir yaşamı, iklim, tıp ve araştırma) 5 boşluklu paragraf tamamlama testleri.'
      : 'Tüm CEFR seviyelerinden (A1–B2) seçilmiş 5 numaralı boşluklu paragraf tamamlama testleri.';

  const synDesc =
    levelFilter === 'a1-a2'
      ? 'Temel düzey eş anlamlı kelimeleri (happy–glad, big–large, start–begin, fast–quick gibi) 5 seçenek içinden bulun.'
      : levelFilter === 'b1-b2'
      ? 'Hazırlık ve akademik sınavlarda sık karşılaşılan B1–B2 düzey eş anlamlı kelimeleri 5 seçenek arasından eşleştirin.'
      : 'Verilen kelimenin seviyesine uygun en yakın eş anlamlısını 5 seçenek (A–E) içinden bulun.';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Header & Strict CEFR Level Filter */}
      <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-5 sm:p-6 border border-[#e2e8f0] dark:border-[#334155] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#ecfdf5] dark:bg-[#064e3b] border border-[#a7f3d0] dark:border-[#059669] flex items-center justify-center text-[#16a34a] dark:text-[#34d399] shrink-0">
                <FilePenLine width={20} height={20} fill="none" stroke="currentColor" className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-[#0f172a] dark:text-[#f8fafc] tracking-tight">
                Alıştırmalar
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8]">
              Gerçek CEFR standartlarına uygun A1–A2 ve B1–B2 seviye testleri.
            </p>
          </div>

          {stats.totalCompletedTests > 0 && (
            <div className="text-xs text-[#475569] dark:text-[#94a3b8] font-mono tabular-nums flex items-center gap-2 self-start sm:self-auto">
              <span>{stats.totalCompletedTests} Test</span>
              <span aria-hidden="true">·</span>
              <span className="font-bold text-[#15803d] dark:text-[#34d399]">
                %{overallAccuracy} Doğruluk
              </span>
            </div>
          )}
        </div>

        {/* CEFR Level Filter Controls (applies strictly to ALL 3 test modes) */}
        <div className="pt-4 border-t border-[#f1f5f9] dark:border-[#334155] space-y-2">
          <span className="text-xs font-semibold text-[#475569] dark:text-[#94a3b8] block">
            CEFR Seviye Filtresi (Tüm Testler ve Paragraflar)
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {filterOptions.map((opt) => {
              const active = levelFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectFilter(opt.id)}
                  style={active ? { backgroundColor: '#16a34a', color: '#ffffff' } : undefined}
                  className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'legacy-btn-green bg-[#16a34a] text-[#ffffff] shadow-2xs'
                      : 'bg-[#f8fafc] dark:bg-[#0f172a] text-[#475569] dark:text-[#cbd5e1] border border-[#e2e8f0] dark:border-[#334155] hover:border-[#16a34a]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {emptyNotice && (
          <div className="p-3.5 rounded-2xl bg-[#fffbeb] dark:bg-[#451a03] border border-[#fde68a] dark:border-[#92400e] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-[#78350f] dark:text-[#fde68a]">
            <span>{emptyNotice}</span>
            <button
              type="button"
              onClick={() => handleSelectFilter('all')}
              className="px-3 py-1.5 rounded-lg bg-[#d97706] text-[#ffffff] font-semibold whitespace-nowrap cursor-pointer self-start sm:self-auto"
            >
              Tümü Seçeneğine Geç
            </button>
          </div>
        )}
      </div>

      {/* 3 Exam Format Cards */}
      <div className="grid grid-cols-1 gap-4">
        {/* Card 1: Çoktan Seçmeli (Multiple Choice) */}
        <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-5 sm:p-6 border border-[#e2e8f0] dark:border-[#334155] hover:border-[#16a34a] dark:hover:border-[#34d399] shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#ecfdf5] dark:bg-[#064e3b] border border-[#a7f3d0] dark:border-[#059669] flex items-center justify-center text-[#16a34a] dark:text-[#34d399] shrink-0">
              <ListChecks width={22} height={22} fill="none" stroke="currentColor" className="w-5 h-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold font-['Outfit'] text-[#0f172a] dark:text-[#f8fafc]">
                Çoktan Seçmeli (Multiple Choice)
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8] leading-relaxed">
                {mcDesc}
              </p>
              <div className="text-xs text-[#64748b] dark:text-[#94a3b8] font-mono tabular-nums pt-0.5 flex flex-wrap items-center gap-1.5">
                <span>10 Soru</span>
                <span aria-hidden="true">·</span>
                <span>A–E 5 Şık</span>
                <span aria-hidden="true">·</span>
                <span>Türkçe Açıklama</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => startMultipleChoice()}
            style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
            className="legacy-btn-green min-h-[44px] px-5 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-[#ffffff] font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
          >
            <span>Testi Başlat</span>
            <ArrowRight width={16} height={16} fill="none" stroke="#ffffff" className="w-4 h-4" />
          </button>
        </div>

        {/* Card 2: Cloze Test (Paragraf Tamamlama) */}
        <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-5 sm:p-6 border border-[#e2e8f0] dark:border-[#334155] hover:border-[#2563eb] dark:hover:border-[#60a5fa] shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#eff6ff] dark:bg-[#172554] border border-[#bfdbfe] dark:border-[#1d4ed8] flex items-center justify-center text-[#2563eb] dark:text-[#60a5fa] shrink-0">
              <FileText width={22} height={22} fill="none" stroke="currentColor" className="w-5 h-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold font-['Outfit'] text-[#0f172a] dark:text-[#f8fafc]">
                Cloze Test (Paragraf Tamamlama)
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8] leading-relaxed">
                {clozeDesc}
              </p>
              <div className="text-xs text-[#64748b] dark:text-[#94a3b8] font-mono tabular-nums pt-0.5 flex flex-wrap items-center gap-1.5">
                <span>{filteredClozePassages.length} Paragraf</span>
                <span aria-hidden="true">·</span>
                <span>5 Boşluk</span>
                <span aria-hidden="true">·</span>
                <span>Bağlam İpucu</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => startClozeTest(0)}
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-[#ffffff] font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
          >
            <span>Paragrafa Başla</span>
            <ArrowRight width={16} height={16} fill="none" stroke="#ffffff" className="w-4 h-4" />
          </button>
        </div>

        {/* Card 3: Eş Anlamlılar (Synonyms) */}
        <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-5 sm:p-6 border border-[#e2e8f0] dark:border-[#334155] hover:border-[#d97706] dark:hover:border-[#fbbf24] shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#fffbeb] dark:bg-[#451a03] border border-[#fde68a] dark:border-[#b45309] flex items-center justify-center text-[#d97706] dark:text-[#fbbf24] shrink-0">
              <ArrowLeftRight width={22} height={22} fill="none" stroke="currentColor" className="w-5 h-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold font-['Outfit'] text-[#0f172a] dark:text-[#f8fafc]">
                Eş Anlamlılar (Synonyms)
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8] leading-relaxed">
                {synDesc}
              </p>
              <div className="text-xs text-[#64748b] dark:text-[#94a3b8] font-mono tabular-nums pt-0.5 flex flex-wrap items-center gap-1.5">
                <span>10 Soru</span>
                <span aria-hidden="true">·</span>
                <span>A–E 5 Şık</span>
                <span aria-hidden="true">·</span>
                <span>Sesli Telaffuz</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => startSynonyms()}
            style={{ backgroundColor: '#d97706', color: '#ffffff' }}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-[#ffffff] font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
          >
            <span>Testi Başlat</span>
            <ArrowRight width={16} height={16} fill="none" stroke="#ffffff" className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Helpful Tip Banner */}
      <div className="p-4 rounded-2xl bg-[#ffffff] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] flex items-start gap-3">
        <BookOpen width={18} height={18} fill="none" stroke="#16a34a" className="w-5 h-5 shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8] leading-relaxed">
          Seçtiğiniz CEFR seviyesi tüm test türlerine (Çoktan Seçmeli, Cloze Test ve Eş Anlamlılar) birebir uygulanır. Test sırasında bilmediğiniz herhangi bir kelimeyi yanındaki kalp ikonuyla tek tıkla <strong className="text-[#0f172a] dark:text-[#f8fafc]">Defterim</strong> listenize kaydedebilirsiniz.
        </p>
      </div>
    </div>
  );
};
