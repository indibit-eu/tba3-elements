import type { Classification } from './classification';

const CLASSIFICATION_VARIABLES: Readonly<Record<Classification, string>> = {
  'unter Mindeststandard': '--tba3-classification-below-minimum',
  Mindeststandard: '--tba3-classification-minimum',
  Regelstandard: '--tba3-classification-regular',
  'Regelstandard plus': '--tba3-classification-regular-plus',
  Optimalstandard: '--tba3-classification-optimal',
};

// Nicht normalizeClassification: classification.ts importiert dieses Modul.
const CLASSIFICATION_VARIABLES_BY_LOWER_CASE: ReadonlyMap<string, string> = new Map(
  Object.entries(CLASSIFICATION_VARIABLES).map(([key, value]) => [key.toLowerCase(), value]),
);

export function classificationVariable(classification: string | null | undefined): string {
  return (
    CLASSIFICATION_VARIABLES_BY_LOWER_CASE.get(classification?.trim().toLowerCase() ?? '') ??
    '--tba3-classification-unknown'
  );
}

/** Bootstrap-Defaults für `themeColor` ohne DOM (Tests, SSR). */
export const FALLBACK_COLORS: Readonly<Record<string, string>> = {
  '--bs-secondary-color': '#6c757d',
  '--bs-border-color': '#dee2e6',
  '--bs-body-bg': '#ffffff',
  '--bs-body-color': '#212529',
};

/** Liest eine CSS-Variable für ECharts, das selbst kein `var(...)` auflöst. */
export function themeColor(variable: string, fallback?: string): string {
  const resolved = fallback ?? FALLBACK_COLORS[variable] ?? '#888888';
  if (typeof document === 'undefined') return resolved;
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value || resolved;
}

export function classificationColor(classification: string | undefined): string {
  return themeColor(classificationVariable(classification));
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function parseColor(value: string): Rgb | null {
  const hex = value.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const digits =
      hex[1].length === 3
        ? hex[1]
            .split('')
            .map((c) => c + c)
            .join('')
        : hex[1];
    return {
      r: parseInt(digits.slice(0, 2), 16),
      g: parseInt(digits.slice(2, 4), 16),
      b: parseInt(digits.slice(4, 6), 16),
    };
  }
  const rgb = value.trim().match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  return null;
}

// Formeln nach WCAG 2.x.
function relativeLuminance({ r, g, b }: Rgb): number {
  const [rl, gl, bl] = [r, g, b].map((channel) => {
    const cs = channel / 255;
    return cs <= 0.03928 ? cs / 12.92 : ((cs + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(a: number, b: number): number {
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Hell oder dunkel, je nachdem, was auf der Farbe hinter `variable` besser lesbar ist. */
export function contrastColor(variable: string): string {
  const light = themeColor('--bs-body-bg');
  const dark = themeColor('--bs-body-color');
  const background = parseColor(themeColor(variable));
  const lightRgb = parseColor(light);
  const darkRgb = parseColor(dark);
  if (!background || !lightRgb || !darkRgb) return dark;

  const backgroundLuminance = relativeLuminance(background);
  const contrastToLight = contrastRatio(backgroundLuminance, relativeLuminance(lightRgb));
  const contrastToDark = contrastRatio(backgroundLuminance, relativeLuminance(darkRgb));
  return contrastToDark >= contrastToLight ? dark : light;
}

export function categoryVariable(index: number): string {
  return `--tba3-category-${(index % 8) + 1}`;
}

export function categoryColor(index: number): string {
  return themeColor(categoryVariable(index));
}

export function seriesColor(comparisonIndex: number | 'focus'): string {
  if (comparisonIndex === 'focus') return themeColor('--tba3-focus');
  return themeColor(`--tba3-comparison-${(comparisonIndex % 4) + 1}`);
}
