import React, { useState } from 'react';
import { Zap, Mic } from 'lucide-react';
import { WordEntry, GameMode } from '../types';
import { SpeedMatchGame } from './SpeedMatchGame';
import { SpeakingPractice } from './SpeakingPractice';

interface GamesViewProps {
  words: WordEntry[];
  initialWordId?: string;
  timeAttackBest: number;
  classicBestTime: number | null;
  newRecordFlags: { classic: boolean; timeAttack: boolean };
  onClassicComplete: (elapsedSeconds: number) => boolean;
  onTimeAttackComplete: (finalScore: number) => boolean;
  onNavigateToDictionary?: () => void;
  onNavigateToFlashcards?: () => void;
  onAddWordsToFavorites?: (wordIds: string[]) => void;
}

export const GamesView: React.FC<GamesViewProps> = ({
  words,
  initialWordId,
  timeAttackBest,
  classicBestTime,
  newRecordFlags,
  onClassicComplete,
  onTimeAttackComplete,
  onNavigateToDictionary,
  onNavigateToFlashcards,
  onAddWordsToFavorites,
}) => {
  const [gameMode, setGameMode] = useState<GameMode>(initialWordId ? 'speaking-check' : 'speed-match');

  return (
    <div className="space-y-6 pb-[120px]">
      {/* Game Mode Selector Segmented Tabs */}
      <div className="max-w-md mx-auto p-1.5 bg-[#ffffff] dark:bg-[#1e293b] rounded-2xl flex items-center justify-between border border-[#e2e8f0] dark:border-[#334155] shadow-2xs">
        <button
          type="button"
          onClick={() => setGameMode('speed-match')}
          style={gameMode === 'speed-match' ? { backgroundColor: '#16a34a', color: '#ffffff' } : undefined}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            gameMode === 'speed-match'
              ? 'legacy-btn-green bg-[#16a34a] text-[#ffffff] shadow-sm'
              : 'text-[#475569] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f8fafc]'
          }`}
        >
          <Zap
            width={16}
            height={16}
            fill={gameMode === 'speed-match' ? '#ffffff' : '#f59e0b'}
            stroke={gameMode === 'speed-match' ? '#ffffff' : '#f59e0b'}
            className="w-4 h-4 shrink-0"
          />
          <span>Kelime Eşleştirme</span>
        </button>

        <button
          type="button"
          onClick={() => setGameMode('speaking-check')}
          style={gameMode === 'speaking-check' ? { backgroundColor: '#16a34a', color: '#ffffff' } : undefined}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            gameMode === 'speaking-check'
              ? 'legacy-btn-green bg-[#16a34a] text-[#ffffff] shadow-sm'
              : 'text-[#475569] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f8fafc]'
          }`}
        >
          <Mic
            width={16}
            height={16}
            fill="none"
            stroke={gameMode === 'speaking-check' ? '#ffffff' : '#16a34a'}
            className="w-4 h-4 shrink-0"
          />
          <span>Telaffuz &amp; Konuşma</span>
        </button>
      </div>

      {/* Render Active Game */}
      {gameMode === 'speed-match' ? (
        <SpeedMatchGame
          words={words}
          timeAttackBest={timeAttackBest}
          classicBestTime={classicBestTime}
          newRecordFlags={newRecordFlags}
          onClassicComplete={onClassicComplete}
          onTimeAttackComplete={onTimeAttackComplete}
          onNavigateToDictionary={onNavigateToDictionary}
          onNavigateToFlashcards={onNavigateToFlashcards}
          onAddWordsToFavorites={onAddWordsToFavorites}
        />
      ) : (
        <SpeakingPractice words={words} initialWordId={initialWordId} />
      )}
    </div>
  );
};
