import type { ValueGroupType } from './index';

/** Gemeinsame Felder aller Value-Groups, egal ob mit Kompetenzstufen, Aggregationen oder Items. */
export interface ValueGroupLike {
  id?: string;
  type?: string;
  name?: string;
  domain?: { id?: string; name: string };
  subject?: { id?: string; name: string };
  covariates?: { type: string; label?: string; value: string }[];
  properties?: { key: string; value: string }[];
}

const TYPE_RANK: Readonly<Record<ValueGroupType, number>> = {
  student: 0,
  group: 1,
  school: 2,
  comparisonSchool: 2,
  district: 3,
  authority: 4,
  state: 5,
};

const UNKNOWN_RANK = Math.max(...Object.values(TYPE_RANK)) + 1;

/** Rang von fein nach grob; unbekannte Typen gelten als gröbste Stufe. */
export function typeRank(type: string | undefined): number {
  return TYPE_RANK[type as ValueGroupType] ?? UNKNOWN_RANK;
}

export function byType<T extends ValueGroupLike>(groups: readonly T[], type: ValueGroupType): T[] {
  return groups.filter((group) => group.type === type);
}

/** `typ:id` (ohne `id` `typ:name`); der Typ trennt Ebenen mit gleicher `id`. */
export function groupKey(group: ValueGroupLike): string {
  return `${group.type ?? ''}:${group.id ?? group.name ?? ''}`;
}

export interface GroupKeyParts {
  type: string;
  id: string;
}

/** Umkehrung von {@link groupKey}; die Kennung darf selbst Doppelpunkte enthalten. */
export function parseGroupKey(key: string): GroupKeyParts {
  const colon = key.indexOf(':');
  if (colon < 0) return { type: '', id: key };
  return { type: key.slice(0, colon), id: key.slice(colon + 1) };
}

/** Alle Value-Groups einer Gruppe, zusammengeführt über {@link groupKey}. */
export interface GroupedValueGroups<T extends ValueGroupLike> {
  key: string;
  name: string;
  type: string | undefined;
  groups: T[];
}

function bucket<T extends ValueGroupLike>(
  groups: readonly T[],
  extraKey: (group: T) => string,
): GroupedValueGroups<T>[] {
  const result: GroupedValueGroups<T>[] = [];
  const index = new Map<string, GroupedValueGroups<T>>();
  for (const group of groups) {
    const key = groupKey(group);
    const compositeKey = `${key}|${extraKey(group)}`;
    let entry = index.get(compositeKey);
    if (!entry) {
      entry = { key, name: group.name ?? group.id ?? key, type: group.type, groups: [] };
      index.set(compositeKey, entry);
      result.push(entry);
    }
    entry.groups.push(group);
  }
  return result;
}

export function groupById<T extends ValueGroupLike>(groups: readonly T[]): GroupedValueGroups<T>[] {
  return bucket(groups, () => '');
}

export function groupByIdAndDomain<T extends ValueGroupLike>(
  groups: readonly T[],
): GroupedValueGroups<T>[] {
  return bucket(groups, (group) => group.domain?.name ?? '');
}

export interface SubjectGroup<T extends ValueGroupLike> {
  subject: string | undefined;
  groups: T[];
}

/** Trennt nach Fach, weil fachweite Value-Groups verschiedener Fächer dieselbe `id` tragen. */
export function groupBySubject<T extends ValueGroupLike>(groups: readonly T[]): SubjectGroup<T>[] {
  const result: SubjectGroup<T>[] = [];
  const index = new Map<string, SubjectGroup<T>>();
  for (const group of groups) {
    const subject = group.subject?.name;
    const key = subject ?? '';
    let entry = index.get(key);
    if (!entry) {
      entry = { subject, groups: [] };
      index.set(key, entry);
      result.push(entry);
    }
    entry.groups.push(group);
  }
  return result;
}

export interface ValueGroupRoles<T extends ValueGroupLike> {
  focus: GroupedValueGroups<T> | undefined;
  comparisons: GroupedValueGroups<T>[];
  parts: GroupedValueGroups<T>[];
}

/** Erste Gruppe ist die Hauptgruppe, feinere sind Teilgruppen, übrige Vergleichsgruppen. */
export function splitByRole<T extends ValueGroupLike>(groups: readonly T[]): ValueGroupRoles<T> {
  const grouped = groupById(groups);
  const focus = grouped[0];
  if (!focus) return { focus: undefined, comparisons: [], parts: [] };
  const focusRank = typeRank(focus.type);
  const comparisons: GroupedValueGroups<T>[] = [];
  const parts: GroupedValueGroups<T>[] = [];
  for (const entry of grouped.slice(1)) {
    if (typeRank(entry.type) < focusRank) {
      parts.push(entry);
    } else {
      comparisons.push(entry);
    }
  }
  return { focus, comparisons, parts };
}

function distinct<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

export function domainNames(groups: readonly ValueGroupLike[]): (string | undefined)[] {
  return distinct(groups.map((group) => group.domain?.name));
}

export function subjectNames(groups: readonly ValueGroupLike[]): (string | undefined)[] {
  return distinct(groups.map((group) => group.subject?.name));
}

/** Fach, Domäne und Gruppe für die Blockzeile, jeweils nur, wenn sie in `all` variieren. */
export function blockLabelParts(all: readonly ValueGroupLike[], group: ValueGroupLike): string[] {
  if (all.length < 2) return [];
  const parts: string[] = [];
  if (distinct(all.map((g) => g.subject?.name)).length > 1 && group.subject?.name) {
    parts.push(group.subject.name);
  }
  if (distinct(all.map((g) => g.domain?.name)).length > 1 && group.domain?.name) {
    parts.push(group.domain.name);
  }
  if (distinct(all.map(groupKey)).length > 1 && (group.name ?? group.id)) {
    parts.push(group.name ?? group.id ?? '');
  }
  return parts;
}

/** Nach Fach, Domäne und Gruppe, numerisch bewusst („8a" vor „10a"). */
export function compareBlocks(a: ValueGroupLike, b: ValueGroupLike): number {
  const byText = (x: string | undefined, y: string | undefined) =>
    (x ?? '').localeCompare(y ?? '', 'de', { numeric: true, sensitivity: 'base' });
  return (
    byText(a.subject?.name, b.subject?.name) ||
    byText(a.domain?.name, b.domain?.name) ||
    byText(a.name ?? a.id, b.name ?? b.id)
  );
}
