import { hasMinimumClassification, MINIMUM_CLASSIFICATION_AGGREGATION } from './aggregations';
import type { AggregationsValueGroup, CompetenceLevelsValueGroup } from './index';
import { classificationVariable } from './theme';
import { groupById, groupByIdAndDomain, groupBySubject } from './value-groups';

/** Die fünf Classifications von schwach nach stark. */
export const CLASSIFICATIONS = [
  'unter Mindeststandard',
  'Mindeststandard',
  'Regelstandard',
  'Regelstandard plus',
  'Optimalstandard',
] as const;

export type Classification = (typeof CLASSIFICATIONS)[number];

export const BELOW_MINIMUM: Classification = CLASSIFICATIONS[0];

export const OPTIMAL: Classification = CLASSIFICATIONS[CLASSIFICATIONS.length - 1];

export type CompetenceLevelEntry = CompetenceLevelsValueGroup['competenceLevels'][number];

const CLASSIFICATIONS_BY_LOWER_CASE: ReadonlyMap<string, Classification> = new Map(
  CLASSIFICATIONS.map((classification) => [classification.toLowerCase(), classification]),
);

/** Kanonische Classification, unabhängig von Groß- und Kleinschreibung. */
export function normalizeClassification(
  value: string | null | undefined,
): Classification | undefined {
  return value ? CLASSIFICATIONS_BY_LOWER_CASE.get(value.trim().toLowerCase()) : undefined;
}

export function isClassification(value: string | null | undefined): boolean {
  return normalizeClassification(value) !== undefined;
}

// Die vollen Namen überlappen auf schmalen Achsen, darum fester Umbruch je Wortstamm.
const CLASSIFICATION_AXIS_LABELS: Readonly<Record<Classification, string>> = {
  'unter Mindeststandard': 'unter\nMindest-\nstandard',
  Mindeststandard: 'Mindest-\nstandard',
  Regelstandard: 'Regel-\nstandard',
  'Regelstandard plus': 'Regel-\nstandard\nplus',
  Optimalstandard: 'Optimal-\nstandard',
};

/** Mehrzeilige Achsenbeschriftung einer Classification. */
export function classificationAxisLabel(classification: string): string {
  const known = normalizeClassification(classification);
  return known ? CLASSIFICATION_AXIS_LABELS[known] : classification;
}

/** Anteil (0 bis 1) in ganzen Prozent, damit Differenzen auf den angezeigten Zahlen beruhen. */
export function percent(share: number): number {
  return Math.round(share * 100);
}

/** Verteilung einer Gruppe über die Classifications; Anteile von 0 bis 1. */
export interface ClassificationDistribution {
  key: string;
  name: string;
  type: string | undefined;
  subject?: string;
  total: number;
  counts: Readonly<Record<Classification, number>>;
  shares: Readonly<Record<Classification, number>>;
  belowMinimum: number;
  minimumReached: number;
  upperRange: number;
  optimal: number;
  unclassified: number;
}

function emptyCounts(): Record<Classification, number> {
  return Object.fromEntries(CLASSIFICATIONS.map((c) => [c, 0])) as Record<Classification, number>;
}

/** Größter `total` der Stufen, sonst die Summe der Häufigkeiten. */
export function totalOf(group: CompetenceLevelsValueGroup): number {
  const totals = group.competenceLevels.map((level) => level.descriptiveStatistics.total);
  const max = totals.length ? Math.max(...totals) : 0;
  if (max > 0) return max;
  return group.competenceLevels.reduce(
    (sum, level) => sum + level.descriptiveStatistics.frequency,
    0,
  );
}

interface DistributionInput {
  key: string;
  name: string;
  type: string | undefined;
  subject?: string;
  total: number;
  frequencies: readonly { classification: string | null | undefined; frequency: number }[];
}

function distributionOf(input: DistributionInput): ClassificationDistribution {
  const counts = emptyCounts();
  let unclassified = 0;
  for (const { classification, frequency } of input.frequencies) {
    const known = normalizeClassification(classification);
    if (known) {
      counts[known] += frequency;
    } else {
      unclassified += frequency;
    }
  }
  const total = input.total;
  const share = (count: number) => (total > 0 ? count / total : 0);
  const shares = Object.fromEntries(CLASSIFICATIONS.map((c) => [c, share(counts[c])])) as Record<
    Classification,
    number
  >;
  const belowMinimum = shares['unter Mindeststandard'];
  const classified = CLASSIFICATIONS.reduce((sum, c) => sum + shares[c], 0);
  return {
    key: input.key,
    name: input.name,
    type: input.type,
    ...(input.subject !== undefined && { subject: input.subject }),
    total,
    counts,
    shares,
    belowMinimum,
    minimumReached: Math.max(0, classified - belowMinimum),
    upperRange: shares['Regelstandard plus'] + shares['Optimalstandard'],
    optimal: shares['Optimalstandard'],
    unclassified,
  };
}

/** Verteilung je Gruppe; nur Value-Groups einer Domäne übergeben, sonst zählen Personen doppelt. */
export function classificationDistribution(
  groups: readonly CompetenceLevelsValueGroup[],
): ClassificationDistribution[] {
  return groupById(groups).map((entry) =>
    distributionOf({
      key: entry.key,
      name: entry.name,
      type: entry.type,
      total: entry.groups.reduce((sum, group) => sum + totalOf(group), 0),
      frequencies: entry.groups.flatMap((group) =>
        group.competenceLevels.map((level) => ({
          classification: level.classification,
          frequency: level.descriptiveStatistics.frequency,
        })),
      ),
    }),
  );
}

/** Verteilung der schwächsten Classification je Person, je Gruppe und Fach. */
export function minimumClassificationDistribution(
  groups: readonly AggregationsValueGroup[],
): ClassificationDistribution[] {
  const relevant = groups.filter(hasMinimumClassification);
  return groupBySubject(relevant).flatMap(({ subject, groups: subjectGroups }) =>
    groupById(subjectGroups).map((entry) => {
      const entries = entry.groups.flatMap((group) =>
        group.aggregations.filter((item) => item.type === MINIMUM_CLASSIFICATION_AGGREGATION),
      );
      const totals = entries.map((item) => item.descriptiveStatistics.total);
      const maxTotal = totals.length ? Math.max(...totals) : 0;
      const frequencies = entries.map((item) => ({
        classification: item.value,
        frequency: item.descriptiveStatistics.frequency,
      }));
      return distributionOf({
        key: entry.key,
        name: entry.name,
        type: entry.type,
        subject,
        total: maxTotal > 0 ? maxTotal : frequencies.reduce((sum, f) => sum + f.frequency, 0),
        frequencies,
      });
    }),
  );
}

/** Ob eine Gruppe in einer Domäne mehr als ein Stufenset trägt. */
export function hasMultipleSets(groups: readonly CompetenceLevelsValueGroup[]): boolean {
  return groupByIdAndDomain(groups).some((entry) => entry.groups.length > 1);
}

/** Ob die Verteilung mindestens eine klassifizierte Person enthält. */
export function hasClassifications(distribution: ClassificationDistribution): boolean {
  return distribution.total > 0 && distribution.unclassified < distribution.total;
}

export type StandardMetricKey = 'minimumReached' | 'belowMinimum' | 'upperRange';

export interface StandardMetric {
  key: StandardMetricKey;
  label: string;
  higherIsBetter: boolean;
  select: (distribution: ClassificationDistribution) => number;
}

export const STANDARD_METRICS: readonly StandardMetric[] = [
  {
    key: 'minimumReached',
    label: 'Mindeststandard erreicht',
    higherIsBetter: true,
    select: (distribution) => distribution.minimumReached,
  },
  {
    key: 'belowMinimum',
    label: 'Unter Mindeststandard',
    higherIsBetter: false,
    select: (distribution) => distribution.belowMinimum,
  },
  {
    key: 'upperRange',
    label: 'Oberer Leistungsbereich',
    higherIsBetter: true,
    select: (distribution) => distribution.upperRange,
  },
];

export function standardMetric(key: StandardMetricKey): StandardMetric {
  const metric = STANDARD_METRICS.find((candidate) => candidate.key === key);
  return metric ?? STANDARD_METRICS[0];
}

export type ClassificationBandKey = 'below' | 'middle' | 'optimal';

export interface ClassificationBandMarker {
  icon: string;
  color: string;
  title: string;
}

export interface ClassificationBandDefinition {
  key: ClassificationBandKey;
  label: string;
  variable: string;
  marker?: ClassificationBandMarker;
}

/** Die drei Bänder; die Mitte fasst drei Classifications in neutralem Grau zusammen. */
export const CLASSIFICATION_BANDS: readonly ClassificationBandDefinition[] = [
  {
    key: 'below',
    label: 'unter Mindeststandard',
    variable: classificationVariable('unter Mindeststandard'),
    marker: {
      icon: 'fa-triangle-exclamation',
      color: 'var(--tba3-mark-alert)',
      title: 'Unter Mindeststandard',
    },
  },
  { key: 'middle', label: 'Mindeststandard bis Regelstandard plus', variable: '--tba3-bar' },
  {
    key: 'optimal',
    label: 'Optimalstandard',
    variable: classificationVariable('Optimalstandard'),
    marker: { icon: 'fa-crown', color: 'var(--tba3-mark-top)', title: 'Optimalstandard' },
  },
];

export interface ClassificationBand extends ClassificationBandDefinition {
  count: number;
  share: number;
}

/** Die drei Bänder einer Verteilung; leere Bänder tragen keinen Marker. */
export function classificationBands(
  distribution: ClassificationDistribution,
): ClassificationBand[] {
  const counts = distribution.counts;
  const share = (count: number) => (distribution.total > 0 ? count / distribution.total : 0);
  const countOf: Readonly<Record<ClassificationBandKey, number>> = {
    below: counts['unter Mindeststandard'],
    middle: counts['Mindeststandard'] + counts['Regelstandard'] + counts['Regelstandard plus'],
    optimal: counts['Optimalstandard'],
  };
  return CLASSIFICATION_BANDS.map(({ marker, ...definition }) => {
    const count = countOf[definition.key];
    return { ...definition, count, share: share(count), ...(count > 0 && marker && { marker }) };
  });
}
