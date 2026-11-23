import { WordEntry, PartOfSpeech, CefrLevel } from '../types';
import rawWords from './dictionaryData.json';
import { ESSENTIAL_FALLBACK_WORDS } from './essentialFallback';

/**
 * Normalizes a word key for casing and internal whitespace to prevent any duplicate collisions.
 */
export function normalizeWordKey(word?: string): string {
  if (!word) return '';
  return word.toLowerCase().replace(/['']/g, "'").replace(/\s+/g, ' ').trim();
}

/**
 * Scores an entry's content richness to retain the highest-fidelity entry
 * when duplicate entries with the same English word exist.
 */
export function getEntryRichnessScore(entry: any): number {
  if (!entry) return 0;
  let score = 0;
  const tip = entry.prepExamTip || entry.academicNote || '';
  const exEn = entry.exampleEn || entry.enExample || '';
  const exTr = entry.exampleTr || entry.trExample || '';
  const meaning = entry.meaning || entry.trMeaning || '';
  const collocations = entry.collocations || [];

  if (tip.trim().length > 5) score += 35 + Math.min(tip.trim().length, 120);
  if (exEn.trim().length > 5) score += 25 + Math.min(exEn.trim().length, 100);
  if (exTr.trim().length > 5) score += 15 + Math.min(exTr.trim().length, 100);
  if (meaning.trim().length > 0) score += 10 + Math.min(meaning.trim().length, 80);
  if (Array.isArray(collocations) && collocations.length > 0) score += collocations.length * 15;
  if (entry.cefrLevel || entry.level) score += 5;
  if (entry.isCustom) score += 2;
  return score;
}

/**
 * Bulletproof Deduplication Shield:
 * Filters out duplicate words using a lowercase key map and automatically keeps
 * the most complete entry, merging missing fields between duplicates.
 */
export function deduplicateWordEntries(entries: any[]): WordEntry[] {
  if (!Array.isArray(entries)) return [];
  const map = new Map<string, any>();

  for (const raw of entries) {
    if (!raw || !raw.word) continue;
    const wordKey = normalizeWordKey(raw.word);
    if (!wordKey) continue;

    if (!map.has(wordKey)) {
      map.set(wordKey, { ...raw });
    } else {
      const existing = map.get(wordKey);
      const existingScore = getEntryRichnessScore(existing);
      const newScore = getEntryRichnessScore(raw);

      // Keep the one with the richest content as the base
      const winner = newScore > existingScore ? { ...existing, ...raw } : { ...raw, ...existing };

      const bestTip = [existing.prepExamTip, existing.academicNote, raw.prepExamTip, raw.academicNote]
        .filter(Boolean)
        .sort((a, b) => b.length - a.length)[0] || '';
      if (bestTip) {
        winner.prepExamTip = bestTip;
        winner.academicNote = bestTip;
      }

      const bestEn = [existing.exampleEn, existing.enExample, raw.exampleEn, raw.enExample]
        .filter(Boolean)
        .sort((a, b) => b.length - a.length)[0] || '';
      if (bestEn) {
        winner.exampleEn = bestEn;
        winner.enExample = bestEn;
      }

      const bestTr = [existing.exampleTr, existing.trExample, raw.exampleTr, raw.trExample]
        .filter(Boolean)
        .sort((a, b) => b.length - a.length)[0] || '';
      if (bestTr) {
        winner.exampleTr = bestTr;
        winner.trExample = bestTr;
      }

      const bestMeaning = [existing.meaning, existing.trMeaning, raw.meaning, raw.trMeaning]
        .filter(Boolean)
        .sort((a, b) => b.length - a.length)[0] || '';
      if (bestMeaning) {
        winner.meaning = bestMeaning;
        winner.trMeaning = bestMeaning;
      }

      if (existing.isFavorite || raw.isFavorite) {
        winner.isFavorite = true;
      }

      if (existing.status === 'ogrenildi' || raw.status === 'ogrenildi') {
        winner.status = 'ogrenildi';
      }

      map.set(wordKey, winner);
    }
  }

  return Array.from(map.values())
    .map((w) => {
      const rawType = w.type || w.partOfSpeech || 'noun';
      const normalizedType: PartOfSpeech =
        rawType === 'adjective' || rawType === 'adj'
          ? 'adj'
          : rawType === 'adverb' || rawType === 'adv'
          ? 'adv'
          : rawType === 'verb'
          ? 'verb'
          : rawType === 'preposition'
          ? 'preposition'
          : rawType === 'conjunction'
          ? 'conjunction'
          : 'noun';

      const normalizedPos: PartOfSpeech =
        normalizedType === 'adj'
          ? 'adjective'
          : normalizedType === 'adv'
          ? 'adverb'
          : normalizedType;

      const rawLevel = String(w.level || w.cefrLevel || 'A1').trim();
      const level: CefrLevel =
        rawLevel === 'A1' || rawLevel === 'A2' || rawLevel === 'B1' || rawLevel === 'B2' || rawLevel === 'Genel'
          ? (rawLevel as CefrLevel)
          : 'B2';
      const trMeaning = (w.trMeaning || w.meaning || '').trim();
      const enExample = (w.enExample || w.exampleEn || '').trim();
      const trExample = (w.trExample || w.exampleTr || '').trim();
      const tip = (w.prepExamTip || w.academicNote || '').trim();

      return {
        id: String(w.id || `word_${normalizeWordKey(w.word)}`),
        word: (w.word || '').trim(),
        phonetic: w.phonetic || `/${w.word}/`,
        partOfSpeech: normalizedPos,
        type: normalizedType,
        cefrLevel: level,
        level: level,
        trMeaning: trMeaning,
        meaning: trMeaning,
        enExample: enExample,
        exampleEn: enExample,
        trExample: trExample,
        exampleTr: trExample,
        academicNote: tip,
        prepExamTip: tip,
        collocations: Array.isArray(w.collocations) && w.collocations.length > 0 ? w.collocations : undefined,
        enDefinition: w.enDefinition || undefined,
        trDefinition: w.trDefinition || undefined,
        isFavorite: Boolean(w.isFavorite),
        status: w.status || 'calisiliyor',
        isCustom: Boolean(w.isCustom),
        isOfflineDict: Boolean(w.isOfflineDict),
        offlinePosLabel: w.offlinePosLabel || undefined,
        isOnlineDict: Boolean(w.isOnlineDict),
      };
    })
    .sort(compareWordsAlphabetically);
}

/**
 * Case-insensitive, whitespace-trimmed English A-Z alphabetical comparator.
 */
export function compareWordsAlphabetically(
  a: Pick<WordEntry, 'word'>,
  b: Pick<WordEntry, 'word'>
): number {
  return a.word.trim().localeCompare(b.word.trim(), 'en', { sensitivity: 'base' });
}

/**
 * Loads and exports preparatory word entries directly from the dedicated dictionaryData.json file.
 * Automatically enforces strict uniqueness per English word, keeping the richest entry.
 */
function loadAndDeduplicateWords(): WordEntry[] {
  return deduplicateWordEntries([...(rawWords as any[]), ...ESSENTIAL_FALLBACK_WORDS]);
}

export const INITIAL_WORDS: WordEntry[] = loadAndDeduplicateWords();

export default INITIAL_WORDS;

