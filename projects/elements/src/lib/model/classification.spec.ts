import { describe, expect, it } from 'vitest';
import {
  classificationAxisLabel,
  classificationBands,
  classificationDistribution,
  hasClassifications,
  hasMultipleSets,
  isClassification,
  minimumClassificationDistribution,
  normalizeClassification,
  percent,
  STANDARD_METRICS,
  standardMetric,
  totalOf,
} from './classification';
import type { AggregationsValueGroup, CompetenceLevelsValueGroup } from './index';

function level(
  nameShort: string,
  classification: string | undefined,
  frequency: number,
  total: number,
) {
  return {
    nameShort,
    classification:
      classification as CompetenceLevelsValueGroup['competenceLevels'][number]['classification'],
    descriptiveStatistics: { total, frequency, mean: total ? frequency / total : 0 },
  };
}

const hsa: CompetenceLevelsValueGroup = {
  id: 'school-1',
  name: 'Gesamtschule Birkenmoor',
  type: 'school',
  subject: { name: 'Deutsch' },
  properties: [{ key: 'competenceLevelSet', value: 'HSA' }],
  competenceLevels: [
    level('Ia', 'unter Mindeststandard', 4, 40),
    level('Ib', 'unter Mindeststandard', 6, 40),
    level('II', 'Mindeststandard', 10, 40),
    level('III', 'Regelstandard', 12, 40),
    level('IV', 'Regelstandard plus', 6, 40),
    level('V', 'Optimalstandard', 2, 40),
  ],
};

const msa: CompetenceLevelsValueGroup = {
  ...hsa,
  properties: [{ key: 'competenceLevelSet', value: 'MSA' }],
  competenceLevels: [
    level('I', 'unter Mindeststandard', 5, 60),
    level('II', 'Mindeststandard', 15, 60),
    level('III', 'Regelstandard', 20, 60),
    level('IV', 'Regelstandard plus', 12, 60),
    level('V', 'Optimalstandard', 8, 60),
  ],
};

const state: CompetenceLevelsValueGroup = {
  id: 'state-average',
  name: 'Landesmittelwert',
  type: 'state',
  competenceLevels: [
    level('I', 'unter Mindeststandard', 100, 1000),
    level('II', 'Mindeststandard', 300, 1000),
    level('III', 'Regelstandard', 400, 1000),
    level('IV', 'Regelstandard plus', 150, 1000),
    level('V', 'Optimalstandard', 50, 1000),
  ],
};

describe('classificationDistribution', () => {
  it('fasst Stufensets derselben Gruppe zu einer Verteilung zusammen', () => {
    const [school] = classificationDistribution([hsa, msa]);
    expect(school.total).toBe(100);
    expect(school.counts['unter Mindeststandard']).toBe(15);
    expect(school.counts['Mindeststandard']).toBe(25);
    expect(school.counts['Optimalstandard']).toBe(10);
    expect(school.belowMinimum).toBeCloseTo(0.15);
    expect(school.minimumReached).toBeCloseTo(0.85);
    expect(school.upperRange).toBeCloseTo(0.28);
    expect(school.optimal).toBeCloseTo(0.1);
  });

  it('liefert je Gruppe eine Verteilung in Antwort-Reihenfolge', () => {
    const result = classificationDistribution([hsa, state, msa]);
    expect(result.map((d) => d.key)).toEqual(['school:school-1', 'state:state-average']);
    expect(result[1].belowMinimum).toBeCloseTo(0.1);
  });

  it('zählt Stufen ohne Classification als unclassified', () => {
    const [group] = classificationDistribution([
      {
        name: 'ohne',
        competenceLevels: [level('X', undefined, 3, 10), level('II', 'Mindeststandard', 7, 10)],
      },
    ]);
    expect(group.unclassified).toBe(3);
    expect(group.minimumReached).toBeCloseTo(0.7);
  });

  it('verträgt leere Verteilungen', () => {
    expect(classificationDistribution([])).toEqual([]);
    const [empty] = classificationDistribution([{ name: 'leer', competenceLevels: [] }]);
    expect(empty.total).toBe(0);
    expect(empty.minimumReached).toBe(0);
  });
});

describe('hasClassifications', () => {
  it('erkennt Verteilungen mit klassifizierten Personen', () => {
    const [school] = classificationDistribution([hsa, msa]);
    expect(hasClassifications(school)).toBe(true);
  });

  it('ist falsch für eine leere Verteilung ohne Teilnehmende', () => {
    const [empty] = classificationDistribution([{ name: 'leer', competenceLevels: [] }]);
    expect(hasClassifications(empty)).toBe(false);
  });

  it('ist falsch, wenn nur unklassifizierte Stufen vorliegen', () => {
    const [group] = classificationDistribution([
      { name: 'ohne', competenceLevels: [level('X', undefined, 10, 10)] },
    ]);
    expect(group.total).toBe(10);
    expect(group.unclassified).toBe(10);
    expect(hasClassifications(group)).toBe(false);
  });
});

describe('percent', () => {
  it('rundet einen Anteil auf ganze Prozent', () => {
    expect(percent(0.849)).toBe(85);
    expect(percent(0)).toBe(0);
  });
});

describe('totalOf und hasMultipleSets', () => {
  it('nimmt das größte total einer Verteilung', () => {
    expect(totalOf(hsa)).toBe(40);
    expect(totalOf({ name: 'x', competenceLevels: [level('II', 'Mindeststandard', 3, 0)] })).toBe(
      3,
    );
  });

  it('erkennt mehrere Sets an gleicher id und Domäne', () => {
    expect(hasMultipleSets([hsa, msa])).toBe(true);
    expect(hasMultipleSets([hsa, state])).toBe(false);
    expect(
      hasMultipleSets([
        { ...hsa, domain: { name: 'Lesen' } },
        { ...hsa, domain: { name: 'Zuhören' } },
      ]),
    ).toBe(false);
  });
});

describe('classificationAxisLabel', () => {
  it('bricht die fünf Classification-Namen je Wortstamm um', () => {
    expect(classificationAxisLabel('unter Mindeststandard')).toBe('unter\nMindest-\nstandard');
    expect(classificationAxisLabel('Mindeststandard')).toBe('Mindest-\nstandard');
    expect(classificationAxisLabel('Regelstandard plus')).toBe('Regel-\nstandard\nplus');
    expect(classificationAxisLabel('Optimalstandard')).toBe('Optimal-\nstandard');
  });

  it('gibt einen unbekannten Wert unverändert zurück', () => {
    expect(classificationAxisLabel('II')).toBe('II');
  });
});

describe('STANDARD_METRICS', () => {
  it('kennt die drei Kennzahlen mit Beschriftung, Wertung und Auswahl', () => {
    expect(
      STANDARD_METRICS.map((metric) => [metric.key, metric.label, metric.higherIsBetter]),
    ).toEqual([
      ['minimumReached', 'Mindeststandard erreicht', true],
      ['belowMinimum', 'Unter Mindeststandard', false],
      ['upperRange', 'Oberer Leistungsbereich', true],
    ]);
    const [distribution] = classificationDistribution([hsa]);
    expect(standardMetric('minimumReached').select(distribution)).toBe(distribution.minimumReached);
    expect(standardMetric('belowMinimum').select(distribution)).toBe(distribution.belowMinimum);
    expect(standardMetric('upperRange').select(distribution)).toBe(distribution.upperRange);
  });
});

describe('classificationBands', () => {
  it('teilt die Verteilung in unter Mindeststandard, Mitte und Optimalstandard', () => {
    const [distribution] = classificationDistribution([hsa]);
    const bands = classificationBands(distribution);
    expect(bands.map((band) => [band.key, band.label, band.count, band.variable])).toEqual([
      ['below', 'unter Mindeststandard', 10, '--tba3-classification-below-minimum'],
      ['middle', 'Mindeststandard bis Regelstandard plus', 28, '--tba3-bar'],
      ['optimal', 'Optimalstandard', 2, '--tba3-classification-optimal'],
    ]);
    expect(bands.map((band) => Math.round(band.share * 100))).toEqual([25, 70, 5]);
    expect(bands[0].marker).toEqual({
      icon: 'fa-triangle-exclamation',
      color: 'var(--tba3-mark-alert)',
      title: 'Unter Mindeststandard',
    });
    expect(bands[1].marker).toBeUndefined();
    expect(bands[2].marker).toEqual({
      icon: 'fa-crown',
      color: 'var(--tba3-mark-top)',
      title: 'Optimalstandard',
    });
  });

  it('lässt den Marker weg, wenn ein Band keine Teilnehmenden hat', () => {
    const group: CompetenceLevelsValueGroup = {
      ...hsa,
      competenceLevels: [level('II', 'Mindeststandard', 10, 10)],
    };
    const [distribution] = classificationDistribution([group]);
    const bands = classificationBands(distribution);
    expect(bands.map((band) => band.count)).toEqual([0, 10, 0]);
    expect(bands[0].marker).toBeUndefined();
    expect(bands[2].marker).toBeUndefined();
  });
});

describe('normalizeClassification', () => {
  it('liefert die kanonische Schreibweise unabhängig von Groß- und Kleinschreibung', () => {
    expect(normalizeClassification('Regelstandard Plus')).toBe('Regelstandard plus');
    expect(normalizeClassification(' regelstandard plus ')).toBe('Regelstandard plus');
    expect(normalizeClassification('OPTIMALSTANDARD')).toBe('Optimalstandard');
  });

  it('liefert undefined für unbekannte und fehlende Werte', () => {
    expect(normalizeClassification('orange')).toBeUndefined();
    expect(normalizeClassification(null)).toBeUndefined();
    expect(normalizeClassification(undefined)).toBeUndefined();
    expect(isClassification('Regelstandard Plus')).toBe(true);
    expect(isClassification('red')).toBe(false);
  });

  it('zählt beide Schreibweisen in classificationDistribution', () => {
    const group: CompetenceLevelsValueGroup = {
      id: 'g',
      name: 'G',
      competenceLevels: [
        level('III', 'Regelstandard', 5, 20),
        level('IV', 'Regelstandard Plus' as string, 10, 20),
        level('V', 'Optimalstandard', 5, 20),
      ],
    };
    const [distribution] = classificationDistribution([group]);
    expect(distribution.counts['Regelstandard plus']).toBe(10);
    expect(distribution.unclassified).toBe(0);
    expect(distribution.upperRange).toBeCloseTo(0.75);
  });
});

function minimum(
  id: string,
  type: string,
  subject: string,
  counts: Record<string, number>,
): AggregationsValueGroup {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  return {
    id,
    name: id,
    type,
    subject: { name: subject },
    aggregations: Object.entries(counts).map(([value, frequency]) => ({
      type: 'minimumClassification',
      value,
      descriptiveStatistics: { total, frequency, mean: frequency / total, standardDeviation: 0 },
    })),
  };
}

describe('minimumClassificationDistribution', () => {
  const school = minimum('7', 'school', 'Deutsch', {
    'unter Mindeststandard': 20,
    Mindeststandard: 30,
    Regelstandard: 30,
    'Regelstandard plus': 15,
    Optimalstandard: 5,
  });

  it('bildet je Gruppe und Fach eine Verteilung mit den Standard-Kennzahlen', () => {
    const [distribution] = minimumClassificationDistribution([school]);
    expect(distribution).toMatchObject({
      key: 'school:7',
      type: 'school',
      subject: 'Deutsch',
      total: 100,
    });
    expect(distribution.belowMinimum).toBeCloseTo(0.2);
    expect(distribution.minimumReached).toBeCloseTo(0.8);
    expect(distribution.upperRange).toBeCloseTo(0.2);
    expect(distribution.optimal).toBeCloseTo(0.05);
  });

  it('trennt Fächer und Ebenen mit gleicher id', () => {
    const english = minimum('7', 'school', 'Englisch', { Mindeststandard: 10 });
    const state = minimum('7', 'state', 'Deutsch', {
      'unter Mindeststandard': 1,
      Regelstandard: 3,
    });
    const result = minimumClassificationDistribution([school, english, state]);
    expect(result.map((d) => [d.subject, d.key, d.total])).toEqual([
      ['Deutsch', 'school:7', 100],
      ['Deutsch', 'state:7', 4],
      ['Englisch', 'school:7', 10],
    ]);
  });

  it('übergeht andere Aggregationsarten und zählt unbekannte Werte als unklassifiziert', () => {
    const mixed: AggregationsValueGroup = {
      ...minimum('g', 'group', 'Mathematik', { Regelstandard: 8, red: 2 }),
    };
    const other: AggregationsValueGroup = {
      id: 'x',
      name: 'x',
      aggregations: [
        {
          type: 'gender',
          value: 'female',
          descriptiveStatistics: { total: 2, frequency: 1, mean: 0.5, standardDeviation: 0 },
        },
      ],
    };
    const result = minimumClassificationDistribution([mixed, other]);
    expect(result).toHaveLength(1);
    expect(result[0].unclassified).toBe(2);
    expect(result[0].minimumReached).toBeCloseTo(0.8);
  });
});
