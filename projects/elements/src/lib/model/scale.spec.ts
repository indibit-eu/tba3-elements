import { describe, expect, it } from 'vitest';
import {
  SCALE_LEVELS,
  scaleBackground,
  scaleColor,
  scaleIndicator,
  scaleLevel,
  scaleRangeLabel,
  scaleRangeText,
  sortThresholds,
} from './scale';

describe('scaleLevel', () => {
  it('ordnet halboffen zu: die Grenze selbst zählt zur höheren Stufe', () => {
    expect(scaleLevel(59, [60, 75, 85])).toBe('low');
    expect(scaleLevel(60, [60, 75, 85])).toBe('mid-low');
    expect(scaleLevel(75, [60, 75, 85])).toBe('mid');
    expect(scaleLevel(85, [60, 75, 85])).toBe('high');
  });

  it('sortThresholds sortiert aufsteigend', () => {
    expect(sortThresholds([85, 60, 75])).toEqual([60, 75, 85]);
  });
});

describe('scaleIndicator', () => {
  it('trägt Glyphen außen und fa-circle-dot in der Mitte', () => {
    expect(SCALE_LEVELS).toEqual(['low', 'mid-low', 'mid', 'high']);
    expect(scaleIndicator('low')).toEqual({ glyph: '▼▼', icon: '' });
    expect(scaleIndicator('mid-low')).toEqual({ glyph: '▼', icon: '' });
    expect(scaleIndicator('mid')).toEqual({ glyph: '', icon: 'fa-circle-dot' });
    expect(scaleIndicator('high')).toEqual({ glyph: '▲', icon: '' });
  });
});

describe('scaleRangeText und scaleRangeLabel', () => {
  const thresholds = [60, 75, 85] as const;

  it('bildet die Bereichstexte der Legende', () => {
    expect(SCALE_LEVELS.map((level) => scaleRangeText(level, thresholds))).toEqual([
      '< 60 %',
      '60–75 %',
      '75–85 %',
      '≥ 85 %',
    ]);
  });

  it('bildet die Bereichslabels für aria-label ohne Wertungsworte', () => {
    expect(SCALE_LEVELS.map((level) => scaleRangeLabel(level, thresholds))).toEqual([
      'unter 60 %',
      '60 bis 75 %',
      '75 bis 85 %',
      'ab 85 %',
    ]);
  });

  it('nimmt eine andere Einheit an', () => {
    expect(scaleRangeText('high', [-10, -5, 5], 'Pp')).toBe('≥ 5 Pp');
    expect(scaleRangeLabel('low', [-10, -5, 5], 'Pp')).toBe('unter -10 Pp');
  });
});

describe('scaleColor und scaleBackground', () => {
  it('liefern die Theme-Variablen der Stufe als var()-Ausdruck', () => {
    expect(scaleColor('mid-low')).toBe('var(--tba3-solution-rate-mid-low)');
    expect(scaleBackground('high')).toBe('var(--tba3-solution-rate-high-bg)');
  });
});
