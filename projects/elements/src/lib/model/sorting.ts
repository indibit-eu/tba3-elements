export type SortDirection = 'asc' | 'desc';

export interface SortCriterion<K extends string> {
  key: K;
  direction: SortDirection;
}

export type SortValue = string | number | undefined;

/** Schaltet eine Spalte weiter: aufsteigend, absteigend, aus. */
export function toggleSort<K extends string>(
  criteria: readonly SortCriterion<K>[],
  key: K,
): SortCriterion<K>[] {
  const index = criteria.findIndex((criterion) => criterion.key === key);
  if (index === -1) return [...criteria, { key, direction: 'asc' }];
  if (criteria[index].direction === 'asc') {
    const updated = [...criteria];
    updated[index] = { key, direction: 'desc' };
    return updated;
  }
  return criteria.filter((_, i) => i !== index);
}

export function ariaSort(
  direction: SortDirection | undefined,
): 'ascending' | 'descending' | 'none' {
  if (direction === 'asc') return 'ascending';
  if (direction === 'desc') return 'descending';
  return 'none';
}

export function sortIcon(direction: SortDirection | undefined): string {
  if (direction === 'asc') return 'fa-sort-up';
  if (direction === 'desc') return 'fa-sort-down';
  return 'fa-sort';
}

/** Priorität ab 1, `undefined` für unsortierte Spalten. */
export function sortPriority<K extends string>(
  criteria: readonly SortCriterion<K>[],
  key: K,
): number | undefined {
  const index = criteria.findIndex((criterion) => criterion.key === key);
  return index === -1 ? undefined : index + 1;
}

/** Sortiert stabil nach mehreren Kriterien; fehlende Werte stehen immer am Ende. */
export function sortByCriteria<T, K extends string>(
  rows: readonly T[],
  criteria: readonly SortCriterion<K>[],
  valueOf: (row: T, key: K) => SortValue,
): T[] {
  if (criteria.length === 0) return [...rows];
  return [...rows].sort((a, b) => {
    for (const criterion of criteria) {
      const comparison = compareValues(
        valueOf(a, criterion.key),
        valueOf(b, criterion.key),
        criterion.direction,
      );
      if (comparison !== 0) return comparison;
    }
    return 0;
  });
}

function compareValues(left: SortValue, right: SortValue, direction: SortDirection): number {
  if (left === undefined && right === undefined) return 0;
  if (left === undefined) return 1;
  if (right === undefined) return -1;
  const base =
    typeof left === 'number' && typeof right === 'number'
      ? left - right
      : String(left).localeCompare(String(right), 'de');
  return direction === 'asc' ? base : -base;
}
