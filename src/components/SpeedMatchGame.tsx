import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Zap,
  Timer,
  Trophy,
  RotateCcw,
  Play,
  Heart,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  Flame,
  Hourglass,
  Layers,
  Medal,
  BookOpen,
  TrendingUp,
  Home,
  X,
} from 'lucide-react';
import { WordEntry } from '../types';
import { speakText } from '../utils/textToSpeech';
import { getCefrBadgeClass } from '../utils/themeBadges';
import confetti from 'canvas-confetti';

export type DeckFilter = 'all' | 'a1-a2' | 'b1-b2' | 'favorites';
export type MatchGameMode = 'classic' | 'time_attack';

const STORAGE_KEY_NOTEBOOK_MISTAKES = 'preplingo_match_notebook_mistakes';

interface SpeedMatchGameProps {
  words: WordEntry[];
  timeAttackBest: number;
  classicBestTime: number | null;
  newRecordFlags?: { classic: boolean; timeAttack: boolean };
  onClassicComplete?: (elapsedSeconds: number) => boolean;
  onTimeAttackComplete?: (finalScore: number) => boolean;
  onNavigateToDictionary?: () => void;
  onNavigateToFlashcards?: () => void;
  onAddWordsToFavorites?: (wordIds: string[]) => void;
}

/**
 * Strict Tile Schema ensuring 1-to-1 pair architecture:
 * Both English and Turkish tiles share the identical `pairId`.
 */
export interface GameTile {
  id: string; // `en_${word.id}` or `tr_${word.id}` (guaranteed globally unique key)
  pairId: string; // strictly word.id
  text: string;
  lang: 'en' | 'tr';
  wordObj: WordEntry;
}

// Fisher-Yates shuffle algorithm
function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Weighted random selection without replacement:
 * Words with higher mistake counts have a higher probability of selection.
 */
function weightedSampleWithoutReplacement<T extends { id: string }>(
  items: T[],
  weightsMap: Record<string, number>,
  k: number
): T[] {
  if (items.length <= k) return fisherYatesShuffle(items);

  const pool = [...items];
  const selected: T[] = [];

  for (let step = 0; step < k; step++) {
    const weights = pool.map((item) => 1 + (weightsMap[item.id] || 0) * 3);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    let randomVal = Math.random() * totalWeight;
    let chosenIndex = 0;

    for (let i = 0; i < pool.length; i++) {
      randomVal -= weights[i];
      if (randomVal <= 0) {
        chosenIndex = i;
        break;
      }
    }

    selected.push(pool[chosenIndex]);
    pool.splice(chosenIndex, 1);
  }

  return selected;
}

export const SpeedMatchGame: React.FC<SpeedMatchGameProps> = ({
  words,
  timeAttackBest,
  classicBestTime,
  newRecordFlags,
  onClassicComplete,
  onTimeAttackComplete,
  onNavigateToDictionary,
  onNavigateToFlashcards,
  onAddWordsToFavorites,
}) => {
  // Game Mode: 'classic' (relaxed round) vs 'time_attack' (60s countdown)
  const [gameMode, setGameMode] = useState<MatchGameMode>('classic');

  // Filter & Deck state
  const [deckFilter, setDeckFilter] = useState<DeckFilter>('all');
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'round_completed'>('idle');

  // Active board tiles (6 pairs = 6 En tiles and 6 Tr tiles)
  const [enTiles, setEnTiles] = useState<GameTile[]>([]);
  const [trTiles, setTrTiles] = useState<GameTile[]>([]);

  // Selection states (firstTile and secondTile)
  const [firstSelected, setFirstSelected] = useState<GameTile | null>(null);
  const [secondSelected, setSecondSelected] = useState<GameTile | null>(null);

  // Interaction feedback states
  const [matchedPairIds, setMatchedPairIds] = useState<Set<string>>(new Set());
  const [justMatchedPairId, setJustMatchedPairId] = useState<string | null>(null);
  const [mismatchTileIds, setMismatchTileIds] = useState<{ firstId: string; secondId: string } | null>(null);
  const [waveCount, setWaveCount] = useState(1);
  const [isWaveTransitioning, setIsWaveTransitioning] = useState(false);

  // Metrics & Performance tracking
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds (for classic)
  const [timeLeft, setTimeLeft] = useState(60); // 60s countdown for time attack
  const [pairsMatchedCount, setPairsMatchedCount] = useState(0); // total correct pairs matched
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [roundNewRecord, setRoundNewRecord] = useState<'classic' | 'time_attack' | null>(null);

  // Adaptive mistake weight map for Kelime Defterim practice (word.id -> mistake count)
  const [notebookMistakes, setNotebookMistakes] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTEBOOK_MISTAKES);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Track words that were part of any mismatch during the current round (across all decks)
  const [roundMistakenWords, setRoundMistakenWords] = useState<WordEntry[]>([]);
  const [notebookToast, setNotebookToast] = useState<string | null>(null);
  const currentWaveMistakenWordIds = useRef<Set<string>>(new Set());

  // Increment (+2) on mismatch or gently decrease (-1, min 0) on first-try correct match
  const updateNotebookMistake = useCallback((wordId: string, delta: number) => {
    setNotebookMistakes((prev) => {
      const current = prev[wordId] || 0;
      const updatedValue = Math.max(0, current + delta);
      const updated = { ...prev, [wordId]: updatedValue };
      try {
        localStorage.setItem(STORAGE_KEY_NOTEBOOK_MISTAKES, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // Track unused words in active deck for seamless replenishment in time-attack
  const availableReplenishPoolRef = useRef<WordEntry[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mismatchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const justMatchedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roundStartTimestampRef = useRef<number>(Date.now());
  const elapsedTimeRef = useRef<number>(0);
  const timeAttackReportedRef = useRef<boolean>(false);
  const isTimeAttackRef = useRef(false);
  isTimeAttackRef.current = gameMode === 'time_attack';

  // Calculate pool based on active filter
  const getFilteredPool = useCallback(
    (filter: DeckFilter): WordEntry[] => {
      if (filter === 'a1-a2') {
        return words.filter((w) => w.cefrLevel === 'A1' || w.cefrLevel === 'A2');
      }
      if (filter === 'b1-b2') {
        return words.filter((w) => w.cefrLevel === 'B1' || w.cefrLevel === 'B2');
      }
      if (filter === 'favorites') {
        return words.filter((w) => Boolean(w.isFavorite));
      }
      return words;
    },
    [words]
  );

  const activePool = getFilteredPool(deckFilter);
  const savedWords = words.filter((w) => Boolean(w.isFavorite));
  const isFavoritesInsufficient = deckFilter === 'favorites' && savedWords.length < 5;

  /**
   * Helper to create a paired GameTile from a WordEntry
   */
  const createTilesFromWord = (word: WordEntry): { en: GameTile; tr: GameTile } => {
    const rawMeaning = (word.trMeaning || word.meaning || '').trim();
    const primaryMeaning = rawMeaning.split(',')[0].split(';')[0].trim() || rawMeaning || word.word;
    return {
      en: {
        id: `en_${word.id}`,
        pairId: word.id,
        text: word.word.trim(),
        lang: 'en',
        wordObj: word,
      },
      tr: {
        id: `tr_${word.id}`,
        pairId: word.id,
        text: primaryMeaning,
        lang: 'tr',
        wordObj: word,
      },
    };
  };

  /**
   * Initialize a fresh round:
   * Sets up pairs based on mode (Classic vs Time-Attack) and deck (including Kelime Defterim Smart Review),
   * populates replenishment queue, and resets timers.
   */
  const initRound = useCallback(
    (filter = deckFilter, mode = gameMode, excludeWordIds?: Set<string>) => {
      if (mismatchTimeoutRef.current) clearTimeout(mismatchTimeoutRef.current);
      if (justMatchedTimeoutRef.current) clearTimeout(justMatchedTimeoutRef.current);
      if (timerRef.current) clearInterval(timerRef.current);

      currentWaveMistakenWordIds.current.clear();
      setRoundMistakenWords([]);

      let chosenWords: WordEntry[] = [];

      if (filter === 'favorites') {
        const pool = words.filter((w) => Boolean(w.isFavorite));
        if (pool.length < 5) {
          setEnTiles([]);
          setTrTiles([]);
          return false;
        }

        // Deal 5 pairs if exactly 5 words are saved, or 6 pairs per wave if 6 or more words are saved
        const sampleCount = pool.length === 5 ? 5 : Math.min(6, pool.length);
        const preferredPool =
          excludeWordIds && excludeWordIds.size > 0
            ? pool.filter((w) => !excludeWordIds.has(w.id))
            : pool;
        const selectionPool = preferredPool.length >= sampleCount ? preferredPool : pool;
        chosenWords = weightedSampleWithoutReplacement(selectionPool, notebookMistakes, sampleCount);

        // Remaining words in favorites become the replenishment reserve for Time Attack
        availableReplenishPoolRef.current = pool.filter((w) => !chosenWords.some((cw) => cw.id === w.id));
      } else {
        const pool = getFilteredPool(filter);
        if (pool.length === 0) {
          setEnTiles([]);
          setTrTiles([]);
          return false;
        }

        const sampleCount = Math.min(6, pool.length);
        const preferredPool =
          excludeWordIds && excludeWordIds.size > 0
            ? pool.filter((w) => !excludeWordIds.has(w.id))
            : pool;
        const selectionPool = preferredPool.length >= sampleCount ? preferredPool : pool;

        // Shuffle available words with Fisher-Yates
        const shuffledPool = fisherYatesShuffle(selectionPool);
        chosenWords = shuffledPool.slice(0, sampleCount);

        // Remaining words in pool become the replenishment reserve for Time Attack
        const chosenSet = new Set(chosenWords.map((cw) => cw.id));
        availableReplenishPoolRef.current = fisherYatesShuffle(
          pool.filter((w) => !chosenSet.has(w.id))
        );
      }

      const generatedEn: GameTile[] = [];
      const generatedTr: GameTile[] = [];

      chosenWords.forEach((word) => {
        const { en, tr } = createTilesFromWord(word);
        generatedEn.push(en);
        generatedTr.push(tr);
      });

      // Independently Fisher-Yates shuffle the English and Turkish columns
      setEnTiles(fisherYatesShuffle(generatedEn));
      setTrTiles(fisherYatesShuffle(generatedTr));

      // Reset selection and interaction states
      setFirstSelected(null);
      setSecondSelected(null);
      setMatchedPairIds(new Set());
      setJustMatchedPairId(null);
      setMismatchTileIds(null);
      setWaveCount(1);
      setIsWaveTransitioning(false);

      // Reset round metrics
      roundStartTimestampRef.current = Date.now();
      elapsedTimeRef.current = 0;
      timeAttackReportedRef.current = false;
      setRoundNewRecord(null);
      setElapsedTime(0);
      setTimeLeft(60);
      setPairsMatchedCount(0);
      setTotalAttempts(0);
      setMistakesCount(0);
      setStreak(0);
      setScore(0);
      return true;
    },
    [deckFilter, gameMode, getFilteredPool, words, notebookMistakes]
  );

  // Start new game round
  const handleStartGame = (filter = deckFilter, mode = gameMode, excludeWordIds?: Set<string>) => {
    if (filter === 'favorites') {
      const favCount = words.filter((w) => Boolean(w.isFavorite)).length;
      if (favCount < 5) return;
    }
    const success = initRound(filter, mode, excludeWordIds);
    if (success) {
      setGameState('playing');
    }
  };

  // Timer effect when playing:
  // - In 'classic' mode: counts elapsed time up (0s, 1s, 2s...)
  // - In 'time_attack' mode: counts down 60s to 0s
  useEffect(() => {
    if (gameState === 'playing') {
      if (gameMode === 'time_attack') {
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current!);
              // Time's up! Finish round
              setGameState('round_completed');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        timerRef.current = setInterval(() => {
          setElapsedTime((prev) => {
            const next = prev + 1;
            elapsedTimeRef.current = next;
            return next;
          });
        }, 1000);
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, gameMode]);

  // Trigger confetti celebration ONLY on flawless (0-mistake) completion
  useEffect(() => {
    if (gameState === 'round_completed' && mistakesCount === 0 && pairsMatchedCount > 0) {
      confetti({
        particleCount: 95,
        spread: 75,
        origin: { y: 0.6 },
      });
    }
  }, [gameState, mistakesCount, pairsMatchedCount]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (mismatchTimeoutRef.current) clearTimeout(mismatchTimeoutRef.current);
      if (justMatchedTimeoutRef.current) clearTimeout(justMatchedTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Report Time Attack completion to App.tsx and detect new high score record
  useEffect(() => {
    if (
      gameState === 'round_completed' &&
      gameMode === 'time_attack' &&
      !timeAttackReportedRef.current
    ) {
      timeAttackReportedRef.current = true;
      if (onTimeAttackComplete) {
        const isNew = onTimeAttackComplete(score);
        if (isNew) {
          setRoundNewRecord('time_attack');
        }
      }
    }
  }, [gameState, gameMode, score, onTimeAttackComplete]);

  // Filter change handler
  const handleFilterChange = (newFilter: DeckFilter) => {
    setDeckFilter(newFilter);
    const pool = getFilteredPool(newFilter);
    if (newFilter === 'favorites' && pool.length < 5) {
      setGameState('idle');
      return;
    }
    if (pool.length > 0 && gameState === 'playing') {
      initRound(newFilter, gameMode);
    } else if (pool.length === 0) {
      setGameState('idle');
    }
  };

  // Mode change handler (Classic vs 60s Time Attack)
  const handleModeChange = (newMode: MatchGameMode) => {
    setGameMode(newMode);
    if (gameState === 'playing') {
      initRound(deckFilter, newMode);
    }
  };

  /**
   * Full-Board Wave Refresh in Time Attack mode:
   * When all pairs on the active board are matched, immediately loads
   * a brand-new wave (shuffled English words, independently shuffled Turkish meanings)
   * while maintaining strict 1-to-1 pairId integrity.
   */
  const loadNextWave = useCallback(() => {
    let waveTarget = 6;
    if (deckFilter === 'favorites') {
      const favPool = words.filter((w) => Boolean(w.isFavorite));
      if (favPool.length < 5) return;
      waveTarget = favPool.length === 5 ? 5 : 6;
      if (availableReplenishPoolRef.current.length < waveTarget) {
        availableReplenishPoolRef.current = weightedSampleWithoutReplacement(
          favPool,
          notebookMistakes,
          Math.min(12, favPool.length)
        );
      }
    } else {
      // If available replenish pool has fewer than 6 words, resupply from activePool
      if (availableReplenishPoolRef.current.length < 6) {
        const freshPool = fisherYatesShuffle(activePool);
        availableReplenishPoolRef.current = freshPool;
      }
    }

    const nextBatch = availableReplenishPoolRef.current.splice(
      0,
      Math.min(waveTarget, availableReplenishPoolRef.current.length)
    );
    if (nextBatch.length === 0) return;

    const nextEn: GameTile[] = [];
    const nextTr: GameTile[] = [];

    nextBatch.forEach((word) => {
      const { en, tr } = createTilesFromWord(word);
      nextEn.push(en);
      nextTr.push(tr);
    });

    // Reset interaction & selection states for the fresh wave
    setMatchedPairIds(new Set());
    setFirstSelected(null);
    setSecondSelected(null);
    setJustMatchedPairId(null);
    setMismatchTileIds(null);

    // Independently Fisher-Yates shuffle the English and Turkish columns
    setEnTiles(fisherYatesShuffle(nextEn));
    setTrTiles(fisherYatesShuffle(nextTr));

    setWaveCount((prev) => prev + 1);
    setIsWaveTransitioning(true);
    setTimeout(() => {
      setIsWaveTransitioning(false);
    }, 350);
  }, [activePool, deckFilter, words, notebookMistakes]);

  /**
   * Strict Validation Logic:
   * Evaluate pair matching when user selects two tiles.
   */
  const evaluateMatch = (tile1: GameTile, tile2: GameTile) => {
    setTotalAttempts((prev) => prev + 1);

    // Strict validation: check pairId equality
    const isMatch = tile1.pairId === tile2.pairId;

    if (isMatch) {
      // Find the English word to pronounce
      const enWord = tile1.lang === 'en' ? tile1.wordObj.word : tile2.wordObj.word;
      speakText(enWord, 'en-US', 1.0);

      // Streak & score calculations
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      let addedPoints = 0;
      if (gameMode === 'time_attack') {
        // Base score: +10 points per correct match
        // Streak >= 3: 2x Kombo awards +20 points per match
        const isCombo = newStreak >= 3;
        addedPoints = isCombo ? 20 : 10;
      } else {
        const bonus = Math.min(newStreak * 25, 125);
        addedPoints = 100 + bonus;
      }

      setScore((prev) => prev + addedPoints);
      setPairsMatchedCount((prev) => prev + 1);

      // Flash green success highlight for 250ms
      setJustMatchedPairId(tile1.pairId);
      justMatchedTimeoutRef.current = setTimeout(() => {
        setJustMatchedPairId(null);
      }, 250);

      const matchedId = tile1.pairId;

      // Clear active selection immediately
      setFirstSelected(null);
      setSecondSelected(null);

      // If in Kelime Defterim deck and matched on the first try without prior mismatch, gently decrease mistake weight
      if (deckFilter === 'favorites') {
        if (!currentWaveMistakenWordIds.current.has(tile1.wordObj.id)) {
          updateNotebookMistake(tile1.wordObj.id, -1);
        }
      }

      // Mark pair as matched: keep in exact grid positions, faded/muted and non-interactive
      const updated = new Set(matchedPairIds);
      updated.add(matchedId);
      setMatchedPairIds(updated);

      const totalPairsOnBoard = enTiles.length;
      const isBoardCleared = updated.size >= totalPairsOnBoard && totalPairsOnBoard > 0;

      if (isBoardCleared) {
        if (gameMode === 'time_attack') {
          // In 60-Second Time-Attack Mode:
          // Once all pairs on the current board are matched, immediately generate
          // a brand-new wave with a smooth transition, continuing seamlessly until 60s expires.
          setTimeout(() => {
            loadNextWave();
          }, 280);
        } else {
          // In Classic Mode: stop stopwatch, record best time if broken, show Round Summary modal
          if (timerRef.current) clearInterval(timerRef.current);

          const measuredSeconds = Math.max(
            1,
            elapsedTimeRef.current > 0
              ? elapsedTimeRef.current
              : Math.round((Date.now() - roundStartTimestampRef.current) / 1000)
          );
          elapsedTimeRef.current = measuredSeconds;
          setElapsedTime(measuredSeconds);

          if (onClassicComplete) {
            const isNew = onClassicComplete(measuredSeconds);
            if (isNew) {
              setRoundNewRecord('classic');
            }
          }

          setTimeout(() => {
            setGameState('round_completed');
          }, 420);
        }
      }
    } else {
      // Mismatch: Flash soft error red and trigger smooth CSS shake animation for 500ms
      // Reset streak to 0 on an incorrect match without deducting time
      setMismatchTileIds({ firstId: tile1.id, secondId: tile2.id });
      setMistakesCount((prev) => prev + 1);
      setStreak(0);

      // Record both confused words in roundMistakenWords across ALL decks so user can save them to Defterim
      currentWaveMistakenWordIds.current.add(tile1.wordObj.id);
      currentWaveMistakenWordIds.current.add(tile2.wordObj.id);
      setRoundMistakenWords((prev) => {
        const existingIds = new Set(prev.map((w) => w.id));
        const next = [...prev];
        if (!existingIds.has(tile1.wordObj.id)) {
          existingIds.add(tile1.wordObj.id);
          next.push(tile1.wordObj);
        }
        if (!existingIds.has(tile2.wordObj.id)) {
          existingIds.add(tile2.wordObj.id);
          next.push(tile2.wordObj);
        }
        return next;
      });

      // In Kelime Defterim deck, increment mistake weight (+2) for both mistaken words
      if (deckFilter === 'favorites') {
        updateNotebookMistake(tile1.wordObj.id, 2);
        updateNotebookMistake(tile2.wordObj.id, 2);
      }

      mismatchTimeoutRef.current = setTimeout(() => {
        setMismatchTileIds(null);
        setFirstSelected(null);
        setSecondSelected(null);
      }, 500);
    }
  };

  /**
   * Tile click handler supporting flexible interaction:
   * User can click EN first then TR, or TR first then EN.
   */
  const handleTileClick = (clickedTile: GameTile) => {
    // In classic mode, ignore already matched tiles; in time attack, ignore active mismatch
    if (matchedPairIds.has(clickedTile.pairId) || mismatchTileIds) return;

    // If no tile selected yet:
    if (!firstSelected) {
      setFirstSelected(clickedTile);
      return;
    }

    // If clicking the exact same tile: deselect it
    if (firstSelected.id === clickedTile.id) {
      setFirstSelected(null);
      return;
    }

    // If clicking another tile of the SAME language: switch the selection to the new tile
    if (firstSelected.lang === clickedTile.lang) {
      setFirstSelected(clickedTile);
      return;
    }

    // Clicking a tile of the OPPOSITE language: trigger evaluation!
    setSecondSelected(clickedTile);
    evaluateMatch(firstSelected, clickedTile);
  };

  // Calculate Accuracy
  const accuracyPercentage =
    totalAttempts > 0
      ? Math.max(0, Math.round(((totalAttempts - mistakesCount) / totalAttempts) * 100))
      : 100;

  // Show brief toast feedback banner
  const triggerNotebookToast = (message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setNotebookToast(message);
    toastTimeoutRef.current = setTimeout(() => {
      setNotebookToast(null);
    }, 3000);
  };

  // End-screen primary action when mistakes >= 1: save mistaken words to Defterim & start new 6-word set
  const handleAddMistakesAndNextSet = () => {
    const mistakenIds = roundMistakenWords.map((w) => w.id);
    if (onAddWordsToFavorites && mistakenIds.length > 0) {
      onAddWordsToFavorites(mistakenIds);
    }
    triggerNotebookToast('Defterine eklendi');
    const currentSetIds = new Set(enTiles.map((t) => t.pairId));
    handleStartGame(deckFilter, gameMode, currentSetIds);
  };

  // End-screen secondary action (or 0-mistake next set): start fresh 6-word set without adding to Defterim
  const handleStartFreshNextSet = () => {
    const currentSetIds = new Set(enTiles.map((t) => t.pairId));
    handleStartGame(deckFilter, gameMode, currentSetIds);
  };

  // Dynamic feedback tier strictly driven by mistake count
  const roundFeedback = (() => {
    if (mistakesCount === 0) {
      return {
        tier: 'perfect' as const,
        title: 'Kusursuz Performans!',
        message: 'Kusursuz! Tüm kelimeleri tek seferde eşleştirdin.',
        badgeLabel: 'Hatasız Tur',
        iconBoxClass:
          'bg-[#ecfdf5] dark:bg-[#022c22] border-[#10b981] dark:border-[#34d399] shadow-lg animate-bounce',
        pillClass:
          'bg-[#ecfdf5] dark:bg-[#022c22] text-[#047857] dark:text-[#6ee7b7] border-[#a7f3d0] dark:border-[#065f46]',
      };
    }
    if (mistakesCount === 1) {
      return {
        tier: 'near_perfect' as const,
        title: 'Harika Gidiyorsun!',
        message: 'Mükemmele çok yakın! Sadece 1 küçük takılma oldu, harika gidiyorsun.',
        badgeLabel: 'Çok Yakın',
        iconBoxClass:
          'bg-[#fffbeb] dark:bg-[#451a03] border-[#f59e0b] dark:border-[#d97706] shadow-md animate-pulse',
        pillClass:
          'bg-[#fffbeb] dark:bg-[#451a03] text-[#b45309] dark:text-[#fcd34d] border-[#fde68a] dark:border-[#92400e]',
      };
    }
    if (mistakesCount === 2) {
      return {
        tier: 'growth' as const,
        title: 'Gelişim Rozeti',
        message: 'Oldukça iyi bir performans! Birkaç tekrarla bu kelimeler tamamen oturacak.',
        badgeLabel: 'Gelişim Rozeti',
        iconBoxClass:
          'bg-[#eef2ff] dark:bg-[#1e1b4b] border-[#6366f1] dark:border-[#818cf8] shadow-md',
        pillClass:
          'bg-[#eef2ff] dark:bg-[#1e1b4b] text-[#4338ca] dark:text-[#a5b4fc] border-[#c7d2fe] dark:border-[#3730a3]',
      };
    }
    return {
      tier: 'supportive' as const,
      title: 'Pekiştirme Zamanı',
      message: 'Güzel bir ısınma turuydu! Zorlandığın kelimeleri yakaladık, şimdi pekiştirme zamanı.',
      badgeLabel: 'Odaklı Tekrar',
      iconBoxClass:
        'bg-[#fff1f2] dark:bg-[#4c0519] border-[#fb7185] dark:border-[#e11d48] shadow-md',
      pillClass:
        'bg-[#fff1f2] dark:bg-[#4c0519] text-[#be123c] dark:text-[#fda4af] border-[#fecdd3] dark:border-[#881337]',
    };
  })();

  // Deck filter button options: 4 clear source options
  const filterButtons: { id: DeckFilter; label: string; hasIcon?: boolean }[] = [
    { id: 'all', label: 'Tümü' },
    { id: 'a1-a2', label: 'A1 - A2' },
    { id: 'b1-b2', label: 'B1 - B2' },
    { id: 'favorites', label: 'Kelime Defterim 📖', hasIcon: true },
  ];

  return (
    <div className="space-y-4 max-w-2xl mx-auto min-h-screen pb-[140px]">
      {/* Brief "Defterine eklendi" Toast Notification */}
      {notebookToast && (
        <div
          role="status"
          aria-live="polite"
          style={{ backgroundColor: '#0f172a', color: '#ffffff', borderColor: '#10b981' }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl border-2 shadow-xl flex items-center gap-2 text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <Heart width={16} height={16} fill="#f43f5e" stroke="#f43f5e" className="w-4 h-4 shrink-0" />
          <span>{notebookToast}</span>
          <CheckCircle2 width={16} height={16} fill="none" stroke="#34d399" className="w-4 h-4 shrink-0" />
        </div>
      )}

      {/* 1. Mode & Deck Selector (Top Controls) */}
      <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-[#e2e8f0] dark:border-[#334155] shadow-2xs space-y-3">
        {/* Game Mode Segmented Switch: ONLY 2 Gameplay Style Modes (Klasik, 60s Yarış) */}
        <div className="flex items-center justify-between gap-2 border-b border-[#f1f5f9] dark:border-[#334155] pb-2.5 px-0.5">
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-[#f1f5f9] dark:bg-[#0f172a] rounded-2xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleModeChange('classic')}
              style={gameMode === 'classic' ? { backgroundColor: '#16a34a', color: '#ffffff' } : undefined}
              className={`flex-1 sm:flex-initial py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                gameMode === 'classic'
                  ? 'legacy-btn-green bg-[#16a34a] text-[#ffffff] shadow-xs'
                  : 'text-[#475569] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f8fafc]'
              }`}
            >
              <Layers
                width={14}
                height={14}
                fill="none"
                stroke={gameMode === 'classic' ? '#ffffff' : '#16a34a'}
                className="w-3.5 h-3.5"
              />
              <span>Klasik</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('time_attack')}
              style={gameMode === 'time_attack' ? { backgroundColor: '#d97706', color: '#ffffff' } : undefined}
              className={`flex-1 sm:flex-initial py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                gameMode === 'time_attack'
                  ? 'bg-[#d97706] text-[#ffffff] shadow-xs'
                  : 'text-[#475569] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f8fafc]'
              }`}
            >
              <Hourglass
                width={14}
                height={14}
                fill="none"
                stroke={gameMode === 'time_attack' ? '#ffffff' : '#d97706'}
                className="w-3.5 h-3.5"
              />
              <span>60s Yarış ⏱️</span>
            </button>
          </div>

          {gameState === 'playing' && (
            <button
              type="button"
              onClick={() => handleStartGame(deckFilter, gameMode)}
              className="text-xs font-semibold text-[#16a34a] dark:text-[#34d399] hover:text-[#15803d] dark:hover:text-[#6ee7b7] px-3 py-1.5 rounded-xl hover:bg-[#ecfdf5] dark:hover:bg-[#0f172a] transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              title="Yeni tur başlat"
            >
              <RotateCcw width={14} height={14} fill="none" stroke="#16a34a" className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Yenile</span>
            </button>
          )}
        </div>

        {/* 2. Unified Deck / Source Selector in the Second Row ("Kelime Destesi") */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="text-[11px] font-bold text-[#475569] dark:text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal width={12} height={12} fill="none" stroke="#64748b" className="w-3 h-3" />
              <span>Kelime Destesi:</span>
            </span>
            <span className="text-[11px] text-[#475569] dark:text-[#94a3b8] font-medium">
              {deckFilter === 'favorites'
                ? `${savedWords.length} kayıtlı kelime (Akıllı Tekrar)`
                : `${activePool.length.toLocaleString('tr-TR')} kelime aktif`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#f1f5f9] dark:bg-[#0f172a] rounded-2xl">
            {filterButtons.map((btn) => {
              const isActive = deckFilter === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => handleFilterChange(btn.id)}
                  style={
                    isActive
                      ? { backgroundColor: btn.id === 'favorites' ? '#e11d48' : '#16a34a', color: '#ffffff' }
                      : undefined
                  }
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                    isActive
                      ? btn.id === 'favorites'
                        ? 'bg-[#e11d48] text-[#ffffff] shadow-xs'
                        : 'legacy-btn-green bg-[#16a34a] text-[#ffffff] shadow-xs'
                      : 'text-[#475569] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f8fafc]'
                  }`}
                >
                  {btn.hasIcon && (
                    <BookOpen
                      width={14}
                      height={14}
                      fill="none"
                      stroke={isActive ? '#ffffff' : '#f43f5e'}
                      className="w-3.5 h-3.5 shrink-0"
                    />
                  )}
                  <span className="truncate">{btn.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Side-by-Side Personal Record Cards (60s Time Attack + Classic Best Time) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {/* 60s Time Attack High Score Card */}
        <div
          className={`relative rounded-2xl p-3 sm:p-3.5 bg-[#ffffff] dark:bg-[#1e293b] border transition-all shadow-2xs flex items-center gap-2.5 sm:gap-3 ${
            roundNewRecord === 'time_attack' || newRecordFlags?.timeAttack
              ? 'border-2 border-[#f59e0b] dark:border-[#fbbf24] shadow-md'
              : 'border-[#e2e8f0] dark:border-[#334155]'
          }`}
        >
          {(roundNewRecord === 'time_attack' || newRecordFlags?.timeAttack) && (
            <span
              style={{ backgroundColor: '#f59e0b', color: '#ffffff' }}
              className="absolute -top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide shadow-sm flex items-center gap-1 animate-bounce"
            >
              <Sparkles width={10} height={10} fill="none" stroke="#ffffff" className="w-2.5 h-2.5" />
              <span>Yeni Rekor!</span>
            </span>
          )}
          <div className="p-2 sm:p-2.5 rounded-xl bg-[#fffbeb] dark:bg-[#451a03] border border-[#fde68a] dark:border-[#92400e] shrink-0">
            <Trophy width={18} height={18} fill="none" stroke="#d97706" className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#475569] dark:text-[#94a3b8] block truncate">
              60s Yarış Rekoru
            </span>
            <span className="text-sm sm:text-base font-extrabold font-mono text-[#0f172a] dark:text-[#f8fafc] block truncate">
              {timeAttackBest > 0 ? `${timeAttackBest} Puan` : 'Henüz yok'}
            </span>
            <span className="text-[10px] text-[#64748b] dark:text-[#94a3b8] block truncate">
              En yüksek skor
            </span>
          </div>
        </div>

        {/* Classic Best Time Record Card */}
        <div
          className={`relative rounded-2xl p-3 sm:p-3.5 bg-[#ffffff] dark:bg-[#1e293b] border transition-all shadow-2xs flex items-center gap-2.5 sm:gap-3 ${
            roundNewRecord === 'classic' || newRecordFlags?.classic
              ? 'border-2 border-[#10b981] dark:border-[#34d399] shadow-md'
              : 'border-[#e2e8f0] dark:border-[#334155]'
          }`}
        >
          {(roundNewRecord === 'classic' || newRecordFlags?.classic) && (
            <span
              style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
              className="absolute -top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide shadow-sm flex items-center gap-1 animate-bounce"
            >
              <Sparkles width={10} height={10} fill="none" stroke="#ffffff" className="w-2.5 h-2.5" />
              <span>Yeni Rekor!</span>
            </span>
          )}
          <div className="p-2 sm:p-2.5 rounded-xl bg-[#ecfdf5] dark:bg-[#022c22] border border-[#a7f3d0] dark:border-[#065f46] shrink-0">
            <Timer width={18} height={18} fill="none" stroke="#16a34a" className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#475569] dark:text-[#94a3b8] block truncate">
              Klasik En İyi Süre
            </span>
            <span className="text-sm sm:text-base font-extrabold font-mono text-[#0f172a] dark:text-[#f8fafc] block truncate">
              {classicBestTime !== null ? `${classicBestTime} sn` : 'Henüz yok'}
            </span>
            <span className="text-[10px] text-[#64748b] dark:text-[#94a3b8] block truncate">
              En hızlı tamamlama
            </span>
          </div>
        </div>
      </div>

      {/* 3. Single Unified Empty State when Kelime Defterim has fewer than 5 saved words */}
      {isFavoritesInsufficient && (
        <div className="p-8 text-center rounded-3xl bg-[#ffffff] dark:bg-[#1e293b] border border-dashed border-[#fecdd3] dark:border-[#334155] space-y-4 animate-in fade-in duration-300">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[#fff1f2] dark:bg-[#4c0519] border border-[#fecdd3] dark:border-[#881337] flex items-center justify-center text-[#f43f5e]">
            <BookOpen width={32} height={32} fill="none" stroke="#f43f5e" className="w-8 h-8" />
          </div>
          <div className="space-y-3 max-w-md mx-auto">
            <h3 className="text-base font-bold text-[#0f172a] dark:text-[#f8fafc] leading-snug">
              Kelime Defterim ile eşleştirme oynamak için önce sözlükten en az 5 kelime ekleyin. (Mevcut: {savedWords.length} / 5)
            </h3>
            {/* Progress bar towards 5 words */}
            <div className="w-48 max-w-full mx-auto bg-[#f1f5f9] dark:bg-[#0f172a] rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#f43f5e] h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (savedWords.length / 5) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-[#475569] dark:text-[#94a3b8]">
              Defterinize eklediğiniz kelimeler burada akıllı tekrar algoritmasıyla sunulur. Hata yaptığınız kelimeler pekişene kadar daha sık sorulur.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            {onNavigateToDictionary && (
              <button
                type="button"
                onClick={onNavigateToDictionary}
                style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                className="legacy-btn-green px-5 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-[#ffffff] text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
              >
                <span>Sözlüğe Git ve Kelime Ekle</span>
                <ArrowRight width={14} height={14} fill="none" stroke="#ffffff" className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleFilterChange('all')}
              className="px-4 py-2.5 rounded-xl bg-[#f1f5f9] dark:bg-[#0f172a] hover:bg-[#e2e8f0] dark:hover:bg-[#334155] text-[#0f172a] dark:text-[#f8fafc] text-xs font-bold transition-colors cursor-pointer"
            >
              <span>Tüm Seviyeleri Oyna</span>
            </button>
          </div>
        </div>
      )}

      {/* Idle Screen (Pre-game Intro) */}
      {!isFavoritesInsufficient && activePool.length > 0 && gameState === 'idle' && (
        <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] dark:border-[#334155] shadow-2xs text-center space-y-6">
          <div
            className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center border ${
              gameMode === 'time_attack'
                ? 'bg-[#fffbeb] dark:bg-[#451a03] text-[#f59e0b] border-[#fde68a] dark:border-[#92400e]'
                : deckFilter === 'favorites'
                ? 'bg-[#fff1f2] dark:bg-[#4c0519] text-[#f43f5e] border-[#fecdd3] dark:border-[#881337]'
                : 'bg-[#ecfdf5] dark:bg-[#064e3b] text-[#16a34a] dark:text-[#34d399] border-[#a7f3d0] dark:border-[#059669]'
            }`}
          >
            {gameMode === 'time_attack' ? (
              <Hourglass width={32} height={32} fill="none" stroke="#f59e0b" className="w-8 h-8" />
            ) : deckFilter === 'favorites' ? (
              <BookOpen width={32} height={32} fill="none" stroke="#f43f5e" className="w-8 h-8" />
            ) : (
              <Zap width={32} height={32} fill="none" stroke="#16a34a" className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] text-[#0f172a] dark:text-[#f8fafc]">
              {gameMode === 'time_attack'
                ? '60 Saniye Zamana Karşı Yarış ⏱️'
                : deckFilter === 'favorites'
                ? 'Kelime Defterim: Akıllı Tekrar 📖'
                : 'Kelime Eşleştirme Oyunu'}
            </h2>
            <p className="text-sm text-[#475569] dark:text-[#94a3b8] max-w-md mx-auto leading-relaxed">
              {gameMode === 'time_attack'
                ? deckFilter === 'favorites'
                  ? 'Kelime defterinizdeki kelimelerle 60 saniye boyunca yarışın! Hata yaptığınız kelimeler pekişene kadar daha sık karşınıza gelir.'
                  : '60 saniye boyunca eşleşen her kelimenin yerine anında yenisi gelir! Akıcı kalın, serinizi bozmadan rekor puanı yakalayın.'
                : deckFilter === 'favorites'
                ? 'Kelime Defterinizdeki kelimelerle akıllı pratik yapın. Geçmişte hata yaptığınız kelimeler pekişene kadar daha sık sorulur.'
                : 'Her turda 6 İngilizce kelime ile Türkçe karşılıklarını en kısa sürede ve en az hatayla eşleştirin!'}
            </p>
          </div>

          {deckFilter === 'favorites' && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#fff1f2] dark:bg-[#4c0519] border border-[#fecdd3] dark:border-[#881337] text-xs font-bold text-[#be123c] dark:text-[#fda4af] font-mono">
                <Heart width={14} height={14} fill="#f43f5e" stroke="#f43f5e" className="w-3.5 h-3.5" />
                <span>{savedWords.length} Kayıtlı Kelime</span>
              </span>
              {savedWords.filter((w) => (notebookMistakes[w.id] || 0) > 0).length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#fffbeb] dark:bg-[#451a03] border border-[#fde68a] dark:border-[#92400e] text-xs font-bold text-[#92400e] dark:text-[#fde68a] font-mono">
                  <Flame width={14} height={14} fill="#f59e0b" stroke="#f59e0b" className="w-3.5 h-3.5" />
                  <span>
                    {savedWords.filter((w) => (notebookMistakes[w.id] || 0) > 0).length} Tekrar Odaklı
                  </span>
                </span>
              )}
            </div>
          )}

          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => handleStartGame(deckFilter, gameMode)}
              style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
              className="legacy-btn-green w-full sm:w-auto my-2 mx-auto bg-[#16a34a] hover:bg-[#15803d] active:scale-95 text-[#ffffff] font-bold py-3.5 px-9 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[52px]"
            >
              <Play width={20} height={20} fill="#ffffff" stroke="#ffffff" className="w-5 h-5" />
              <span>
                {gameMode === 'time_attack'
                  ? '60s Yarışı Başlat ⏱️'
                  : deckFilter === 'favorites'
                  ? `Alıştırmaya Başla (${savedWords.length === 5 ? 5 : 6} Çift)`
                  : 'Eşleştirmeye Başla (6 Çift)'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Active Game Arena */}
      {!isFavoritesInsufficient && gameState === 'playing' && (
        <div className="space-y-4">
          {/* Top Live Metrics Dashboard Bar */}
          <div
            className={`bg-[#ffffff] dark:bg-[#1e293b] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border transition-all shadow-2xs flex items-center justify-between gap-2 sm:gap-4 ${
              gameMode === 'time_attack' && timeLeft <= 10
                ? 'border-[#fb7185] dark:border-[#9f1239] ring-2 ring-[#f43f5e]'
                : 'border-[#e2e8f0] dark:border-[#334155]'
            }`}
          >
            {/* Timer: Live countdown in time-attack vs elapsed in classic */}
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-xl transition-all ${
                  gameMode === 'time_attack' && timeLeft <= 10
                    ? 'bg-[#ffe4e6] dark:bg-[#4c0519] text-[#e11d48] dark:text-[#fb7185] animate-pulse'
                    : 'bg-[#eef2ff] dark:bg-[#1e1b4b] text-[#4f46e5] dark:text-[#818cf8]'
                }`}
              >
                {gameMode === 'time_attack' ? (
                  <Hourglass
                    width={18}
                    height={18}
                    fill="none"
                    stroke={timeLeft <= 10 ? '#e11d48' : '#4f46e5'}
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${timeLeft <= 10 ? 'animate-spin' : ''}`}
                  />
                ) : (
                  <Timer width={18} height={18} fill="none" stroke="#4f46e5" className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#64748b] block">
                  {gameMode === 'time_attack' ? 'Kalan Süre' : 'Süre'}
                </span>
                <span
                  className={`text-base sm:text-lg font-mono tabular-nums ${
                    gameMode === 'time_attack' && timeLeft <= 10
                      ? 'text-[#e11d48] dark:text-[#fb7185] font-black animate-pulse'
                      : 'font-extrabold text-[#0f172a] dark:text-[#ffffff]'
                  }`}
                >
                  {gameMode === 'time_attack' ? `${timeLeft}s` : `${elapsedTime}s`}
                </span>
              </div>
            </div>

            {/* Matched Count */}
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#ecfdf5] dark:bg-[#022c22] text-[#16a34a] dark:text-[#34d399]">
                <CheckCircle2 width={18} height={18} fill="none" stroke="#16a34a" className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#64748b] block">Doğru Eşleşme</span>
                <span className="text-base sm:text-lg font-extrabold font-mono text-[#0f172a] dark:text-[#ffffff]">
                  {gameMode === 'time_attack' ? pairsMatchedCount : `${matchedPairIds.size} / ${enTiles.length}`}
                </span>
              </div>
            </div>

            {/* Streak & 2x Kombo Badge */}
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-xl transition-all ${
                  gameMode === 'time_attack' && streak >= 3
                    ? 'bg-[#f43f5e] text-[#ffffff] animate-pulse shadow-md'
                    : 'bg-[#fffbeb] dark:bg-[#451a03] text-[#d97706] dark:text-[#fbbf24]'
                }`}
              >
                <Flame
                  width={18}
                  height={18}
                  fill="none"
                  stroke={gameMode === 'time_attack' && streak >= 3 ? '#ffffff' : '#d97706'}
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${streak >= 3 ? 'animate-bounce' : streak > 1 ? 'animate-pulse' : ''}`}
                />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase font-semibold text-[#64748b] block">Seri</span>
                  {gameMode === 'time_attack' && streak >= 3 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#e11d48] text-[9px] font-black text-[#ffffff] tracking-wider animate-bounce shadow-xs whitespace-nowrap">
                      2x Kombo 🔥
                    </span>
                  )}
                </div>
                <span
                  className={`text-base sm:text-lg font-extrabold font-mono ${
                    gameMode === 'time_attack' && streak >= 3
                      ? 'text-[#e11d48] dark:text-[#fb7185]'
                      : 'text-[#d97706] dark:text-[#fbbf24]'
                  }`}
                >
                  {streak}x
                </span>
              </div>
            </div>

            {/* Total Score */}
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#eef2ff] dark:bg-[#1e1b4b] text-[#4f46e5] dark:text-[#818cf8]">
                <Trophy width={18} height={18} fill="none" stroke="#4f46e5" className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#64748b] block">Puan</span>
                <span className="text-base sm:text-lg font-extrabold font-mono text-[#4f46e5] dark:text-[#818cf8]">
                  {score}
                </span>
              </div>
            </div>
          </div>

          {/* Time Attack Progress Bar with 10s soft red alert */}
          {gameMode === 'time_attack' && (
            <div className="w-full bg-[#e2e8f0] dark:bg-[#1e293b] h-2.5 rounded-full overflow-hidden transition-all">
              <div
                className={`h-full transition-all duration-1000 ${
                  timeLeft <= 10
                    ? 'bg-[#f43f5e] animate-pulse'
                    : 'bg-[#4f46e5] bg-gradient-to-r from-[#f59e0b] to-[#6366f1]'
                }`}
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              />
            </div>
          )}

          {/* Time Attack Round Sub-header */}
          {gameMode === 'time_attack' && (
            <div className="flex items-center justify-between text-xs px-1 text-[#64748b] font-medium">
              <div className="flex items-center gap-1.5 font-bold text-[#4f46e5] dark:text-[#818cf8]">
                <span className="px-2.5 py-1 rounded-xl bg-[#eef2ff] dark:bg-[#1e1b4b] border border-[#c7d2fe] dark:border-[#3730a3] text-[11px] font-mono">
                  Tur {waveCount}
                </span>
                <span className="text-[11px] font-normal text-[#64748b]">
                  ({matchedPairIds.size} / {enTiles.length} eşleşti)
                </span>
              </div>
              <span className="text-[11px] text-[#64748b] font-medium">
                6 çift tamamlandığında yeni tur başlar
              </span>
            </div>
          )}

          {/* Cards Matching Arena (2 Columns: 6 En & 6 Tr) */}
          <div
            className={`grid grid-cols-2 gap-3 sm:gap-4 pt-1 transition-all duration-300 ${
              isWaveTransitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
            }`}
          >
            {/* English Words Column */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider block">
                  İngilizce Kelime
                </span>
                <span className="text-[11px] font-mono text-[#64748b]">
                  {enTiles.length} Kart
                </span>
              </div>

              {enTiles.map((tile) => {
                const isMatched = matchedPairIds.has(tile.pairId);
                const isJustMatched = justMatchedPairId === tile.pairId;
                const isSelected = firstSelected?.id === tile.id || secondSelected?.id === tile.id;
                const isMismatch = mismatchTileIds?.firstId === tile.id || mismatchTileIds?.secondId === tile.id;
                const isWeak = (notebookMistakes[tile.wordObj.id] || 0) > 0;

                let stateClasses =
                  'bg-[#ffffff] dark:bg-[#1e293b] border-[#e2e8f0] dark:border-[#334155] text-[#0f172a] dark:text-[#f8fafc] hover:border-[#10b981] dark:hover:border-[#34d399] active:scale-98 shadow-2xs';

                if (isJustMatched) {
                  stateClasses =
                    'bg-[#d1fae5] dark:bg-[#022c22] border-[#10b981] text-[#065f46] dark:text-[#a7f3d0] scale-[1.02] transition-all duration-250 shadow-md';
                } else if (isMatched) {
                  stateClasses =
                    'opacity-35 bg-[#f1f5f9] dark:bg-[#0f172a] border-[#cbd5e1] dark:border-[#334155] text-[#94a3b8] dark:text-[#64748b] cursor-default scale-[0.98] pointer-events-none transition-all duration-300';
                } else if (isMismatch) {
                  stateClasses =
                    'bg-[#fff1f2] dark:bg-[#4c0519] border-[#f43f5e] text-[#be123c] dark:text-[#fecdd3] animate-shake shadow-md';
                } else if (isSelected) {
                  stateClasses =
                    'bg-[#ecfdf5] dark:bg-[#064e3b] border-[#10b981] text-[#047857] dark:text-[#6ee7b7] shadow-md scale-[1.02]';
                }

                return (
                  <button
                    key={tile.id}
                    type="button"
                    disabled={isMatched}
                    onClick={() => handleTileClick(tile)}
                    className={`w-full min-h-[62px] p-3 sm:p-3.5 rounded-2xl text-left border-2 font-semibold text-sm sm:text-base select-none flex items-center justify-between cursor-pointer ${stateClasses}`}
                  >
                    <div className="flex items-center gap-2 truncate mr-1.5">
                      {isMatched && <CheckCircle2 width={16} height={16} fill="none" stroke="#16a34a" className="w-4 h-4 shrink-0" />}
                      <span className="font-['Outfit'] tracking-tight truncate">{tile.text}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isWeak && !isMatched && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#fffbeb] dark:bg-[#451a03] text-[#b45309] dark:text-[#fcd34d] border border-[#fde68a] dark:border-[#92400e] flex items-center gap-0.5 font-bold shrink-0"
                          title="Hata yapılan kelime - tekrar odaklı"
                        >
                          <Flame width={10} height={10} fill="#f59e0b" stroke="#f59e0b" className="w-2.5 h-2.5" />
                          <span className="hidden sm:inline">Tekrar</span>
                          <span className="sm:hidden">!</span>
                        </span>
                      )}
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md shrink-0 font-mono ${
                          isMatched ? 'opacity-40 grayscale' : getCefrBadgeClass(tile.wordObj.cefrLevel)
                        }`}
                      >
                        {tile.wordObj.cefrLevel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Turkish Meanings Column */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider block">
                  Türkçe Anlam
                </span>
                <span className="text-[11px] font-mono text-[#64748b]">
                  {trTiles.length} Kart
                </span>
              </div>

              {trTiles.map((tile) => {
                const isMatched = matchedPairIds.has(tile.pairId);
                const isJustMatched = justMatchedPairId === tile.pairId;
                const isSelected = firstSelected?.id === tile.id || secondSelected?.id === tile.id;
                const isMismatch = mismatchTileIds?.firstId === tile.id || mismatchTileIds?.secondId === tile.id;

                let stateClasses =
                  'bg-[#ffffff] dark:bg-[#1e293b] border-[#e2e8f0] dark:border-[#334155] text-[#0f172a] dark:text-[#f8fafc] hover:border-[#10b981] dark:hover:border-[#34d399] active:scale-98 shadow-2xs';

                if (isJustMatched) {
                  stateClasses =
                    'bg-[#d1fae5] dark:bg-[#022c22] border-[#10b981] text-[#065f46] dark:text-[#a7f3d0] scale-[1.02] transition-all duration-250 shadow-md';
                } else if (isMatched) {
                  stateClasses =
                    'opacity-35 bg-[#f1f5f9] dark:bg-[#0f172a] border-[#cbd5e1] dark:border-[#334155] text-[#94a3b8] dark:text-[#64748b] cursor-default scale-[0.98] pointer-events-none transition-all duration-300';
                } else if (isMismatch) {
                  stateClasses =
                    'bg-[#fff1f2] dark:bg-[#4c0519] border-[#f43f5e] text-[#be123c] dark:text-[#fecdd3] animate-shake shadow-md';
                } else if (isSelected) {
                  stateClasses =
                    'bg-[#ecfdf5] dark:bg-[#064e3b] border-[#10b981] text-[#047857] dark:text-[#6ee7b7] shadow-md scale-[1.02]';
                }

                return (
                  <button
                    key={tile.id}
                    type="button"
                    disabled={isMatched}
                    onClick={() => handleTileClick(tile)}
                    className={`w-full min-h-[62px] p-3 sm:p-3.5 rounded-2xl text-left border-2 font-medium text-xs sm:text-sm select-none flex items-center justify-between cursor-pointer ${stateClasses}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isMatched && <CheckCircle2 width={16} height={16} fill="none" stroke="#16a34a" className="w-4 h-4 shrink-0" />}
                      <span className="line-clamp-2 leading-snug">{tile.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Dynamic Mistake-Aware Round Summary & Next-Step Modal */}
      {gameState === 'round_completed' && (
        <div className="preplingo-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#FFFFFF] dark:bg-[#1E293B] rounded-3xl p-5 sm:p-7 border-2 border-[#B4C6A6] dark:border-[#334155] text-center space-y-5">
            {/* Subtle Close Button to return to deck/mode settings */}
            <button
              type="button"
              onClick={() => setGameState('idle')}
              aria-label="Kapat"
              title="Kapat"
              className="absolute top-4 right-4 p-2 rounded-xl text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f8fafc] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] transition-colors cursor-pointer"
            >
              <X width={18} height={18} fill="none" stroke="currentColor" className="w-4.5 h-4.5" />
            </button>

            {/* Dynamic Celebration / Feedback Icon */}
            <div className="flex flex-col items-center gap-2.5 pt-1">
              <div
                className={`w-16 h-16 rounded-3xl flex items-center justify-center border-2 ${roundFeedback.iconBoxClass}`}
              >
                {roundFeedback.tier === 'perfect' ? (
                  <Trophy width={34} height={34} fill="none" stroke="#16a34a" className="w-8 h-8" />
                ) : roundFeedback.tier === 'near_perfect' ? (
                  <Sparkles width={34} height={34} fill="none" stroke="#d97706" className="w-8 h-8" />
                ) : roundFeedback.tier === 'growth' ? (
                  <TrendingUp width={34} height={34} fill="none" stroke="#4f46e5" className="w-8 h-8" />
                ) : (
                  <Heart width={34} height={34} fill="#fda4af" stroke="#e11d48" className="w-8 h-8" />
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${roundFeedback.pillClass}`}
                >
                  {roundFeedback.tier === 'growth' && (
                    <Medal width={12} height={12} fill="none" stroke="#4f46e5" className="w-3 h-3" />
                  )}
                  <span>{roundFeedback.badgeLabel}</span>
                </span>

                {roundNewRecord && (
                  <span
                    style={{
                      backgroundColor: roundNewRecord === 'classic' ? '#16a34a' : '#f59e0b',
                      color: '#ffffff',
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold shadow-md animate-bounce"
                  >
                    <Sparkles width={12} height={12} fill="none" stroke="#ffffff" className="w-3 h-3" />
                    <span>
                      {roundNewRecord === 'classic' ? 'Yeni Süre Rekoru!' : 'Yeni Skor Rekoru!'}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Dynamic Title & Exact Motivating Message */}
            <div className="space-y-1.5 px-1">
              <h2 className="text-xl sm:text-2xl font-extrabold font-['Outfit'] text-[#0f172a] dark:text-[#f8fafc]">
                {roundFeedback.title}
              </h2>
              <p className="text-sm text-[#475569] dark:text-[#94a3b8] leading-relaxed font-medium">
                {roundFeedback.message}
              </p>
            </div>

            {/* Metrics Scorecard */}
            {gameMode === 'time_attack' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#f8fafc] dark:bg-[#0f172a] rounded-2xl border border-[#e2e8f0] dark:border-[#334155] text-center">
                <div className="p-2 rounded-xl bg-[#ffffff] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155]">
                  <span className="text-[10px] font-bold text-[#475569] dark:text-[#94a3b8] uppercase tracking-wider block">
                    Toplam Puan
                  </span>
                  <span className="text-lg sm:text-xl font-black text-[#16a34a] dark:text-[#34d399] font-mono">
                    {score}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-[#ffffff] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155]">
                  <span className="text-[10px] font-bold text-[#475569] dark:text-[#94a3b8] uppercase tracking-wider block">
                    Eşleşen Çift
                  </span>
                  <span className="text-lg sm:text-xl font-black text-[#16a34a] dark:text-[#34d399] font-mono">
                    {pairsMatchedCount}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-[#ffffff] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155]">
                  <span className="text-[10px] font-bold text-[#475569] dark:text-[#94a3b8] uppercase tracking-wider block">
                    Hata
                  </span>
                  <span
                    className={`text-lg sm:text-xl font-black font-mono ${
                      mistakesCount === 0 ? 'text-[#16a34a] dark:text-[#34d399]' : 'text-[#e11d48] dark:text-[#fb7185]'
                    }`}
                  >
                    {mistakesCount}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-[#ffffff] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155]">
                  <span className="text-[10px] font-bold text-[#475569] dark:text-[#94a3b8] uppercase tracking-wider block">
                    En İyi
                  </span>
                  <span className="text-lg sm:text-xl font-black text-[#d97706] dark:text-[#fbbf24] font-mono">
                    {Math.max(score, timeAttackBest)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#f8fafc] dark:bg-[#0f172a] rounded-2xl border border-[#e2e8f0] dark:border-[#334155] text-center">
                <div className="p-2 rounded-xl bg-[#ffffff] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155]">
                  <span className="text-[10px] font-bold text-[#475569] dark:text-[#94a3b8] uppercase tracking-wider block">
                    Geçen Süre
                  </span>
                  <span className="text-lg sm:text-xl font-black text-[#16a34a] dark:text-[#34d399] font-mono">
                    {elapsedTime} sn
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-[#ffffff] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155]">
                  <span className="text-[10px] font-bold text-[#475569] dark:text-[#94a3b8] uppercase tracking-wider block">
                    En İyi Süre
                  </span>
                  <span className="text-lg sm:text-xl font-black text-[#d97706] dark:text-[#fbbf24] font-mono">
                    {classicBestTime !== null ? `${Math.min(elapsedTime, classicBestTime)} sn` : `${elapsedTime} sn`}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-[#ffffff] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155]">
                  <span className="text-[10px] font-bold text-[#475569] dark:text-[#94a3b8] uppercase tracking-wider block">
                    Hata
                  </span>
                  <span
                    className={`text-lg sm:text-xl font-black font-mono ${
                      mistakesCount === 0 ? 'text-[#16a34a] dark:text-[#34d399]' : 'text-[#e11d48] dark:text-[#fb7185]'
                    }`}
                  >
                    {mistakesCount}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-[#ffffff] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155]">
                  <span className="text-[10px] font-bold text-[#475569] dark:text-[#94a3b8] uppercase tracking-wider block">
                    İsabet
                  </span>
                  <span className="text-lg sm:text-xl font-black text-[#0f172a] dark:text-[#f8fafc] font-mono">
                    %{accuracyPercentage}
                  </span>
                </div>
              </div>
            )}

            {/* Compact Preview of Mistaken Words (when mistakes >= 1) */}
            {mistakesCount > 0 && roundMistakenWords.length > 0 && (
              <div className="p-3 rounded-2xl bg-[#fff1f2] dark:bg-[#0f172a] border border-[#fecdd3] dark:border-[#334155] text-left space-y-2">
                <span className="text-[11px] font-bold text-[#be123c] dark:text-[#fda4af] flex items-center gap-1.5">
                  <Heart width={13} height={13} fill="#f43f5e" stroke="#f43f5e" className="w-3.5 h-3.5 shrink-0" />
                  <span>Zorlandığın Kelimeler:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {roundMistakenWords.map((word) => (
                    <span
                      key={word.id}
                      className="px-2.5 py-1 rounded-xl bg-[#ffffff] dark:bg-[#1e293b] border border-[#fecdd3] dark:border-[#334155] text-xs font-semibold text-[#0f172a] dark:text-[#f8fafc]"
                    >
                      {word.word}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Next-Step Action Flow ("Nasıl ilerlemek istersin?") */}
            <div className="pt-2 border-t border-[#f1f5f9] dark:border-[#334155] space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-[#94a3b8]">
                Nasıl ilerlemek istersin?
              </p>

              {mistakesCount > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {/* Primary Action: Add Mistaken Words to Defterim & Start New Set */}
                  <button
                    type="button"
                    onClick={handleAddMistakesAndNextSet}
                    style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                    className="legacy-btn-green w-full py-3.5 px-4 bg-[#16a34a] hover:bg-[#15803d] active:scale-95 text-[#ffffff] font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Heart width={16} height={16} fill="#ffffff" stroke="#ffffff" className="w-4 h-4 shrink-0" />
                    <span>Hatalı Kelimeleri Defterime Ekle ve Yeni Sete Geç</span>
                  </button>

                  {/* Secondary Action: Continue with Different Words without Adding */}
                  <button
                    type="button"
                    onClick={handleStartFreshNextSet}
                    className="w-full py-3 px-4 bg-[#f8fafc] dark:bg-[#0f172a] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] text-[#0f172a] dark:text-[#f8fafc] border border-[#e2e8f0] dark:border-[#334155] font-bold text-xs sm:text-sm rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ArrowRight width={16} height={16} fill="none" stroke="#16a34a" className="w-4 h-4 shrink-0" />
                    <span>Farklı Kelimelerle Devam Et</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {/* Primary Action (0 mistakes): Continue with New Set */}
                  <button
                    type="button"
                    onClick={handleStartFreshNextSet}
                    style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                    className="legacy-btn-green w-full py-3.5 px-4 bg-[#16a34a] hover:bg-[#15803d] active:scale-95 text-[#ffffff] font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowRight width={16} height={16} fill="none" stroke="#ffffff" className="w-4 h-4 shrink-0" />
                    <span>Yeni Set ile Devam Et</span>
                  </button>

                  {/* Secondary Action (0 mistakes): End Game & Return to Home (Dictionary Tab) */}
                  <button
                    type="button"
                    onClick={() => {
                      if (timerRef.current) clearInterval(timerRef.current);
                      setEnTiles([]);
                      setTrTiles([]);
                      setFirstSelected(null);
                      setSecondSelected(null);
                      setMatchedPairIds(new Set());
                      setGameState('idle');
                      if (onNavigateToDictionary) {
                        onNavigateToDictionary();
                      }
                    }}
                    className="w-full py-3 px-4 bg-[#f8fafc] dark:bg-[#0f172a] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] text-[#0f172a] dark:text-[#f8fafc] border border-[#e2e8f0] dark:border-[#334155] font-bold text-xs sm:text-sm rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Home width={16} height={16} fill="none" stroke="#16a34a" className="w-4 h-4 shrink-0" />
                    <span>Oyunu Bitir ve Ana Sayfaya Dön</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
