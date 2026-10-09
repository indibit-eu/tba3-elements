import { describe, expect, it } from 'vitest';
import {
  blockLabelParts,
  byType,
  compareBlocks,
  domainNames,
  groupById,
  groupByIdAndDomain,
  groupBySubject,
  groupKey,
  parseGroupKey,
  splitByRole,
  subjectNames,
  typeRank,
} from './value-groups';

const response = [
  { id: 'g-8a', type: 'group', name: '8a', domain: { name: 'Lesen' } },
  { id: 'g-8a', type: 'group', name: '8a', domain: { name: 'Zuhören' } },
  { id: 's-1', type: 'student', name: 'Mira Brandhauer', domain: { name: 'Lesen' } },
  { id: 's-2', type: 'student', name: 'Jonas Wellmann', domain: { name: 'Lesen' } },
  { id: 'school-average', type: 'school', name: 'Schulschnitt', domain: { name: 'Lesen' } },
  { id: 'state-average', type: 'state', name: 'Landesmittel', domain: { name: 'Lesen' } },
  { id: 'g-8b', type: 'group', name: '8b', domain: { name: 'Lesen' } },
];

describe('typeRank', () => {
  it('ordnet die Granularitäten von fein nach grob', () => {
    expect(typeRank('student')).toBeLessThan(typeRank('group'));
    expect(typeRank('group')).toBeLessThan(typeRank('school'));
    expect(typeRank('authority')).toBeLessThan(typeRank('state'));
  });

  it('behandelt unbekannte Typen als gröbste Stufe', () => {
    expect(typeRank('custom')).toBeGreaterThan(typeRank('state'));
    expect(typeRank(undefined)).toBeGreaterThan(typeRank('state'));
  });

  it('stellt die Vergleichsschulen auf die Stufe der Schule', () => {
    expect(typeRank('comparisonSchool')).toBe(typeRank('school'));
  });
});

describe('byType', () => {
  it('liefert alle Value-Groups eines Typs in Antwort-Reihenfolge', () => {
    expect(byType(response, 'student').map((g) => g.id)).toEqual(['s-1', 's-2']);
    expect(byType(response, 'authority')).toEqual([]);
  });
});

describe('groupKey und parseGroupKey', () => {
  it('bildet immer `typ:id`, bei fehlender id `typ:name`', () => {
    expect(groupKey({ type: 'state', id: '7', name: 'Land' })).toBe('state:7');
    expect(groupKey({ type: 'comparisonSchool', name: 'Vergleichsschulen' })).toBe(
      'comparisonSchool:Vergleichsschulen',
    );
    expect(groupKey({ id: '7' })).toBe(':7');
    expect(groupKey({})).toBe(':');
  });

  it('zerlegt einen Schlüssel am ersten Doppelpunkt', () => {
    expect(parseGroupKey('state:7')).toEqual({ type: 'state', id: '7' });
    expect(parseGroupKey(':7')).toEqual({ type: '', id: '7' });
    expect(parseGroupKey('plain')).toEqual({ type: '', id: 'plain' });
    expect(parseGroupKey('type:a:b')).toEqual({ type: 'type', id: 'a:b' });
  });
});

describe('groupById', () => {
  it('führt Value-Groups gleicher Gruppe zusammen, in Reihenfolge des ersten Auftretens', () => {
    const grouped = groupById(response);
    expect(grouped.map((g) => g.key)).toEqual([
      'group:g-8a',
      'student:s-1',
      'student:s-2',
      'school:school-average',
      'state:state-average',
      'group:g-8b',
    ]);
    expect(grouped[0].groups).toHaveLength(2);
  });

  it('trennt gleiche ids verschiedener Ebenen über den Typ im Schlüssel', () => {
    const grouped = groupById([
      { id: '7', type: 'state', name: 'Land', domain: { name: 'Lesen' } },
      { id: '7', type: 'authority', name: 'Schulamt 7', domain: { name: 'Lesen' } },
      { id: '7', type: 'state', name: 'Land', domain: { name: 'Zuhören' } },
      { id: '9', type: 'authority', name: 'Schulamt 9', domain: { name: 'Lesen' } },
    ]);
    expect(grouped.map((g) => [g.key, g.groups.length])).toEqual([
      ['state:7', 2],
      ['authority:7', 1],
      ['authority:9', 1],
    ]);
  });

  it('fällt ohne id auf den Namen zurück, der Typ bleibt im Schlüssel', () => {
    const grouped = groupById([{ name: 'A' }, { name: 'B' }, { name: 'A' }]);
    expect(grouped.map((g) => g.key)).toEqual([':A', ':B']);
    expect(grouped[0].groups).toHaveLength(2);
  });
});

describe('splitByRole', () => {
  it('nimmt die Gruppe der ersten Value-Group als Hauptgruppe', () => {
    const roles = splitByRole(response);
    expect(roles.focus?.key).toBe('group:g-8a');
    expect(roles.focus?.groups).toHaveLength(2);
  });

  it('zählt gleiche und gröbere Typen als Vergleich, feinere als Teilgruppen', () => {
    const roles = splitByRole(response);
    expect(roles.comparisons.map((g) => g.key)).toEqual([
      'school:school-average',
      'state:state-average',
      'group:g-8b',
    ]);
    expect(roles.parts.map((g) => g.key)).toEqual(['student:s-1', 'student:s-2']);
  });

  it('liefert bei leerer Antwort einen leeren Zustand', () => {
    expect(splitByRole([])).toEqual({ focus: undefined, comparisons: [], parts: [] });
  });
});

describe('groupByIdAndDomain', () => {
  it('trennt Value-Groups gleicher Gruppe nach Domäne, key bleibt der groupKey', () => {
    const grouped = groupByIdAndDomain(response);
    expect(grouped.map((g) => g.key)).toEqual([
      'group:g-8a',
      'group:g-8a',
      'student:s-1',
      'student:s-2',
      'school:school-average',
      'state:state-average',
      'group:g-8b',
    ]);
    expect(grouped.map((g) => g.groups[0].domain?.name)).toEqual([
      'Lesen',
      'Zuhören',
      'Lesen',
      'Lesen',
      'Lesen',
      'Lesen',
      'Lesen',
    ]);
  });

  it('führt Value-Groups gleicher Gruppe und Domäne zu einem Eintrag zusammen', () => {
    const grouped = groupByIdAndDomain([
      { id: 'g-1', name: 'A', domain: { name: 'Lesen' } },
      { id: 'g-1', name: 'A', domain: { name: 'Lesen' } },
      { id: 'g-1', name: 'A', domain: { name: 'Zuhören' } },
    ]);
    expect(grouped).toHaveLength(2);
    expect(grouped[0].groups).toHaveLength(2);
    expect(grouped[1].groups).toHaveLength(1);
  });
});

describe('groupBySubject', () => {
  it('trennt Value-Groups nach Fach, in Reihenfolge des ersten Auftretens', () => {
    const grouped = groupBySubject([
      { id: 'school-1', subject: { name: 'Deutsch' } },
      { id: 'school-1', subject: { name: 'Mathematik' } },
      { id: 'school-1', subject: { name: 'Deutsch' } },
    ]);
    expect(grouped.map((g) => g.subject)).toEqual(['Deutsch', 'Mathematik']);
    expect(grouped[0].groups).toHaveLength(2);
    expect(grouped[1].groups).toHaveLength(1);
  });

  it('trennt fachweite Value-Groups verschiedener Fächer trotz gleicher id und fehlender Domäne', () => {
    // Gleiche id, kein domain: ohne Fachtrennung verschmölze groupByIdAndDomain.
    const grouped = groupBySubject([
      { id: 'school-1', subject: { name: 'Deutsch' } },
      { id: 'school-1', subject: { name: 'Mathematik' } },
    ]);
    expect(grouped).toHaveLength(2);
  });

  it('sammelt Value-Groups ohne subject in einem eigenen Bucket', () => {
    const grouped = groupBySubject([{ id: 'a' }, { id: 'b' }]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].subject).toBeUndefined();
    expect(grouped[0].groups).toHaveLength(2);
  });
});

describe('domainNames und subjectNames', () => {
  it('liefern die Namen in Reihenfolge des ersten Auftretens', () => {
    expect(domainNames(response)).toEqual(['Lesen', 'Zuhören']);
    expect(subjectNames([{ subject: { name: 'Deutsch' } }, {}])).toEqual(['Deutsch', undefined]);
  });
});

describe('blockLabelParts und compareBlocks', () => {
  const de = { name: 'Deutsch' };
  const ma = { name: 'Mathematik' };
  const lesen = { name: 'Lesen' };
  const ortho = { name: 'Orthografie' };
  const g8a = { id: 'g-8a', name: 'Klasse 8a', type: 'group' };
  const g8b = { id: 'g-8b', name: 'Klasse 8b', type: 'group' };

  it('liefert für eine einzelne Value-Group keine Teile', () => {
    const only = { ...g8a, subject: ma, domain: { name: 'Globalmodell' } };
    expect(blockLabelParts([only], only)).toEqual([]);
  });

  it('zeigt nur die Domäne, wenn nur sie variiert', () => {
    const a = { ...g8a, subject: de, domain: lesen };
    const b = { ...g8a, subject: de, domain: ortho };
    expect(blockLabelParts([a, b], a)).toEqual(['Lesen']);
    expect(blockLabelParts([a, b], b)).toEqual(['Orthografie']);
  });

  it('zeigt Domäne und Gruppe in fester Reihenfolge', () => {
    const all = [
      { ...g8a, subject: de, domain: lesen },
      { ...g8b, subject: de, domain: lesen },
      { ...g8a, subject: de, domain: ortho },
    ];
    expect(blockLabelParts(all, all[1])).toEqual(['Lesen', 'Klasse 8b']);
  });

  it('zählt Werte, nicht Namen, und lässt fehlende Werte im Block weg', () => {
    const all = [
      { ...g8a, subject: de, domain: lesen },
      { ...g8a, subject: de, domain: ortho },
      { ...g8a, subject: ma },
      { ...g8b, subject: ma, domain: { name: 'Globalmodell' } },
    ];
    expect(blockLabelParts(all, all[2])).toEqual(['Mathematik', 'Klasse 8a']);
    expect(blockLabelParts(all, all[3])).toEqual(['Mathematik', 'Globalmodell', 'Klasse 8b']);
  });

  it('sortiert nach Fach, Domäne, Gruppe mit numerischem Vergleich', () => {
    const g10a = { id: 'g-10a', name: 'Klasse 10a' };
    const sorted = [
      { ...g8b, subject: ma, domain: lesen },
      { ...g10a, subject: de, domain: lesen },
      { ...g8a, subject: de, domain: ortho },
      { ...g8a, subject: de, domain: lesen },
    ].sort(compareBlocks);
    expect(sorted.map((g) => `${g.subject.name}|${g.domain.name}|${g.name}`)).toEqual([
      'Deutsch|Lesen|Klasse 8a',
      'Deutsch|Lesen|Klasse 10a',
      'Deutsch|Orthografie|Klasse 8a',
      'Mathematik|Lesen|Klasse 8b',
    ]);
  });
});
