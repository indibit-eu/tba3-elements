import { percent } from './classification';
import type { AggregationsValueGroup } from './index';
import { resolveLabel, type ValueLabels } from './labels';
import { categoryColor, themeColor } from './theme';
import type { GroupedValueGroups } from './value-groups';

export type AggregationEntry = AggregationsValueGroup['aggregations'][number];

/** Teilnahme-Kopfzahl: `total` sind die Angemeldeten, `frequency` die Teilgenommenen. */
export const PARTICIPATION_AGGREGATION = 'students-by-participation';

/** Personen je schwächster Classification über die Domänen eines Fachs. */
export const MINIMUM_CLASSIFICATION_AGGREGATION = 'minimumClassification';

export const GENDER_AGGREGATION = 'students-by-gender';
export const LANGUAGE_AT_HOME_AGGREGATION = 'students-by-languageAtHome';
export const SES_AGGREGATION = 'students-by-ses';
export const GROUPS_PARTICIPATION_AGGREGATION = 'groups-by-participation';
export const SCHOOLS_PARTICIPATION_AGGREGATION = 'schools-by-participation';
export const AUTHORITIES_PARTICIPATION_AGGREGATION = 'authorities-by-participation';

export interface UnitAggregation {
  type: string;
  unit: string;
  icon: string;
  fallback: string;
}

/** Einheiten-Kopfzahlen von grob nach fein. */
export const UNIT_AGGREGATIONS: readonly UnitAggregation[] = [
  {
    type: AUTHORITIES_PARTICIPATION_AGGREGATION,
    unit: 'authorities',
    icon: 'fa-building-columns',
    fallback: 'Schulämter',
  },
  {
    type: SCHOOLS_PARTICIPATION_AGGREGATION,
    unit: 'schools',
    icon: 'fa-school',
    fallback: 'Schulen',
  },
  {
    type: GROUPS_PARTICIPATION_AGGREGATION,
    unit: 'groups',
    icon: 'fa-chalkboard-user',
    fallback: 'Klassen',
  },
];

export function unitLabel(labels: ValueLabels | undefined, unit: string, fallback: string): string {
  // resolveLabel liefert ohne Treffer den Rohwert.
  const resolved = resolveLabel(labels, 'unit', unit);
  return resolved === unit ? fallback : resolved;
}

const KNOWN_CHARACTERISTICS: readonly string[] = [
  GENDER_AGGREGATION,
  LANGUAGE_AT_HOME_AGGREGATION,
  SES_AGGREGATION,
];

/** Merkmalsarten ohne Teilnahme-Kopfzahlen, bekannte Merkmale zuerst. */
export function characteristicTypes(types: readonly string[]): string[] {
  const distinct = [...new Set(types)].filter((type) => !type.endsWith('-by-participation'));
  const known = KNOWN_CHARACTERISTICS.filter((type) => distinct.includes(type));
  const rest = distinct.filter((type) => !KNOWN_CHARACTERISTICS.includes(type));
  return [...known, ...rest];
}

/** Merkmal einer Kopfzahl-Art, z. B. `gender` aus `students-by-gender`. */
export function characteristicOf(type: string): string {
  const match = /^(?:students|groups|schools|authorities)-by-(.+)$/.exec(type);
  return match ? match[1] : type;
}

const COMPOSITION_TYPE_ALIASES: ReadonlyMap<string, string> = new Map([
  ['gender', GENDER_AGGREGATION],
  ['ses', SES_AGGREGATION],
  ['languageathome', LANGUAGE_AT_HOME_AGGREGATION],
]);

const CLASS_COUNT_TYPE = 'classcount';

/** Bildet Kopfzahlen ohne Präfix (`gender`, `SES`, `classCount`) auf die Präfix-Form ab. */
export function compositionEntries(entries: readonly AggregationEntry[]): AggregationEntry[] {
  return entries.map((entry) => {
    const key = entry.type.toLowerCase();
    if (key === CLASS_COUNT_TYPE) {
      return { ...entry, type: GROUPS_PARTICIPATION_AGGREGATION, value: 'participated' };
    }
    const alias = COMPOSITION_TYPE_ALIASES.get(key);
    return alias ? { ...entry, type: alias } : entry;
  });
}

/** Art des ersten Aggregationseintrags der Gruppe. */
export function aggregationTypeOf(
  focus: GroupedValueGroups<AggregationsValueGroup> | undefined,
): string | undefined {
  if (!focus) return undefined;
  for (const group of focus.groups) {
    const first = group.aggregations[0];
    if (first) return first.type;
  }
  return undefined;
}

export function entriesOfType(
  groups: readonly AggregationsValueGroup[],
  type: string,
): AggregationEntry[] {
  return groups.flatMap((group) => group.aggregations).filter((entry) => entry.type === type);
}

export function hasMinimumClassification(group: AggregationsValueGroup): boolean {
  return group.aggregations.some((entry) => entry.type === MINIMUM_CLASSIFICATION_AGGREGATION);
}

export function nonMinimumClassificationEntries(group: AggregationsValueGroup): AggregationEntry[] {
  return group.aggregations.filter((entry) => entry.type !== MINIMUM_CLASSIFICATION_AGGREGATION);
}

/** Schlüssel `type.value`, eindeutig auch über Aggregationsarten hinweg. */
export function entryKey(entry: AggregationEntry): string {
  return `${entry.type}.${entry.value}`;
}

export interface AggregationBlock {
  key: string;
  label: string;
  domain?: string;
  type: string;
  group: AggregationsValueGroup;
  entries: AggregationEntry[];
}

/** Blöcke je Domäne, ohne Domäne je Aggregationsart. */
export function aggregationBlocks(
  groups: readonly AggregationsValueGroup[],
  labels?: ValueLabels,
): AggregationBlock[] {
  const blocks: AggregationBlock[] = [];
  const byKey = new Map<string, AggregationBlock>();
  const add = (block: AggregationBlock): void => {
    const existing = byKey.get(block.key);
    if (existing) {
      existing.entries.push(...block.entries);
      return;
    }
    byKey.set(block.key, block);
    blocks.push(block);
  };
  for (const group of groups) {
    const domain = group.domain?.name;
    if (domain !== undefined) {
      const type = group.aggregations[0]?.type;
      if (type === undefined) continue;
      const entries = group.aggregations.filter((entry) => entry.type === type);
      add({ key: `domain:${domain}`, label: domain, domain, type, group, entries });
      continue;
    }
    for (const type of new Set(group.aggregations.map((entry) => entry.type))) {
      const entries = group.aggregations.filter((entry) => entry.type === type);
      add({
        key: `type:${type}`,
        label: resolveLabel(labels, 'aggregation', type),
        type,
        group,
        entries,
      });
    }
  }
  return blocks;
}

export interface AggregationValue {
  code?: string;
  name: string;
}

/** Kennung und Name eines Werts; der Rohwert gilt nur als Kennung, wenn ein Klartext vorliegt. */
export function aggregationValue(entry: AggregationEntry, labels?: ValueLabels): AggregationValue {
  const description = entry.description?.trim() ? entry.description : undefined;
  const hasLabel = labels?.[`${entry.type}.${entry.value}`] !== undefined;
  const name = resolveLabel(labels, entry.type, entry.value, { description });
  return description !== undefined || hasLabel ? { code: entry.value, name } : { name };
}

export interface CharacteristicSegment {
  label: string;
  value: number;
  color: string;
}

export interface ParticipationShare {
  participated: number;
  registered: number;
  withoutParticipation: number;
  share: number;
}

export function participationShare(
  entries: readonly AggregationEntry[],
): ParticipationShare | undefined {
  const participated = entries.find(
    (entry) => entry.type === PARTICIPATION_AGGREGATION && entry.value === 'participated',
  );
  if (!participated) return undefined;
  const { total, frequency } = participated.descriptiveStatistics;
  const withoutParticipation = Math.max(0, total - frequency);
  const share = total > 0 ? frequency / total : 0;
  return { participated: frequency, registered: total, withoutParticipation, share };
}

export function registeredUnitCount(
  entries: readonly AggregationEntry[],
  type: string,
): number | undefined {
  const entry = entries.find((item) => item.type === type && item.value === 'participated');
  return entry?.descriptiveStatistics.total;
}

export interface ParticipationDonutParts {
  centerLabel: string;
  segments: { label: string; value: number; color: string }[];
}

export function participationDonutParts(share: ParticipationShare): ParticipationDonutParts {
  return {
    centerLabel: `${percent(share.share)} %`,
    segments: [
      // Eigene Variable, damit das Grün nicht mit `--tba3-deviation-better` zusammenfällt.
      {
        label: 'teilgenommen',
        value: share.participated,
        color: themeColor('--tba3-participation'),
      },
      {
        label: 'ohne Teilnahme',
        value: share.withoutParticipation,
        color: themeColor('--tba3-category-none'),
      },
    ],
  };
}

/** Donut-Segmente eines Merkmals; leer, wenn weniger als zwei Ausprägungen Personen haben. */
export function characteristicSegments(
  entries: readonly AggregationEntry[],
  type: string,
  labels?: ValueLabels,
): CharacteristicSegment[] {
  const matching = entries.filter(
    (entry) => entry.type === type && entry.descriptiveStatistics.frequency > 0,
  );
  if (matching.length < 2) return [];
  const characteristic = characteristicOf(type);
  return matching.map((entry, index) => ({
    label: resolveLabel(labels, characteristic, entry.value, { description: entry.description }),
    value: entry.descriptiveStatistics.frequency,
    color: categoryColor(index),
  }));
}

/** Personenzahl aus der Geschlechts-Kopfzahl, als Rückfall ohne Teilnahme-Kopfzahl. */
export function characteristicTotal(
  byType: ReadonlyMap<string, AggregationEntry[]>,
): number | undefined {
  return byType.get(GENDER_AGGREGATION)?.[0]?.descriptiveStatistics.total;
}
