import { WordEntry, PartOfSpeech, CefrLevel } from '../types';
import { INITIAL_WORDS } from './initialWords';
import { normalizeForSearch } from '../utils/turkishSearch';

export const REMOTE_OFFLINE_DICT_URL =
  'https://raw.githubusercontent.com/Preplingo/PrepLingo-v2.0/refs/heads/main/public/sozluk.json';
export const LOCAL_FALLBACK_DICT_URL = '/sozluk.json';
export const CLEAN_DICT_CACHE_KEY = 'sozluk_clean_v2';

const IDB_NAME = 'preplingo_offline_dict_db';
const IDB_STORE = 'dictionary_cache';
const IDB_VERSION = 1;

/**
 * Schema of each entry in remote/local sozluk.json:
 * { "w": "banana", "p": "İsim", "t": "muz" }
 */
export interface RawOfflineDictionaryItem {
  w: string; // English word
  p?: string; // Part of speech ("İsim", "Fiil", "Sıfat", "Zarf", etc.)
  t: string; // Turkish meaning
}

export interface CleanedOfflineDictionaryItem {
  w: string;
  p: string;
  t: string;
}

interface IndexedOfflineItem {
  w: string;
  wLower: string;
  wNorm: string;
  pLabel: string;
  pos: PartOfSpeech;
  t: string;
  tRawTokens: string[];
  tNormTokens: string[];
}

/**
 * Fast O(1) lookup Set containing all lowercase English words in the Prep Cards pool.
 * Any word from sozluk.json found in this Set is strictly excluded so there is ZERO duplication.
 */
export const PREP_CARD_WORD_SET: Set<string> = new Set(
  INITIAL_WORDS.map((item) => item.word.trim().toLowerCase()).filter(Boolean)
);

function normalizeTurkishPosLabel(token: string): string {
  const lower = token.trim().toLocaleLowerCase('tr-TR');
  if (lower === 'fiil' || lower === 'verb' || lower === 'v') return 'Fiil';
  if (lower === 'isim' || lower === 'ad' || lower === 'noun' || lower === 'n') return 'İsim';
  if (lower === 'sıfat' || lower === 'sifat' || lower === 'adjective' || lower === 'adj') return 'Sıfat';
  if (lower === 'zarf' || lower === 'belirteç' || lower === 'adverb' || lower === 'adv') return 'Zarf';
  if (lower === 'edat' || lower === 'ilgeç' || lower === 'preposition' || lower === 'prep') return 'Edat';
  if (lower === 'bağlaç' || lower === 'baglac' || lower === 'conjunction' || lower === 'conj') return 'Bağlaç';
  if (lower === 'zamir' || lower === 'pronoun') return 'Zamir';
  if (lower === 'ünlem' || lower === 'unlem' || lower === 'interjection') return 'Ünlem';
  if (lower === 'genel') return 'Genel';
  const trimmed = token.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toLocaleUpperCase('tr-TR') + trimmed.slice(1);
}

function deduplicatePosTags(rawPos?: string): string[] {
  if (!rawPos) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  const parts = rawPos.split(/[,;/]+/);
  for (let i = 0; i < parts.length; i++) {
    const normalized = normalizeTurkishPosLabel(parts[i]);
    if (!normalized) continue;
    const key = normalized.toLocaleLowerCase('tr-TR');
    if (!seen.has(key)) {
      seen.add(key);
      out.push(normalized);
    }
  }
  return out;
}

function deduplicateMeaningList(rawMeaning: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const parts = rawMeaning.split(/[,;]+/);
  for (let i = 0; i < parts.length; i++) {
    const clean = parts[i].trim().replace(/\s+/g, ' ');
    if (!clean) continue;
    const key = clean.toLocaleLowerCase('tr-TR');
    if (!seen.has(key)) {
      seen.add(key);
      out.push(clean);
    }
  }
  return out;
}

function mapOfflinePartOfSpeech(rawPos?: string): { pos: PartOfSpeech; label: string } {
  const deduped = deduplicatePosTags(rawPos);
  const label = deduped.length > 0 ? deduped.join(', ') : 'İsim';
  const first = (deduped[0] || '').toLocaleLowerCase('tr-TR');

  if (first === 'fiil') return { pos: 'verb', label };
  if (first === 'sıfat') return { pos: 'adjective', label };
  if (first === 'zarf') return { pos: 'adverb', label };
  if (first === 'edat') return { pos: 'preposition', label };
  if (first === 'bağlaç') return { pos: 'conjunction', label };
  if (first === 'isim') return { pos: 'noun', label };

  return { pos: 'noun', label };
}

type InflectionKind = 'plural' | 'verb' | 'comp';

function getInflectionRootCandidates(wLower: string): Array<{ root: string; kind: InflectionKind }> {
  if (wLower.length < 3) return [];
  const cands = new Map<string, InflectionKind>();
  const add = (r: string, kind: InflectionKind) => {
    if (r.length >= 2 && r !== wLower && !cands.has(r)) {
      cands.set(r, kind);
    }
  };

  if (wLower.endsWith('ies') && wLower.length > 4) {
    add(wLower.slice(0, -3) + 'y', 'plural');
  }
  if (wLower.endsWith('ied') && wLower.length > 4) {
    add(wLower.slice(0, -3) + 'y', 'verb');
  }
  if (wLower.endsWith('ier') && wLower.length > 4) {
    add(wLower.slice(0, -3) + 'y', 'comp');
  }
  if (wLower.endsWith('iest') && wLower.length > 5) {
    add(wLower.slice(0, -4) + 'y', 'comp');
  }
  if (wLower.endsWith('ing') && wLower.length > 4) {
    const s = wLower.slice(0, -3);
    add(s, 'verb');
    add(s + 'e', 'verb');
    if (s.length >= 2 && s[s.length - 1] === s[s.length - 2]) {
      add(s.slice(0, -1), 'verb');
    }
    if (wLower.endsWith('ying') && wLower.length > 4) {
      add(wLower.slice(0, -4) + 'ie', 'verb');
    }
  }
  if (wLower.endsWith('ed') && wLower.length > 3) {
    const s = wLower.slice(0, -2);
    add(s, 'verb');
    add(s + 'e', 'verb');
    if (s.length >= 2 && s[s.length - 1] === s[s.length - 2]) {
      add(s.slice(0, -1), 'verb');
    }
  }
  if (wLower.endsWith('d') && wLower.length > 3) {
    add(wLower.slice(0, -1), 'verb');
  }
  if (wLower.endsWith('es') && wLower.length > 3) {
    add(wLower.slice(0, -2), 'plural');
    add(wLower.slice(0, -1), 'plural');
  }
  if (wLower.endsWith('s') && !wLower.endsWith('ss') && wLower.length > 2) {
    add(wLower.slice(0, -1), 'plural');
  }
  if (wLower.endsWith('er') && wLower.length > 3) {
    const s = wLower.slice(0, -2);
    add(s, 'comp');
    add(s + 'e', 'comp');
    if (s.length >= 2 && s[s.length - 1] === s[s.length - 2]) {
      add(s.slice(0, -1), 'comp');
    }
  }
  if (wLower.endsWith('est') && wLower.length > 4) {
    const s = wLower.slice(0, -3);
    add(s, 'comp');
    add(s + 'e', 'comp');
    if (s.length >= 2 && s[s.length - 1] === s[s.length - 2]) {
      add(s.slice(0, -1), 'comp');
    }
  }

  return Array.from(cands.entries()).map(([root, kind]) => ({ root, kind }));
}

function isRedundantInflectionCopy(
  derivedMeaningsLower: string[],
  rootMeaningsSet: Set<string>,
  kind: InflectionKind
): boolean {
  if (derivedMeaningsLower.length === 0) return false;
  let exactMatches = 0;
  let softMatches = 0;

  for (let i = 0; i < derivedMeaningsLower.length; i++) {
    const d = derivedMeaningsLower[i];
    if (rootMeaningsSet.has(d)) {
      exactMatches++;
      softMatches++;
    } else if (
      kind === 'comp' &&
      ((d.startsWith('daha ') && rootMeaningsSet.has(d.slice(5).trim())) ||
        (d.startsWith('en ') && rootMeaningsSet.has(d.slice(3).trim())))
    ) {
      softMatches++;
    } else if (
      d.length > 4 &&
      (d.endsWith('lar') || d.endsWith('ler')) &&
      rootMeaningsSet.has(d.slice(0, -3))
    ) {
      softMatches++;
    }
  }

  // Exact Turkish meaning overlap (e.g., derogated/derogates -> derogate, running -> run)
  if (exactMatches > 0) return true;
  // Pure plural or pure comparative/superlative where ALL meanings map to root
  // (e.g., abbreviations -> kısaltmalar, biggest -> en büyük), while preserving distinct-meaning words
  // like glasses ("gözlük, bardaklar")!
  if (softMatches === derivedMeaningsLower.length) return true;
  return false;
}

/**
 * Full cleaning & deduplication pipeline for raw sozluk.json entries:
 * 1. Deduplicates repeated Turkish meanings & repeated POS tags per entry
 * 2. Merges duplicate English word rows into a single card
 * 3. Removes redundant inflected copies (-ed, -d, -s, -es, -ies, -ing, -er, -est) when the root
 *    exists and meanings overlap (preserving distinct meanings such as glasses, derogation, studied)
 * 4. Strictly excludes all words already present in PREP_CARD_WORD_SET
 */
export function cleanAndDeduplicateOfflineDictionary(
  rawData: RawOfflineDictionaryItem[]
): CleanedOfflineDictionaryItem[] {
  interface MergedRecord {
    w: string;
    pList: string[];
    pSeen: Set<string>;
    tList: string[];
    tLowerList: string[];
    tSeen: Set<string>;
  }

  const mergedMap = new Map<string, MergedRecord>();

  for (let i = 0; i < rawData.length; i++) {
    const entry = rawData[i];
    if (!entry || typeof entry.w !== 'string' || typeof entry.t !== 'string') continue;

    const wClean = entry.w.trim();
    const tClean = entry.t.trim();
    if (!wClean || !tClean) continue;

    const wLower = wClean.toLowerCase();
    const posTags = deduplicatePosTags(entry.p);
    const meanings = deduplicateMeaningList(tClean);
    if (meanings.length === 0) continue;

    let record = mergedMap.get(wLower);
    if (!record) {
      const pSeen = new Set<string>();
      const pList: string[] = [];
      for (const p of posTags) {
        const pk = p.toLocaleLowerCase('tr-TR');
        if (!pSeen.has(pk)) {
          pSeen.add(pk);
          pList.push(p);
        }
      }

      const tSeen = new Set<string>();
      const tList: string[] = [];
      const tLowerList: string[] = [];
      for (const m of meanings) {
        const mk = m.toLocaleLowerCase('tr-TR');
        if (!tSeen.has(mk)) {
          tSeen.add(mk);
          tList.push(m);
          tLowerList.push(mk);
        }
      }

      mergedMap.set(wLower, {
        w: wClean,
        pList,
        pSeen,
        tList,
        tLowerList,
        tSeen,
      });
    } else {
      // Prefer lowercase canonical display form when merging e.g. "Abate" + "abate"
      if (record.w !== wLower && wClean === wLower) {
        record.w = wClean;
      }
      for (const p of posTags) {
        const pk = p.toLocaleLowerCase('tr-TR');
        if (!record.pSeen.has(pk)) {
          record.pSeen.add(pk);
          record.pList.push(p);
        }
      }
      for (const m of meanings) {
        const mk = m.toLocaleLowerCase('tr-TR');
        if (!record.tSeen.has(mk)) {
          record.tSeen.add(mk);
          record.tList.push(m);
          record.tLowerList.push(mk);
        }
      }
    }
  }

  // Build unified root meaning map from BOTH merged sozluk.json AND Prep Cards
  const rootMeaningMap = new Map<string, Set<string>>();
  for (const [wLower, rec] of mergedMap) {
    rootMeaningMap.set(wLower, new Set(rec.tSeen));
  }
  for (let i = 0; i < INITIAL_WORDS.length; i++) {
    const pw = INITIAL_WORDS[i];
    const pk = pw.word.trim().toLowerCase();
    if (!pk) continue;
    const ms = deduplicateMeaningList(pw.trMeaning || pw.meaning || '');
    let set = rootMeaningMap.get(pk);
    if (!set) {
      set = new Set<string>();
      rootMeaningMap.set(pk, set);
    }
    for (const m of ms) {
      set.add(m.toLocaleLowerCase('tr-TR'));
    }
  }

  // Filter out Prep Card collisions and redundant inflected copies
  const cleaned: CleanedOfflineDictionaryItem[] = [];

  for (const [wLower, rec] of mergedMap) {
    if (PREP_CARD_WORD_SET.has(wLower)) continue;

    const candidates = getInflectionRootCandidates(wLower);
    let redundant = false;
    for (let c = 0; c < candidates.length; c++) {
      const { root, kind } = candidates[c];
      const rootMeanings = rootMeaningMap.get(root);
      if (rootMeanings && isRedundantInflectionCopy(rec.tLowerList, rootMeanings, kind)) {
        redundant = true;
        break;
      }
    }
    if (redundant) continue;

    cleaned.push({
      w: rec.w,
      p: rec.pList.length > 0 ? rec.pList.join(', ') : 'İsim',
      t: rec.tList.join(', '),
    });
  }

  return cleaned;
}

// ============================================================================
// Persistent Browser Storage (IndexedDB primary + Cache API fallback)
// Key: "sozluk_clean_v2"
// ============================================================================

function openDictionaryDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function readFromIndexedDB(): Promise<CleanedOfflineDictionaryItem[] | null> {
  const db = await openDictionaryDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(CLEAN_DICT_CACHE_KEY);
      req.onsuccess = () => {
        db.close();
        const val = req.result;
        if (Array.isArray(val) && val.length > 0) {
          resolve(val as CleanedOfflineDictionaryItem[]);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      try {
        db.close();
      } catch {
        // ignore
      }
      resolve(null);
    }
  });
}

async function writeToIndexedDB(items: CleanedOfflineDictionaryItem[]): Promise<boolean> {
  const db = await openDictionaryDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(items, CLEAN_DICT_CACHE_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        resolve(false);
      };
    } catch {
      try {
        db.close();
      } catch {
        // ignore
      }
      resolve(false);
    }
  });
}

async function readFromCacheAPI(): Promise<CleanedOfflineDictionaryItem[] | null> {
  if (typeof window === 'undefined' || !('caches' in window)) return null;
  try {
    const cache = await window.caches.open(CLEAN_DICT_CACHE_KEY);
    const res = await cache.match(`/${CLEAN_DICT_CACHE_KEY}.json`);
    if (!res) return null;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0
      ? (data as CleanedOfflineDictionaryItem[])
      : null;
  } catch {
    return null;
  }
}

async function writeToCacheAPI(items: CleanedOfflineDictionaryItem[]): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const cache = await window.caches.open(CLEAN_DICT_CACHE_KEY);
    const response = new Response(JSON.stringify(items), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
    await cache.put(`/${CLEAN_DICT_CACHE_KEY}.json`, response);
  } catch {
    // ignore storage quota errors
  }
}

async function readCachedCleanDictionary(): Promise<CleanedOfflineDictionaryItem[] | null> {
  const fromIdb = await readFromIndexedDB();
  if (fromIdb) return fromIdb;
  return readFromCacheAPI();
}

async function writeCachedCleanDictionary(items: CleanedOfflineDictionaryItem[]): Promise<void> {
  const savedIdb = await writeToIndexedDB(items);
  if (!savedIdb) {
    await writeToCacheAPI(items);
  }
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 12000): Promise<RawOfflineDictionaryItem[] | null> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(url, {
      cache: 'default',
      signal: controller?.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? (data as RawOfflineDictionaryItem[]) : null;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function createOfflineWordEntry(item: IndexedOfflineItem): WordEntry {
  const shortType: PartOfSpeech =
    item.pos === 'adjective' ? 'adj' : item.pos === 'adverb' ? 'adv' : item.pos;

  return {
    id: `offline_${item.wLower.replace(/[^a-z0-9]/g, '_')}`,
    word: item.w,
    phonetic: undefined,
    partOfSpeech: item.pos,
    type: shortType,
    cefrLevel: 'Genel' as CefrLevel,
    level: 'Genel' as CefrLevel,
    trMeaning: item.t,
    meaning: item.t,
    enExample: '',
    exampleEn: '',
    trExample: '',
    exampleTr: '',
    academicNote: undefined,
    prepExamTip: undefined,
    collocations: undefined,
    isCustom: false,
    isFavorite: false,
    isGeneralDict: false,
    isOfflineDict: true,
    offlinePosLabel: item.pLabel,
    isOnlineDict: false,
    status: 'calisiliyor',
  };
}

function tokenizeMeaningRaw(text: string): string[] {
  return text
    .toLocaleLowerCase('tr-TR')
    .split(/[^a-z0-9çğıöşüâîû]+/i)
    .filter(Boolean);
}

/**
 * Asynchronous background loader, persistent browser cache ("sozluk_clean_v2"),
 * cleaning/inflection-deduplication engine, and length-prioritized search index
 * for the external GitHub Raw dictionary (with local public/sozluk.json fallback).
 */
class ExternalOfflineDictionary {
  private items: IndexedOfflineItem[] = [];
  private byWordMap = new Map<string, IndexedOfflineItem>();
  private loadPromise: Promise<void> | null = null;
  private isLoaded = false;
  private listeners: Array<() => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const startBackgroundLoad = () => {
        setTimeout(() => {
          this.load().catch(() => {});
        }, 40);
      };

      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        startBackgroundLoad();
      } else {
        window.addEventListener('DOMContentLoaded', startBackgroundLoad, { once: true });
      }
    }
  }

  private hydrateFromCleanList(cleanItems: CleanedOfflineDictionaryItem[]): void {
    const indexed: IndexedOfflineItem[] = new Array(cleanItems.length);
    const map = new Map<string, IndexedOfflineItem>();
    let count = 0;

    for (let i = 0; i < cleanItems.length; i++) {
      const entry = cleanItems[i];
      if (!entry || typeof entry.w !== 'string' || typeof entry.t !== 'string') continue;

      const wClean = entry.w.trim();
      const tClean = entry.t.trim();
      if (!wClean || !tClean) continue;

      const wLower = wClean.toLowerCase();
      if (PREP_CARD_WORD_SET.has(wLower) || map.has(wLower)) continue;

      const { pos, label } = mapOfflinePartOfSpeech(entry.p);
      const wNorm = normalizeForSearch(wClean);
      const tRawTokens = tokenizeMeaningRaw(tClean);
      const tNormTokens = normalizeForSearch(tClean).split(' ').filter(Boolean);

      const item: IndexedOfflineItem = {
        w: wClean,
        wLower,
        wNorm,
        pLabel: label,
        pos,
        t: tClean,
        tRawTokens,
        tNormTokens,
      };

      indexed[count++] = item;
      map.set(wLower, item);
    }

    indexed.length = count;

    // Sort shortest words first, then alphabetically:
    // Enables instant O(small) prefix search returning shortest relevant words first!
    indexed.sort((a, b) => a.wLower.length - b.wLower.length || (a.wLower < b.wLower ? -1 : a.wLower > b.wLower ? 1 : 0));

    this.items = indexed;
    this.byWordMap = map;
    this.isLoaded = true;
    this.notifyListeners();
  }

  public async load(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        // 1. Check persistent browser cache ("sozluk_clean_v2") first for instant offline boot
        const cached = await readCachedCleanDictionary();
        if (cached && cached.length > 0) {
          this.hydrateFromCleanList(cached);
          return;
        }

        // 2. Download from GitHub Raw URL when online, fallback to local public/sozluk.json when offline
        let rawData: RawOfflineDictionaryItem[] | null = null;
        const isOnline = typeof navigator === 'undefined' || navigator.onLine !== false;

        if (isOnline) {
          rawData = await fetchJsonWithTimeout(REMOTE_OFFLINE_DICT_URL, 12000);
        }

        if (!rawData) {
          rawData = await fetchJsonWithTimeout(LOCAL_FALLBACK_DICT_URL, 10000);
        }

        if (!rawData || rawData.length === 0) {
          this.isLoaded = true;
          this.notifyListeners();
          return;
        }

        // 3. Run full cleaning & inflection deduplication filter
        const cleaned = cleanAndDeduplicateOfflineDictionary(rawData);

        // 4. Hydrate in-memory index immediately so UI updates without waiting for disk write
        this.hydrateFromCleanList(cleaned);

        // 5. Persist cleaned dictionary permanently under "sozluk_clean_v2"
        writeCachedCleanDictionary(cleaned).catch(() => {});
      } catch (err) {
        console.error('Error loading offline dictionary:', err);
        this.isLoaded = true;
        this.notifyListeners();
      }
    })();

    return this.loadPromise;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // ignore subscriber errors
      }
    }
  }

  public getIsLoaded(): boolean {
    return this.isLoaded;
  }

  public getCount(): number {
    return this.items.length;
  }

  public getEntriesForSuggestions(): ReadonlyArray<{ w: string; wLower: string; t: string }> {
    return this.items;
  }

  public getEntriesForExport(): ReadonlyArray<{
    w: string;
    wLower: string;
    pLabel: string;
    pos: PartOfSpeech;
    t: string;
  }> {
    return this.items;
  }

  /**
   * O(1) exact lookup in cleaned offline dictionary.
   */
  public findExact(word: string, extraExcludedSet?: Set<string>): WordEntry | null {
    if (!word) return null;
    const key = word.trim().toLowerCase();
    if (!key || PREP_CARD_WORD_SET.has(key) || extraExcludedSet?.has(key)) {
      return null;
    }

    if (!this.isLoaded) {
      this.load();
      return null;
    }

    const found = this.byWordMap.get(key);
    return found ? createOfflineWordEntry(found) : null;
  }

  /**
   * High-speed prefix & word-start search across the cleaned ~85K offline dictionary.
   * Because `this.items` is pre-sorted shortest-first, prefix matches automatically prioritize
   * shorter words first with early termination!
   * Priority: (1) Exact English match, (2) Shortest English prefix matches, (3) Turkish meaning word-start.
   */
  public search(
    query: string,
    maxResults = 30,
    extraExcludedSet?: Set<string>
  ): WordEntry[] {
    const trimmed = (query || '').trim();
    if (!trimmed) return [];

    if (!this.isLoaded) {
      this.load();
      return [];
    }

    const queryLower = trimmed.toLowerCase();
    const queryTrLower = trimmed.toLocaleLowerCase('tr-TR');
    const normQuery = normalizeForSearch(trimmed);
    if (!normQuery) return [];

    const exactMatches: WordEntry[] = [];
    const prefixMatches: WordEntry[] = [];
    const turkishMatches: WordEntry[] = [];

    // 1. O(1) exact English lookup
    const exactItem = this.byWordMap.get(queryLower);
    if (
      exactItem &&
      !PREP_CARD_WORD_SET.has(exactItem.wLower) &&
      !extraExcludedSet?.has(exactItem.wLower)
    ) {
      exactMatches.push(createOfflineWordEntry(exactItem));
    }

    const isSingleWord = !normQuery.includes(' ');
    const queryTokens = isSingleWord ? [normQuery] : normQuery.split(' ').filter(Boolean);

    // 2. Scan length-sorted items: shortest English prefix matches are guaranteed to be collected first!
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (item.wLower === queryLower) continue;
      if (PREP_CARD_WORD_SET.has(item.wLower) || extraExcludedSet?.has(item.wLower)) continue;

      if (item.wLower.startsWith(queryLower) || item.wNorm.startsWith(normQuery)) {
        if (prefixMatches.length < maxResults) {
          prefixMatches.push(createOfflineWordEntry(item));
        }
      } else if (turkishMatches.length < maxResults) {
        let matchedTr = false;
        if (isSingleWord) {
          matchedTr =
            item.tRawTokens.some((tok) => tok.startsWith(queryTrLower)) ||
            item.tNormTokens.some((tok) => tok.startsWith(normQuery));
        } else {
          matchedTr = queryTokens.every((qt) =>
            item.tNormTokens.some((tok) => tok.startsWith(qt))
          );
        }

        if (matchedTr) {
          turkishMatches.push(createOfflineWordEntry(item));
        }
      }

      if (
        prefixMatches.length >= maxResults &&
        (exactMatches.length > 0 || turkishMatches.length >= maxResults)
      ) {
        break;
      }
    }

    return [...exactMatches, ...prefixMatches, ...turkishMatches].slice(0, maxResults);
  }
}

export const offlineDictionary = new ExternalOfflineDictionary();

export function searchOfflineDictionary(
  query: string,
  maxResults = 30,
  extraExcludedSet?: Set<string>
): WordEntry[] {
  return offlineDictionary.search(query, maxResults, extraExcludedSet);
}

export function findExactInOfflineDictionary(
  word: string,
  extraExcludedSet?: Set<string>
): WordEntry | null {
  return offlineDictionary.findExact(word, extraExcludedSet);
}

export function ensureOfflineDictionaryLoaded(): Promise<void> {
  return offlineDictionary.load();
}
