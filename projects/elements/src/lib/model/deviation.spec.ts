import { describe, expect, it } from 'vitest';
import { deviation, deviationColor, deviationTint, labeledDeviation } from './deviation';

describe('deviation', () => {
  it('bildet die Differenz value − reference und beschriftet sie mit „Pp"', () => {
    const dev = deviation(85, 82, true);
    expect(dev.diff).toBe(3);
    expect(dev.label).toBe('+3 Pp');
  });

  it('markiert bei higherIsBetter ein positives Δ als besser und ein negatives als schlechter', () => {
    const better = deviation(85, 82, true);
    expect(better.direction).toBe('better');
    expect(better.ariaLabel).toBe('Differenz 3 Prozentpunkte besser');

    const worse = deviation(85, 90, true);
    expect(worse.direction).toBe('worse');
    expect(worse.label).toBe('−5 Pp');
    expect(worse.ariaLabel).toBe('Differenz 5 Prozentpunkte schlechter');
  });

  it('dreht die Wertung bei higherIsBetter=false (ein negatives Δ ist günstig)', () => {
    const dev = deviation(15, 18, false);
    expect(dev.label).toBe('−3 Pp');
    expect(dev.direction).toBe('better');
    expect(dev.ariaLabel).toBe('Differenz 3 Prozentpunkte besser');
  });

  it('nutzt das Minuszeichen U+2212, nicht den Bindestrich', () => {
    expect(deviation(15, 18, true).label).toBe('−3 Pp');
  });

  it('ist bei Gleichstand neutral', () => {
    const dev = deviation(30, 30, true);
    expect(dev.diff).toBe(0);
    expect(dev.label).toBe('±0 Pp');
    expect(dev.direction).toBe('neutral');
    expect(dev.ariaLabel).toBe('Differenz 0 Prozentpunkte');
  });

  it('bildet die Farbe aus der Richtung', () => {
    expect(deviationColor('better')).toBe('var(--tba3-deviation-better)');
    expect(deviationColor('worse')).toBe('var(--tba3-deviation-worse)');
    expect(deviationColor('neutral')).toBe('var(--tba3-deviation-neutral)');
  });

  it('mischt in deviationTint die Richtungsfarbe zu 15 % auf Transparenz', () => {
    expect(deviationTint('better')).toBe(
      'color-mix(in srgb, var(--tba3-deviation-better) 15%, transparent)',
    );
    expect(deviationTint('worse')).toBe(
      'color-mix(in srgb, var(--tba3-deviation-worse) 15%, transparent)',
    );
    expect(deviationTint('neutral')).toBe(
      'color-mix(in srgb, var(--tba3-deviation-neutral) 15%, transparent)',
    );
  });
});

describe('labeledDeviation', () => {
  it('nennt Hauptgruppe und Bezug im aria-label und behält die übrigen Felder', () => {
    const dev = labeledDeviation(72, 68, true, 'Klasse 8a', 'Land');
    expect(dev.ariaLabel).toBe('Klasse 8a gegenüber Land: 4 Prozentpunkte besser');
    expect(dev.diff).toBe(4);
    expect(dev.label).toBe(deviation(72, 68, true).label);
    expect(dev.direction).toBe(deviation(72, 68, true).direction);
  });

  it('beschreibt eine ungünstige Abweichung und ±0 ohne Richtungswort', () => {
    expect(labeledDeviation(60, 66, true, 'Klasse 8a', 'Schule').ariaLabel).toContain(
      'Klasse 8a gegenüber Schule: 6 Prozentpunkte schlechter',
    );
    expect(labeledDeviation(66, 66, true, 'Klasse 8a', 'Schule').ariaLabel).toMatch(
      /^Klasse 8a gegenüber Schule: /,
    );
  });
});
