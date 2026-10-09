import { describe, expect, it } from 'vitest';
import {
  aggregationBlocks,
  aggregationTypeOf,
  aggregationValue,
  entryKey,
  characteristicOf,
  characteristicSegments,
  characteristicTotal,
  characteristicTypes,
  compositionEntries,
  entriesOfType,
  hasMinimumClassification,
  nonMinimumClassificationEntries,
  participationDonutParts,
  participationShare,
  registeredUnitCount,
  UNIT_AGGREGATIONS,
  unitLabel,
  type AggregationEntry,
} from './aggregations';
import type { AggregationsValueGroup } from './index';
import type { ValueLabels } from './labels';
import type { GroupedValueGroups } from './value-groups';
import { themeColor } from './theme';

function entry(
  type: string,
  value: string,
  frequency: number,
  total: number,
  description?: string,
): AggregationEntry {
  return {
    type,
    value,
    description,
    descriptiveStatistics: { total, frequency, mean: 0, standardDeviation: 0 },
  } as AggregationEntry;
}

describe('participationShare', () => {
  it('liest Angemeldete, Teilgenommene und den Anteil aus dem Eintrag `participated`', () => {
    const share = participationShare([entry('students-by-participation', 'participated', 24, 25)]);
    expect(share).toEqual({
      participated: 24,
      registered: 25,
      withoutParticipation: 1,
      share: 24 / 25,
    });
  });

  it('gibt `undefined` ohne passenden Eintrag', () => {
    expect(participationShare([])).toBeUndefined();
    expect(participationShare([entry('gender', 'male', 12, 24)])).toBeUndefined();
    expect(
      participationShare([entry('students-by-participation', 'registered', 25, 25)]),
    ).toBeUndefined();
  });

  it('kappt „ohne Teilnahme" bei null und meldet Anteil null ohne Angemeldete', () => {
    const share = participationShare([entry('students-by-participation', 'participated', 0, 0)]);
    expect(share).toEqual({ participated: 0, registered: 0, withoutParticipation: 0, share: 0 });
  });
});

describe('registeredUnitCount', () => {
  it('liest die angemeldeten Einheiten (`total`) des Eintrags `participated`', () => {
    const entries = [entry('schools-by-participation', 'participated', 11, 12)];
    expect(registeredUnitCount(entries, 'schools-by-participation')).toBe(12);
  });

  it('gibt `undefined` ohne passenden Eintrag oder bei falscher Ausprägung', () => {
    expect(registeredUnitCount([], 'groups-by-participation')).toBeUndefined();
    expect(
      registeredUnitCount(
        [entry('groups-by-participation', 'registered', 3, 3)],
        'groups-by-participation',
      ),
    ).toBeUndefined();
    expect(
      registeredUnitCount(
        [entry('schools-by-participation', 'participated', 4, 4)],
        'authorities-by-participation',
      ),
    ).toBeUndefined();
  });
});

describe('participationDonutParts', () => {
  it('bildet Mittelbeschriftung als Prozenttext und zwei beschriftete Segmente', () => {
    const share = participationShare([entry('students-by-participation', 'participated', 24, 25)])!;
    const parts = participationDonutParts(share);
    expect(parts.centerLabel).toBe('96 %');
    expect(parts.segments.map((segment) => segment.label)).toEqual([
      'teilgenommen',
      'ohne Teilnahme',
    ]);
    expect(parts.segments.map((segment) => segment.value)).toEqual([24, 1]);
    expect(parts.segments.every((segment) => typeof segment.color === 'string')).toBe(true);
  });

  it('färbt „teilgenommen" mit der eigenen Teilnahme-Variable und „ohne Teilnahme" grau', () => {
    const share = participationShare([entry('students-by-participation', 'participated', 24, 25)])!;
    const [participated, withoutParticipation] = participationDonutParts(share).segments;
    expect(participated.color).toBe(themeColor('--tba3-participation'));
    expect(withoutParticipation.color).toBe(themeColor('--tba3-category-none'));
  });

  it('meldet null Prozent ohne Angemeldete', () => {
    const share = participationShare([entry('students-by-participation', 'participated', 0, 0)])!;
    expect(participationDonutParts(share).centerLabel).toBe('0 %');
  });
});

describe('characteristicOf', () => {
  it('schneidet das Präfix der gezählten Einheit ab', () => {
    expect(characteristicOf('students-by-gender')).toBe('gender');
    expect(characteristicOf('groups-by-languageAtHome')).toBe('languageAtHome');
    expect(characteristicOf('schools-by-ses')).toBe('ses');
  });

  it('lässt Arten ohne bekanntes Präfix unverändert', () => {
    expect(characteristicOf('gender')).toBe('gender');
    expect(characteristicOf('domain')).toBe('domain');
    expect(characteristicOf('students-in-total')).toBe('students-in-total');
  });
});

describe('characteristicSegments', () => {
  const labels: ValueLabels = {
    'gender.male': { label: 'männlich' },
    'gender.female': { label: 'weiblich' },
  };

  it('bildet ein Segment je Ausprägung in Antwortreihenfolge', () => {
    const segments = characteristicSegments(
      [entry('students-by-gender', 'male', 12, 20), entry('students-by-gender', 'female', 8, 20)],
      'students-by-gender',
      labels,
    );
    expect(segments.map((segment) => segment.label)).toEqual(['männlich', 'weiblich']);
    expect(segments.map((segment) => segment.value)).toEqual([12, 8]);
    expect(segments.every((segment) => typeof segment.color === 'string')).toBe(true);
  });

  it('löst die Beschriftung über das Merkmal ohne Präfix auf (`students-by-gender` → `gender.male`)', () => {
    const segments = characteristicSegments(
      [entry('students-by-gender', 'male', 12, 20), entry('students-by-gender', 'female', 8, 20)],
      'students-by-gender',
      labels,
    );
    expect(segments[0].label).toBe('männlich');
  });

  it('bevorzugt die `description` der Aggregation vor `valueLabels`', () => {
    const segments = characteristicSegments(
      [
        entry('students-by-gender', 'male', 12, 20, 'Junge'),
        entry('students-by-gender', 'female', 8, 20),
      ],
      'students-by-gender',
      labels,
    );
    expect(segments[0].label).toBe('Junge');
    expect(segments[1].label).toBe('weiblich');
  });

  it('liefert ein leeres Array bei weniger als zwei Ausprägungen', () => {
    expect(
      characteristicSegments(
        [entry('students-by-gender', 'male', 12, 20)],
        'students-by-gender',
        labels,
      ),
    ).toEqual([]);
    expect(characteristicSegments([], 'students-by-gender', labels)).toEqual([]);
  });

  it('übergeht Ausprägungen mit der Häufigkeit 0 (kein leeres Segment)', () => {
    const segments = characteristicSegments(
      [
        entry('students-by-gender', 'male', 12, 20),
        entry('students-by-gender', 'female', 8, 20),
        entry('students-by-gender', 'diverse', 0, 20),
      ],
      'students-by-gender',
      labels,
    );
    expect(segments.map((segment) => segment.value)).toEqual([12, 8]);
  });

  it('ergibt ohne zweite Ausprägung mit Häufigkeit keinen Donut', () => {
    // Nur `male` trägt Personen; `female` ist 0 und fällt weg, also bleibt eine Ausprägung.
    expect(
      characteristicSegments(
        [entry('students-by-gender', 'male', 20, 20), entry('students-by-gender', 'female', 0, 20)],
        'students-by-gender',
        labels,
      ),
    ).toEqual([]);
  });
});

describe('characteristicTotal', () => {
  it('liest das `total` des Geschlechts-Merkmals als Schülerzahl', () => {
    const byType = new Map<string, AggregationEntry[]>([
      ['students-by-gender', [entry('students-by-gender', 'male', 12, 25)]],
    ]);
    expect(characteristicTotal(byType)).toBe(25);
  });

  it('ist `undefined`, wenn die Gruppe kein Geschlecht trägt', () => {
    const byType = new Map<string, AggregationEntry[]>([
      ['students-by-ses', [entry('students-by-ses', 'A', 3, 25)]],
    ]);
    expect(characteristicTotal(byType)).toBeUndefined();
  });
});

function valueGroup(...entries: AggregationEntry[]): AggregationsValueGroup {
  return {
    id: 'g',
    name: 'Gruppe',
    type: 'group',
    aggregations: entries,
  } as AggregationsValueGroup;
}

function focusOf(...groups: AggregationsValueGroup[]): GroupedValueGroups<AggregationsValueGroup> {
  return { key: 'g', name: 'Gruppe', type: 'group', groups };
}

describe('aggregationTypeOf', () => {
  it('gibt die Art des ersten Aggregationseintrags der Hauptgruppe', () => {
    const focus = focusOf(
      valueGroup(entry('competence', 'C1', 8, 20), entry('competence', 'C2', 6, 20)),
    );
    expect(aggregationTypeOf(focus)).toBe('competence');
  });

  it('überspringt Value-Groups ohne Aggregationen (eine je Domäne)', () => {
    const focus = focusOf(valueGroup(), valueGroup(entry('exercise', 'A1', 4, 10)));
    expect(aggregationTypeOf(focus)).toBe('exercise');
  });

  it('gibt `undefined` ohne Hauptgruppe und ohne Aggregationen', () => {
    expect(aggregationTypeOf(undefined)).toBeUndefined();
    expect(aggregationTypeOf(focusOf(valueGroup()))).toBeUndefined();
  });
});

describe('entriesOfType', () => {
  it('bündelt die Einträge der Art über alle Value-Groups in Antwortreihenfolge', () => {
    const groups = [
      valueGroup(entry('competence', 'C1', 8, 20), entry('gender', 'male', 4, 10)),
      valueGroup(entry('competence', 'C2', 6, 20)),
    ];
    expect(entriesOfType(groups, 'competence').map((item) => item.value)).toEqual(['C1', 'C2']);
  });

  it('liefert ein leeres Array, wenn keine Value-Group einen Eintrag der Art trägt', () => {
    expect(entriesOfType([valueGroup(entry('gender', 'male', 4, 10))], 'competence')).toEqual([]);
    expect(entriesOfType([], 'competence')).toEqual([]);
  });
});

describe('hasMinimumClassification', () => {
  it('ist wahr, sobald die Value-Group einen `minimumClassification`-Eintrag trägt', () => {
    const group = valueGroup(
      entry('students-by-gender', 'male', 4, 10),
      entry('minimumClassification', 'Mindeststandard', 7, 24),
    );
    expect(hasMinimumClassification(group)).toBe(true);
  });

  it('ist falsch ohne `minimumClassification`-Eintrag und bei leeren Aggregationen', () => {
    expect(hasMinimumClassification(valueGroup(entry('students-by-gender', 'male', 4, 10)))).toBe(
      false,
    );
    expect(hasMinimumClassification(valueGroup())).toBe(false);
  });
});

describe('nonMinimumClassificationEntries', () => {
  it('lässt die `minimumClassification`-Einträge weg und behält die übrigen in Reihenfolge', () => {
    const group = valueGroup(
      entry('minimumClassification', 'unter Mindeststandard', 3, 24),
      entry('students-by-gender', 'male', 11, 24),
      entry('minimumClassification', 'Mindeststandard', 7, 24),
      entry('students-by-gender', 'female', 13, 24),
    );
    expect(nonMinimumClassificationEntries(group).map((item) => [item.type, item.value])).toEqual([
      ['students-by-gender', 'male'],
      ['students-by-gender', 'female'],
    ]);
  });

  it('liefert alle Einträge ohne `minimumClassification` und ein leeres Array, wenn nur sie vorliegt', () => {
    const composition = valueGroup(entry('students-by-gender', 'male', 11, 24));
    expect(nonMinimumClassificationEntries(composition)).toHaveLength(1);
    expect(
      nonMinimumClassificationEntries(
        valueGroup(entry('minimumClassification', 'Mindeststandard', 7, 24)),
      ),
    ).toEqual([]);
  });
});

describe('aggregationValue', () => {
  const labels: ValueLabels = {
    'students-by-competence.2.5.3': { label: 'Textschemata erfassen' },
  };

  it('macht den Rohwert zur Kennung, wenn eine description vorliegt', () => {
    const value = aggregationValue(
      entry('students-by-competence', '2.5.3', 12, 20, 'Grundregeln beherrschen'),
    );
    expect(value).toEqual({ code: '2.5.3', name: 'Grundregeln beherrschen' });
  });

  it('macht den Rohwert zur Kennung, wenn ein valueLabels-Eintrag vorliegt', () => {
    const value = aggregationValue(entry('students-by-competence', '2.5.3', 12, 20), labels);
    expect(value).toEqual({ code: '2.5.3', name: 'Textschemata erfassen' });
  });

  it('bevorzugt die description vor dem valueLabels-Eintrag', () => {
    const value = aggregationValue(
      entry('students-by-competence', '2.5.3', 12, 20, 'aus der Antwort'),
      labels,
    );
    expect(value).toEqual({ code: '2.5.3', name: 'aus der Antwort' });
  });

  it('lässt die Kennung entfallen, wenn der Rohwert selbst der Name ist', () => {
    const value = aggregationValue(entry('exercise', 'Aufgabe 3', 12, 20));
    expect(value).toEqual({ name: 'Aufgabe 3' });
  });
});

describe('UNIT_AGGREGATIONS und unitLabel', () => {
  it('steht von grob nach fein und kennt Icon und Fallback', () => {
    expect(UNIT_AGGREGATIONS.map((unit) => unit.unit)).toEqual([
      'authorities',
      'schools',
      'groups',
    ]);
    expect(UNIT_AGGREGATIONS.map((unit) => unit.type)).toEqual([
      'authorities-by-participation',
      'schools-by-participation',
      'groups-by-participation',
    ]);
    expect(UNIT_AGGREGATIONS[1]).toEqual({
      type: 'schools-by-participation',
      unit: 'schools',
      icon: 'fa-school',
      fallback: 'Schulen',
    });
  });

  it('übersetzt über valueLabels und fällt sonst auf den deutschen Text zurück', () => {
    expect(unitLabel({ 'unit.schools': { label: 'Schools' } }, 'schools', 'Schulen')).toBe(
      'Schools',
    );
    expect(unitLabel(undefined, 'schools', 'Schulen')).toBe('Schulen');
    expect(unitLabel({ 'unit.groups': { label: 'Lerngruppen' } }, 'schools', 'Schulen')).toBe(
      'Schulen',
    );
  });
});

describe('compositionEntries', () => {
  it('bildet die schlichten Merkmalsnamen auf die Kopfzahl-Arten ab, Wert bleibt', () => {
    const mapped = compositionEntries([
      entry('gender', 'male', 12, 24),
      entry('languageAtHome', 'german', 18, 24),
      entry('SES', 'A', 3, 24),
    ]);
    expect(mapped.map((item) => [item.type, item.value])).toEqual([
      ['students-by-gender', 'male'],
      ['students-by-languageAtHome', 'german'],
      ['students-by-ses', 'A'],
    ]);
  });

  it('erkennt SES unabhängig von der Schreibweise', () => {
    expect(compositionEntries([entry('ses', 'B', 5, 24)])[0].type).toBe('students-by-ses');
    expect(compositionEntries([entry('SES', 'B', 5, 24)])[0].type).toBe('students-by-ses');
  });

  it('macht aus `classCount` die Einheiten-Kopfzahl Klassen mit Wert `participated`', () => {
    const [classes] = compositionEntries([entry('classCount', 'classCount', 6, 6)]);
    expect(classes.type).toBe('groups-by-participation');
    expect(classes.value).toBe('participated');
    expect(classes.descriptiveStatistics).toMatchObject({ total: 6, frequency: 6 });
    expect(registeredUnitCount([classes], 'groups-by-participation')).toBe(6);
  });

  it('lässt bereits präfixierte Kopfzahlen und unbekannte Arten unverändert', () => {
    const entries = [
      entry('students-by-gender', 'female', 11, 24),
      entry('students-by-participation', 'participated', 23, 24),
      entry('minimumClassification', 'Mindeststandard', 8, 24),
    ];
    expect(compositionEntries(entries)).toEqual(entries);
  });
});

describe('characteristicTypes', () => {
  it('lässt Teilnahme-Kopfzahlen weg, bekannte Merkmale zuerst, Rest in Reihenfolge, ohne Doppel', () => {
    expect(
      characteristicTypes([
        'students-by-participation',
        'students-by-migration',
        'students-by-languageAtHome',
        'students-by-gender',
        'students-by-gender',
        'schools-by-participation',
      ]),
    ).toEqual(['students-by-gender', 'students-by-languageAtHome', 'students-by-migration']);
    expect(characteristicTypes([])).toEqual([]);
  });
});

function domainGroup(domain: string, ...entries: AggregationEntry[]): AggregationsValueGroup {
  return {
    id: 'g',
    name: 'Gruppe',
    type: 'group',
    domain: { name: domain },
    aggregations: entries,
  } as AggregationsValueGroup;
}

describe('entryKey', () => {
  it('setzt die Aggregationsart vor den Code, damit ein Code in zwei Arten nicht kollidiert', () => {
    expect(entryKey(entry('Lesestil', 'detailliert', 3, 5))).toBe('Lesestil.detailliert');
    expect(entryKey(entry('Hörstil', 'detailliert', 2, 5))).toBe('Hörstil.detailliert');
  });
});

describe('aggregationBlocks', () => {
  it('bildet mit Domäne je Domäne einen Block mit der Art des ersten Eintrags (eine Art je Instanz)', () => {
    const blocks = aggregationBlocks([
      domainGroup(
        'Lesen',
        entry('competence', '2.2.1', 8, 20),
        entry('competence', '2.3.4', 6, 20),
      ),
      domainGroup('Orthografie', entry('competence', '3.3.7', 5, 20)),
    ]);
    expect(blocks.map((block) => [block.key, block.label, block.domain, block.type])).toEqual([
      ['domain:Lesen', 'Lesen', 'Lesen', 'competence'],
      ['domain:Orthografie', 'Orthografie', 'Orthografie', 'competence'],
    ]);
    expect(blocks[0].entries.map((item) => item.value)).toEqual(['2.2.1', '2.3.4']);
  });

  it('nimmt mit Domäne nur Einträge der Art des ersten Eintrags (weitere Arten fallen weg)', () => {
    const blocks = aggregationBlocks([
      domainGroup('Lesen', entry('competence', '2.2.1', 8, 20), entry('exercise', 'A1', 3, 10)),
    ]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('competence');
    expect(blocks[0].entries.map((item) => item.value)).toEqual(['2.2.1']);
  });

  it('bildet ohne Domäne je Aggregationsart einen Block in Antwortreihenfolge', () => {
    const blocks = aggregationBlocks([
      valueGroup(
        entry('Kompetenz', 'D1', 76, 138),
        entry('Kompetenz', 'D2', 68, 138),
        entry('Domäne', 'Lesen', 157, 276),
      ),
    ]);
    expect(blocks.map((block) => [block.key, block.type, block.domain])).toEqual([
      ['type:Kompetenz', 'Kompetenz', undefined],
      ['type:Domäne', 'Domäne', undefined],
    ]);
    expect(blocks[0].entries.map((item) => item.value)).toEqual(['D1', 'D2']);
    expect(blocks[1].entries.map((item) => item.value)).toEqual(['Lesen']);
  });

  it('übersetzt den Artnamen über valueLabels (`aggregation.<art>`), sonst der Rohname', () => {
    const labels: ValueLabels = { 'aggregation.Kompetenz': { label: 'Kompetenzbereich' } };
    const blocks = aggregationBlocks(
      [valueGroup(entry('Kompetenz', 'D1', 1, 2), entry('Leitidee', 'L1', 1, 2))],
      labels,
    );
    expect(blocks.map((block) => block.label)).toEqual(['Kompetenzbereich', 'Leitidee']);
  });

  it('hält denselben Code in zwei Arten als getrennte Blöcke (keine Kollision)', () => {
    const blocks = aggregationBlocks([
      valueGroup(entry('Lesestil', 'detailliert', 3, 5), entry('Hörstil', 'detailliert', 2, 5)),
    ]);
    expect(blocks.map((block) => block.key)).toEqual(['type:Lesestil', 'type:Hörstil']);
    expect(blocks.map((block) => block.entries[0].value)).toEqual(['detailliert', 'detailliert']);
  });

  it('führt gleiche Blöcke über mehrere Value-Groups zusammen, Schlüssel bleibt eindeutig', () => {
    const blocks = aggregationBlocks([
      valueGroup(entry('Kompetenz', 'D1', 1, 2)),
      valueGroup(entry('Kompetenz', 'D2', 1, 2)),
    ]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].entries.map((item) => item.value)).toEqual(['D1', 'D2']);
  });

  it('liefert für Value-Groups ohne Aggregationen keinen Block', () => {
    expect(aggregationBlocks([valueGroup()])).toEqual([]);
    expect(aggregationBlocks([])).toEqual([]);
  });
});
