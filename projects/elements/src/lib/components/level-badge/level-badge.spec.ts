import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { Tba3LevelBadgeComponent } from './level-badge';
import { FALLBACK_COLORS } from '../../model';

// jsdom kennt die Theme-Variablen nicht, darum setzt der Test die Palette-Werte selbst.
const CLASSIFICATION_COLORS: Record<string, string> = {
  Regelstandard: '#666dcc', // dunkles Blauviolett → helle Schrift
  Mindeststandard: '#c2185b', // dunkles Magenta → helle Schrift
  Optimalstandard: '#e6c44c', // helles Gelb → dunkle Schrift
};
const CLASSIFICATION_VARIABLES: Record<string, string> = {
  Regelstandard: '--tba3-classification-regular',
  Mindeststandard: '--tba3-classification-minimum',
  Optimalstandard: '--tba3-classification-optimal',
};

function render(inputs: {
  nameShort?: string;
  classification?: string;
  title?: string;
  display?: 'badge' | 'text';
}) {
  const fixture = TestBed.createComponent(Tba3LevelBadgeComponent);
  if (inputs.nameShort !== undefined) fixture.componentRef.setInput('nameShort', inputs.nameShort);
  if (inputs.classification !== undefined)
    fixture.componentRef.setInput('classification', inputs.classification);
  if (inputs.title !== undefined) fixture.componentRef.setInput('title', inputs.title);
  if (inputs.display !== undefined) fixture.componentRef.setInput('display', inputs.display);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const span = root.querySelector('span') as HTMLElement;
  return { fixture, root, span };
}

describe('Tba3LevelBadgeComponent', () => {
  const white = FALLBACK_COLORS['--bs-body-bg'];
  const dark = FALLBACK_COLORS['--bs-body-color'];

  afterEach(() => {
    for (const variable of Object.values(CLASSIFICATION_VARIABLES)) {
      document.documentElement.style.removeProperty(variable);
    }
  });

  it('zeigt das Kürzel auf der Classification-Farbe des Themes mit heller Schrift', () => {
    document.documentElement.style.setProperty(
      CLASSIFICATION_VARIABLES['Regelstandard'],
      CLASSIFICATION_COLORS['Regelstandard'],
    );
    const { span, fixture } = render({ nameShort: 'III', classification: 'Regelstandard' });
    expect(span.textContent?.trim()).toBe('III');
    expect(fixture.componentInstance.backgroundColor()).toBe('var(--tba3-classification-regular)');
    expect(span.style.backgroundColor).toBe('var(--tba3-classification-regular)');
    expect(fixture.componentInstance.textColor()).toBe(white);
    expect(span.style.color).toBe('rgb(255, 255, 255)');
  });

  it('setzt auf hellen Stufenfarben (Optimalstandard-Gelb) dunkle Schrift', () => {
    document.documentElement.style.setProperty(
      CLASSIFICATION_VARIABLES['Optimalstandard'],
      CLASSIFICATION_COLORS['Optimalstandard'],
    );
    const { span, fixture } = render({ nameShort: 'V', classification: 'Optimalstandard' });
    expect(fixture.componentInstance.textColor()).toBe(dark);
    expect(span.style.color).toBe('rgb(33, 37, 41)');
  });

  it('fällt bei unbekannter Classification auf die Unknown-Farbe', () => {
    const { fixture } = render({ nameShort: '–' });
    expect(fixture.componentInstance.backgroundColor()).toBe('var(--tba3-classification-unknown)');
  });

  it('setzt den title nur, wenn einer angegeben ist', () => {
    expect(
      render({ nameShort: 'II', title: 'Lesen: Mindeststandard' }).span.getAttribute('title'),
    ).toBe('Lesen: Mindeststandard');
    expect(render({ nameShort: 'II' }).span.getAttribute('title')).toBeNull();
  });

  it('rendert die Text-Variante als fetten Text mit farbigem Unterstrich statt farbigem Hintergrund', () => {
    const { root, span } = render({
      nameShort: 'IV',
      classification: 'Regelstandard plus',
      display: 'text',
    });
    expect(root.querySelector('span.badge')).toBeNull();
    expect(span.classList.contains('fw-bold')).toBe(true);
    expect(span.classList.contains('tba3-level-badge-text')).toBe(true);
    expect(span.textContent?.trim()).toBe('IV');
    expect(span.style.borderBottomColor).toBe('var(--tba3-classification-regular-plus)');
    expect(span.style.color).toBe('');
    expect(span.style.backgroundColor).toBe('');
  });
});
