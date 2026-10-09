export type DeviationDirection = 'better' | 'worse' | 'neutral';

/** Bewertete Differenz zweier Prozentwerte in Prozentpunkten. */
export interface Deviation {
  diff: number;
  label: string;
  direction: DeviationDirection;
  ariaLabel: string;
}

export function deviation(value: number, reference: number, higherIsBetter: boolean): Deviation {
  const diff = value - reference;
  if (diff === 0) {
    return { diff, label: '±0 Pp', direction: 'neutral', ariaLabel: 'Differenz 0 Prozentpunkte' };
  }
  const favorable = higherIsBetter ? diff > 0 : diff < 0;
  const direction: DeviationDirection = favorable ? 'better' : 'worse';
  const sign = diff > 0 ? '+' : '−';
  const magnitude = Math.abs(diff);
  return {
    diff,
    label: `${sign}${magnitude} Pp`,
    direction,
    ariaLabel: `Differenz ${magnitude} Prozentpunkte ${favorable ? 'besser' : 'schlechter'}`,
  };
}

/** Wie {@link deviation}, das `aria-label` nennt zusätzlich Haupt- und Vergleichsgruppe. */
export function labeledDeviation(
  value: number,
  reference: number,
  higherIsBetter: boolean,
  focusName: string,
  comparisonName: string,
): Deviation {
  const dev = deviation(value, reference, higherIsBetter);
  const detail = dev.ariaLabel.replace(/^Differenz /, '');
  return { ...dev, ariaLabel: `${focusName} gegenüber ${comparisonName}: ${detail}` };
}

export function deviationColor(direction: DeviationDirection): string {
  return `var(--tba3-deviation-${direction})`;
}

export function deviationTint(direction: DeviationDirection): string {
  return `color-mix(in srgb, var(--tba3-deviation-${direction}) 15%, transparent)`;
}
