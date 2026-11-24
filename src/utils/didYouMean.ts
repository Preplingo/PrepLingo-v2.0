import { WordEntry } from '../types';

export interface OfflineSuggestionSource {
  w: string;
  wLower: string;
  t: string;
}

export interface DidYouMeanSuggestion {
  word: string;
  trMeaning?: string;
  distance: number;
  source: 'prep' | 'offline';
}

/**
 * Lightweight Levenshtein distance (with adjacent transposition support) and early exit.
 * Calculates minimum single-character insertions, deletions, substitutions, or adjacent swaps.
 * Returns `maxDistance + 1` as soon as the lower bound exceeds `maxDistance`.
 */
export function levenshteinDistance(
  a: string,
  b: string,
  maxDistance: number = 3
): number {
  if (a === b) return 0;
  const lenA = a.length;
  const lenB = b.length;

  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;
  if (Math.abs(lenA - lenB) > maxDistance) return maxDistance + 1;

  // Keep 3 rolling rows (prev2, prev1, curr) to support adjacent transposition with O(lenB) memory
  let prev2 = new Uint16Array(lenB + 1);
  let prev1 = new Uint16Array(lenB + 1);
  let curr = new Uint16Array(lenB + 1);

  for (let j = 0; j <= lenB; j++) {
    prev1[j] = j;
  }

  for (let i = 1; i <= lenA; i++) {
    curr[0] = i;
    let rowMin = i;
    const chA = a.charCodeAt(i - 1);

    for (let j = 1; j <= lenB; j++) {
      const chB = b.charCodeAt(j - 1);
      const cost = chA === chB ? 0 : 1;

      const deletion = prev1[j] + 1;
      const insertion = curr[j - 1] + 1;
      const substitution = prev1[j - 1] + cost;

      let best = deletion < insertion ? deletion : insertion;
      if (substitution < best) best = substitution;

      // Adjacent character transposition (e.g., "umrbella" -> "umbrella", "recieve" -> "receive")
      if (
        i > 1 &&
        j > 1 &&
        chA === b.charCodeAt(j - 2) &&
        a.charCodeAt(i - 2) === chB
      ) {
        const transposition = prev2[j - 2] + 1;
        if (transposition < best) best = transposition;
      }

      curr[j] = best;
      if (best < rowMin) rowMin = best;
    }

    if (rowMin > maxDistance) {
      return maxDistance + 1;
    }

    const temp = prev2;
    prev2 = prev1;
    prev1 = curr;
    curr = temp;
  }

  return prev1[lenB];
}

function getCommonPrefixLength(a: string, b: string): number {
  const limit = a.length < b.length ? a.length : b.length;
  let i = 0;
  while (i < limit && a.charCodeAt(i) === b.charCodeAt(i)) {
    i++;
  }
  return i;
}

/**
 * Finds up to `maxSuggestions` closest English words across both:
 * 1) The 2,575+ Prep Cards pool
 * 2) The external offline dictionary (`public/sozluk.json`)
 *
 * Rules:
 * - Only runs for queries with at least 3 characters
 * - Fast length pre-filter: |candidate.length - query.length| <= 2
 * - Maximum allowed Levenshtein distance: 2 (or 3 for words >= 7 characters)
 * - Ranked by smallest edit distance, then matching start/prefix, length proximity, and Prep Card priority
 */
export function findDidYouMeanSuggestions(
  query: string,
  prepWords: WordEntry[],
  offlineWords: ReadonlyArray<OfflineSuggestionSource>,
  maxSuggestions: number = 4
): DidYouMeanSuggestion[] {
  const trimmed = (query || '').trim();
  if (trimmed.length < 3) return [];

  const queryLower = trimmed.toLowerCase();
  const queryLen = queryLower.length;
  const maxDist = queryLen >= 7 ? 3 : 2;
  const firstChar = queryLower.charCodeAt(0);

  interface ScoredCandidate {
    word: string;
    wordLower: string;
    trMeaning?: string;
    distance: number;
    sameFirstChar: number;
    prefixLen: number;
    lenDiff: number;
    source: 'prep' | 'offline';
  }

  const seen = new Set<string>();
  const matches: ScoredCandidate[] = [];

  const considerCandidate = (
    word: string,
    wordLower: string,
    trMeaning: string | undefined,
    source: 'prep' | 'offline'
  ) => {
    if (!wordLower || wordLower === queryLower) return;
    // Fast length pre-filter: at most 2 characters difference
    const lenDiff = Math.abs(wordLower.length - queryLen);
    if (lenDiff > 2) return;
    if (seen.has(wordLower)) return;

    const dist = levenshteinDistance(queryLower, wordLower, maxDist);
    if (dist > 0 && dist <= maxDist) {
      seen.add(wordLower);
      matches.push({
        word,
        wordLower,
        trMeaning,
        distance: dist,
        sameFirstChar: wordLower.charCodeAt(0) === firstChar ? 1 : 0,
        prefixLen: getCommonPrefixLength(queryLower, wordLower),
        lenDiff,
        source,
      });
    }
  };

  // 1. Scan Prep Cards pool
  for (let i = 0; i < prepWords.length; i++) {
    const item = prepWords[i];
    const w = item.word.trim();
    if (!w) continue;
    considerCandidate(w, w.toLowerCase(), item.trMeaning || item.meaning, 'prep');
  }

  // 2. Scan external offline dictionary (public/sozluk.json)
  for (let i = 0; i < offlineWords.length; i++) {
    const item = offlineWords[i];
    considerCandidate(item.w, item.wLower, item.t, 'offline');
  }

  if (matches.length === 0) return [];

  matches.sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    if (a.sameFirstChar !== b.sameFirstChar) return b.sameFirstChar - a.sameFirstChar;
    if (a.prefixLen !== b.prefixLen) return b.prefixLen - a.prefixLen;
    if (a.lenDiff !== b.lenDiff) return a.lenDiff - b.lenDiff;
    if (a.source !== b.source) return a.source === 'prep' ? -1 : 1;
    return a.wordLower.localeCompare(b.wordLower, 'en');
  });

  return matches.slice(0, maxSuggestions).map((m) => ({
    word: m.word,
    trMeaning: m.trMeaning,
    distance: m.distance,
    source: m.source,
  }));
}
