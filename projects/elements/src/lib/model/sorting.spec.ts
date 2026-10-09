import { describe, expect, it } from 'vitest';
import {
  type SortCriterion,
  type SortValue,
  ariaSort,
  sortByCriteria,
  sortIcon,
  sortPriority,
  toggleSort,
} from './sorting';

describe('ariaSort', () => {
  it('übersetzt asc/desc und undefined in aria-sort-Werte', () => {
    expect(ariaSort('asc')).toBe('ascending');
    expect(ariaSort('desc')).toBe('descending');
    expect(ariaSort(undefined)).toBe('none');
  });
});

describe('sortIcon', () => {
  it('liefert das FontAwesome-Icon zur Sortierrichtung', () => {
    expect(sortIcon('asc')).toBe('fa-sort-up');
    expect(sortIcon('desc')).toBe('fa-sort-down');
    expect(sortIcon(undefined)).toBe('fa-sort');
  });
});

describe('toggleSort', () => {
  it('fügt eine fehlende Spalte aufsteigend mit niedrigster Priorität an', () => {
    const criteria = toggleSort<'name' | 'age'>([{ key: 'name', direction: 'asc' }], 'age');
    expect(criteria).toEqual([
      { key: 'name', direction: 'asc' },
      { key: 'age', direction: 'asc' },
    ]);
  });

  it('dreht eine aufsteigende Spalte auf absteigend, ohne die Reihenfolge zu ändern', () => {
    const criteria = toggleSort<'name' | 'age'>(
      [
        { key: 'name', direction: 'asc' },
        { key: 'age', direction: 'asc' },
      ],
      'name',
    );
    expect(criteria).toEqual([
      { key: 'name', direction: 'desc' },
      { key: 'age', direction: 'asc' },
    ]);
  });

  it('entfernt eine absteigende Spalte (dritter Klick)', () => {
    const criteria = toggleSort<'name'>([{ key: 'name', direction: 'desc' }], 'name');
    expect(criteria).toEqual([]);
  });

  it('verändert die Eingabeliste nicht', () => {
    const input: SortCriterion<'name'>[] = [{ key: 'name', direction: 'asc' }];
    toggleSort(input, 'name');
    expect(input).toEqual([{ key: 'name', direction: 'asc' }]);
  });
});

describe('sortPriority', () => {
  it('gibt die Priorität ab 1 in Kriterienreihenfolge zurück', () => {
    const criteria: SortCriterion<'name' | 'age'>[] = [
      { key: 'age', direction: 'asc' },
      { key: 'name', direction: 'asc' },
    ];
    expect(sortPriority(criteria, 'age')).toBe(1);
    expect(sortPriority(criteria, 'name')).toBe(2);
  });

  it('ist undefined für eine nicht sortierte Spalte', () => {
    expect(sortPriority([], 'name')).toBeUndefined();
  });
});

describe('sortByCriteria', () => {
  interface Row {
    id: string;
    name: string;
    score: number | undefined;
  }

  const rows: Row[] = [
    { id: 'a', name: 'Änne', score: 3 },
    { id: 'b', name: 'Bea', score: undefined },
    { id: 'c', name: 'Cara', score: 1 },
    { id: 'd', name: 'anton', score: 3 },
  ];

  const valueOf = (row: Row, key: 'name' | 'score'): SortValue => row[key];

  it('sortiert Zahlen aufsteigend, fehlende Werte ans Ende', () => {
    const sorted = sortByCriteria(rows, [{ key: 'score', direction: 'asc' }], valueOf);
    expect(sorted.map((row) => row.id)).toEqual(['c', 'a', 'd', 'b']);
  });

  it('hält fehlende Werte auch absteigend am Ende', () => {
    const sorted = sortByCriteria(rows, [{ key: 'score', direction: 'desc' }], valueOf);
    expect(sorted.at(-1)?.id).toBe('b');
    expect(sorted[0].score).toBe(3);
  });

  it('vergleicht Strings mit deutscher Locale (Umlaut, Groß-/Kleinschreibung)', () => {
    const sorted = sortByCriteria(rows, [{ key: 'name', direction: 'asc' }], valueOf);
    expect(sorted.map((row) => row.name)).toEqual(['Änne', 'anton', 'Bea', 'Cara']);
  });

  it('nutzt nachrangige Kriterien bei Gleichstand', () => {
    const sorted = sortByCriteria(
      rows,
      [
        { key: 'score', direction: 'asc' },
        { key: 'name', direction: 'asc' },
      ],
      valueOf,
    );
    // score 3 gleich für 'a' (Änne) und 'd' (anton): 'Änne' vor 'anton'.
    expect(sorted.map((row) => row.id)).toEqual(['c', 'a', 'd', 'b']);
  });

  it('gibt ohne Kriterien eine Kopie in Eingabereihenfolge zurück', () => {
    const sorted = sortByCriteria(rows, [], valueOf);
    expect(sorted).toEqual(rows);
    expect(sorted).not.toBe(rows);
  });
});
