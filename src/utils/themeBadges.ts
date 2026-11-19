import { PartOfSpeech } from '../types';

/**
 * Returns vibrant, modern CEFR badge classes matching the university prep theme:
 * - A1-A2: Bright fresh Emerald Green (#059669 bg, white text)
 * - B1-B2: Rich Indigo/Violet (#6366F1 bg, white text)
 */
export function getCefrBadgeClass(level: string): string {
  if (level === 'Genel') {
    return 'bg-[#0369a1] text-[#ffffff] font-bold shadow-xs border border-[#0284c7]';
  }
  if (level === 'A1' || level === 'A2') {
    return 'bg-[#059669] text-[#ffffff] font-bold shadow-xs border border-[#10b981]';
  }
  return 'bg-[#4f46e5] text-[#ffffff] font-bold shadow-xs border border-[#6366f1]';
}

/**
 * Returns vibrant Part of Speech badge classes:
 * - İsim (noun): Sky Blue
 * - Fiil (verb): Rose / Coral
 * - Sıfat (adj): Amber / Gold
 * - Zarf (adv): Purple
 */
export function getPosBadgeClass(pos: PartOfSpeech | string): string {
  switch (pos) {
    case 'noun':
    case 'n':
      return 'bg-[#e0f2fe] text-[#075985] dark:bg-[#082f49] dark:text-[#bae6fd] border border-[#7dd3fc] dark:border-[#075985] font-semibold';
    case 'verb':
    case 'v':
      return 'bg-[#ffe4e6] text-[#9f1239] dark:bg-[#4c0519] dark:text-[#fecdd3] border border-[#fda4af] dark:border-[#9f1239] font-semibold';
    case 'adjective':
    case 'adj':
      return 'bg-[#fef3c7] text-[#92400e] dark:bg-[#451a03] dark:text-[#fde68a] border border-[#fcd34d] dark:border-[#92400e] font-semibold';
    case 'adverb':
    case 'adv':
      return 'bg-[#f3e8ff] text-[#6b21a8] dark:bg-[#3b0764] dark:text-[#e9d5ff] border border-[#d8b4fe] dark:border-[#6b21a8] font-semibold';
    case 'preposition':
    case 'prep':
      return 'bg-[#ccfbf1] text-[#115e59] dark:bg-[#042f2e] dark:text-[#99f6e4] border border-[#5eead4] dark:border-[#115e59] font-semibold';
    case 'conjunction':
    case 'conj':
      return 'bg-[#e0e7ff] text-[#3730a3] dark:bg-[#1e1b4b] dark:text-[#c7d2fe] border border-[#a5b4fc] dark:border-[#3730a3] font-semibold';
    default:
      return 'bg-[#f1f5f9] text-[#334155] dark:bg-[#1e293b] dark:text-[#cbd5e1] border border-[#cbd5e1] dark:border-[#334155] font-semibold';
  }
}

/**
 * Clean Turkish labels for parts of speech
 */
export function getPosTurkishLabel(pos: string): string {
  switch (pos) {
    case 'noun':
    case 'n':
      return 'İsim';
    case 'verb':
    case 'v':
      return 'Fiil';
    case 'adjective':
    case 'adj':
      return 'Sıfat';
    case 'adverb':
    case 'adv':
      return 'Zarf';
    case 'preposition':
    case 'prep':
      return 'Edat';
    case 'conjunction':
    case 'conj':
      return 'Bağlaç';
    default:
      return pos;
  }
}
