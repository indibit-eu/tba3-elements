import { describe, expect, it } from 'vitest';
import { type CompetenceLevelDefinition, catalogFor } from './level-catalog';

const CATALOG: CompetenceLevelDefinition[] = [
  { nameShort: 'G1', name: 'Global 1' },
  { nameShort: 'G2', name: 'Global 2' },
  { nameShort: 'D1', name: 'Deutsch 1', subject: 'Deutsch' },
  { nameShort: 'D2', name: 'Deutsch 2', subject: 'Deutsch' },
  { nameShort: 'DL1', name: 'Deutsch Lesen 1', subject: 'Deutsch', domain: 'Lesen' },
  { nameShort: 'DL2', name: 'Deutsch Lesen 2', subject: 'Deutsch', domain: 'Lesen' },
  { nameShort: 'M1', name: 'Mathe 1', subject: 'Mathematik' },
];

describe('catalogFor', () => {
  it('nimmt die exakten Fach-und-Domänen-Einträge, wenn vorhanden', () => {
    expect(catalogFor(CATALOG, 'Deutsch', 'Lesen').map((entry) => entry.nameShort)).toEqual([
      'DL1',
      'DL2',
    ]);
  });

  it('fällt auf die Fach-Einträge ohne Domäne zurück', () => {
    // Für Deutsch/Orthografie gibt es keinen exakten Eintrag, also die Fach-Ebene.
    expect(catalogFor(CATALOG, 'Deutsch', 'Orthografie').map((entry) => entry.nameShort)).toEqual([
      'D1',
      'D2',
    ]);
  });

  it('fällt auf die globalen Einträge zurück, wenn das Fach nichts hat', () => {
    expect(catalogFor(CATALOG, 'Sachkunde', 'Natur').map((entry) => entry.nameShort)).toEqual([
      'G1',
      'G2',
    ]);
  });

  it('mischt die Ebenen nicht: eine gefüllte Ebene gewinnt vollständig', () => {
    // Mathematik hat nur einen Fach-Eintrag; die globalen Einträge kommen nicht dazu.
    expect(catalogFor(CATALOG, 'Mathematik', 'Zahlen').map((entry) => entry.nameShort)).toEqual([
      'M1',
    ]);
  });

  it('erhält die Katalogreihenfolge', () => {
    expect(catalogFor(CATALOG, 'Deutsch', undefined).map((entry) => entry.nameShort)).toEqual([
      'D1',
      'D2',
    ]);
  });

  it('liefert ein leeres Array, wenn nichts passt', () => {
    expect(catalogFor([], 'Deutsch', 'Lesen')).toEqual([]);
  });
});
