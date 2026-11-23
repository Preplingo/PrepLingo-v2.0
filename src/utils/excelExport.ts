import * as XLSX from 'xlsx';
import { WordEntry } from '../types';

/**
 * Exports all words in the database — strictly ONLY the words themselves (single column) —
 * as a native Microsoft Excel (.xlsx) spreadsheet downloadable on both mobile and desktop devices.
 */
export function exportAllWordsToExcel(words: WordEntry[]): void {
  const uniqueMap = new Map<string, string>();

  for (const entry of words) {
    const trimmed = (entry?.word || '').trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, trimmed);
    }
  }

  const sortedWords = Array.from(uniqueMap.values()).sort((a, b) =>
    a.localeCompare(b, 'en', { sensitivity: 'base' })
  );

  // Single-column spreadsheet containing ONLY the words
  const sheetData: string[][] = [['Kelime'], ...sortedWords.map((w) => [w])];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet['!cols'] = [{ wch: 28 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Kelimeler');

  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'PrepLingo_Kelimeler.xlsx';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1500);
}
