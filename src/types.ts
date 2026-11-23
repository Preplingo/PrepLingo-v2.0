export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'Genel';

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'adj'
  | 'adv'
  | 'preposition'
  | 'conjunction';

export type WordStatus = 'ogrenildi' | 'calisiliyor';

/**
 * Lightweight compact general dictionary entry schema: { "w": "word", "t": "type", "m": "meaning" }
 * Designed for lightweight memory footprint scaling to 25,000+ words.
 */
export interface CompactGeneralWord {
  w: string; // English word
  t: string; // Part of speech code: 'n', 'v', 'adj', 'adv', etc.
  m: string; // Turkish meaning
}

export interface WordEntry {
  id: string;
  word: string;
  phonetic?: string;
  partOfSpeech: PartOfSpeech;
  cefrLevel: CefrLevel;
  trMeaning: string;
  enExample: string;
  trExample: string;
  collocations?: string[];
  academicNote?: string;

  // Schema aliases for direct compatibility
  type?: PartOfSpeech;
  level?: CefrLevel;
  meaning?: string;
  exampleEn?: string;
  exampleTr?: string;
  prepExamTip?: string;

  isCustom?: boolean;
  isFavorite?: boolean;
  isGeneralDict?: boolean; // True when retrieved from the lightweight secondary general dictionary
  isOfflineDict?: boolean; // True when retrieved from external public/sozluk.json offline dictionary
  offlinePosLabel?: string; // Raw Turkish part-of-speech label from public/sozluk.json (e.g., 'İsim', 'Fiil')
  isOnlineDict?: boolean; // True when retrieved from Tier 3 Online Dictionary API
  enDefinition?: string; // English academic definition (e.g. from Free Dictionary API)
  trDefinition?: string; // Turkish-translated explanation for online dictionary words
  status?: WordStatus; // 'ogrenildi' (Mastered) or 'calisiliyor' (Learning)
}

export type CefrFilter = 'Tümü' | 'A1-A2' | 'B1-B2';
export type PosFilter = 'all' | 'noun' | 'verb' | 'adjective' | 'adverb';
export type ActiveTab = 'dictionary' | 'flashcards' | 'favorites' | 'games' | 'exercises';
export type GameMode = 'speed-match' | 'speaking-check';
