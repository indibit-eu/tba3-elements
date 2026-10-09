export type ScaleLevel = 'low' | 'mid-low' | 'mid' | 'high';

/** Drei Grenzen, die Prozentwerte in vier Stufen einer Farbskala teilen. */
export type ScaleThresholds = readonly [number, number, number];

export function sortThresholds(thresholds: ScaleThresholds): ScaleThresholds {
  const [a, b, c] = [...thresholds].sort((x, y) => x - y);
  return [a, b, c];
}

/** Erwartet aufsteigend sortierte Grenzen ({@link sortThresholds}). */
export function scaleLevel(value: number, [t1, t2, t3]: ScaleThresholds): ScaleLevel {
  if (value < t1) return 'low';
  if (value < t2) return 'mid-low';
  if (value < t3) return 'mid';
  return 'high';
}

export const SCALE_LEVELS: readonly ScaleLevel[] = ['low', 'mid-low', 'mid', 'high'];

export interface ScaleIndicator {
  glyph: string;
  icon: string;
}

// Die mittlere Stufe trägt dasselbe Icon wie die neutrale Δ-Pille.
const INDICATORS: Readonly<Record<ScaleLevel, ScaleIndicator>> = {
  low: { glyph: '▼▼', icon: '' },
  'mid-low': { glyph: '▼', icon: '' },
  mid: { glyph: '', icon: 'fa-circle-dot' },
  high: { glyph: '▲', icon: '' },
};

export function scaleIndicator(level: ScaleLevel): ScaleIndicator {
  return INDICATORS[level];
}

/** Bereichstext für die Legende, etwa „60–75 %". */
export function scaleRangeText(
  level: ScaleLevel,
  [t1, t2, t3]: ScaleThresholds,
  unit = '%',
): string {
  switch (level) {
    case 'low':
      return `< ${t1} ${unit}`;
    case 'mid-low':
      return `${t1}–${t2} ${unit}`;
    case 'mid':
      return `${t2}–${t3} ${unit}`;
    case 'high':
      return `≥ ${t3} ${unit}`;
  }
}

/** Bereichstext für `aria-label`, etwa „60 bis 75 %". */
export function scaleRangeLabel(
  level: ScaleLevel,
  [t1, t2, t3]: ScaleThresholds,
  unit = '%',
): string {
  switch (level) {
    case 'low':
      return `unter ${t1} ${unit}`;
    case 'mid-low':
      return `${t1} bis ${t2} ${unit}`;
    case 'mid':
      return `${t2} bis ${t3} ${unit}`;
    case 'high':
      return `ab ${t3} ${unit}`;
  }
}

export function scaleColor(level: ScaleLevel): string {
  return `var(--tba3-solution-rate-${level})`;
}

export function scaleBackground(level: ScaleLevel): string {
  return `var(--tba3-solution-rate-${level}-bg)`;
}
