import { describe, expect, it } from 'vitest';
import { categoryColor, categoryVariable, contrastColor, FALLBACK_COLORS } from './theme';

describe('contrastColor', () => {
  const white = FALLBACK_COLORS['--bs-body-bg'];
  const dark = FALLBACK_COLORS['--bs-body-color'];

  // jsdom kennt die Theme-Variablen nicht, darum werden die Palettenwerte hier gesetzt.
  const cases: { name: string; hex: string; expected: string }[] = [
    { name: 'Orange (unter Mindeststandard)', hex: '#df7020', expected: dark },
    { name: 'Magenta (Mindeststandard)', hex: '#c2185b', expected: white },
    { name: 'Blauviolett (Regelstandard)', hex: '#666dcc', expected: white },
    { name: 'Blau (Regelstandard plus)', hex: '#209cdf', expected: dark },
    { name: 'Gelb (Optimalstandard)', hex: '#e6c44c', expected: dark },
    { name: 'Unknown-Grau', hex: '#b8bcc4', expected: dark },
  ];

  for (const { name, hex, expected } of cases) {
    it(`wählt für ${name} die kontrastreichere Textfarbe`, () => {
      const variable = '--test-color';
      document.documentElement.style.setProperty(variable, hex);
      try {
        expect(contrastColor(variable)).toBe(expected);
      } finally {
        document.documentElement.style.removeProperty(variable);
      }
    });
  }

  it('liefert helle Textfarbe auf reinem Schwarz und dunkle auf reinem Weiß', () => {
    document.documentElement.style.setProperty('--test-color', '#000000');
    document.documentElement.style.setProperty('--test-color-2', '#ffffff');
    try {
      expect(contrastColor('--test-color')).toBe(white);
      expect(contrastColor('--test-color-2')).toBe(dark);
    } finally {
      document.documentElement.style.removeProperty('--test-color');
      document.documentElement.style.removeProperty('--test-color-2');
    }
  });

  it('parst die Kurzform #rgb', () => {
    document.documentElement.style.setProperty('--test-color', '#000');
    try {
      expect(contrastColor('--test-color')).toBe(white);
    } finally {
      document.documentElement.style.removeProperty('--test-color');
    }
  });

  it('parst rgb(r, g, b)', () => {
    document.documentElement.style.setProperty('--test-color', 'rgb(255, 255, 255)');
    try {
      expect(contrastColor('--test-color')).toBe(dark);
    } finally {
      document.documentElement.style.removeProperty('--test-color');
    }
  });

  it('liefert bei nicht parsebarer Farbe die dunkle Textfarbe (--bs-body-color)', () => {
    document.documentElement.style.setProperty('--test-color', 'not-a-color');
    try {
      expect(contrastColor('--test-color')).toBe(dark);
    } finally {
      document.documentElement.style.removeProperty('--test-color');
    }
  });
});

describe('categoryVariable', () => {
  it('zählt ab 1 und läuft nach acht Kategorien um', () => {
    expect(categoryVariable(0)).toBe('--tba3-category-1');
    expect(categoryVariable(7)).toBe('--tba3-category-8');
    expect(categoryVariable(8)).toBe('--tba3-category-1');
  });

  it('categoryColor liest dieselbe Variable', () => {
    document.documentElement.style.setProperty('--tba3-category-3', '#123456');
    try {
      expect(categoryColor(2)).toBe('#123456');
    } finally {
      document.documentElement.style.removeProperty('--tba3-category-3');
    }
  });
});
