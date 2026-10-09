import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Tba3DeltaComponent } from './delta';
import { deviation } from '../../model';

function render(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(Tba3DeltaComponent);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  return fixture;
}

function pill(fixture: { nativeElement: HTMLElement }): HTMLElement | null {
  return fixture.nativeElement.querySelector('.badge');
}

function icon(fixture: { nativeElement: HTMLElement }): string {
  return fixture.nativeElement.querySelector('i')?.className ?? '';
}

describe('Tba3DeltaComponent', () => {
  it('rendert eine günstige Abweichung mit Aufwärtspfeil in der besser-Farbe', () => {
    const fixture = render({ delta: deviation(72, 66, true) });
    const badge = pill(fixture);
    expect(badge?.querySelector('.tba3-num')?.textContent?.trim()).toBe('+6 Pp');
    expect(icon(fixture)).toContain('fa-arrow-up');
    expect(badge?.style.color).toBe('var(--tba3-deviation-better)');
    expect(badge?.getAttribute('aria-label')).toBe('Differenz 6 Prozentpunkte besser');
  });

  it('rendert eine ungünstige Abweichung mit Abwärtspfeil in der schlechter-Farbe', () => {
    const fixture = render({ delta: deviation(63, 68, true) });
    const badge = pill(fixture);
    expect(badge?.querySelector('.tba3-num')?.textContent?.trim()).toBe('−5 Pp');
    expect(icon(fixture)).toContain('fa-arrow-down');
    expect(badge?.style.color).toBe('var(--tba3-deviation-worse)');
  });

  it('rendert ±0 mit fa-circle-dot in der neutralen Farbe', () => {
    const fixture = render({ delta: deviation(68, 68, true) });
    const badge = pill(fixture);
    expect(badge?.querySelector('.tba3-num')?.textContent?.trim()).toBe('±0 Pp');
    expect(icon(fixture)).toContain('fa-circle-dot');
    expect(badge?.style.color).toBe('var(--tba3-deviation-neutral)');
  });

  it('färbt eine Abweichung unter der Schwelle neutral, behält aber Pfeil, Zahl und aria-label', () => {
    const fixture = render({ delta: deviation(72, 68, true), threshold: 5 });
    const badge = pill(fixture);
    expect(badge?.style.color).toBe('var(--tba3-deviation-neutral)');
    expect(icon(fixture)).toContain('fa-arrow-up');
    expect(badge?.querySelector('.tba3-num')?.textContent?.trim()).toBe('+4 Pp');
    expect(badge?.getAttribute('aria-label')).toBe('Differenz 4 Prozentpunkte besser');
  });

  it('färbt bei Schwelle 0 jede Abweichung, ±0 bleibt neutral', () => {
    const better = render({ delta: deviation(69, 68, true), threshold: 0 });
    expect(pill(better)?.style.color).toBe('var(--tba3-deviation-better)');

    const equal = render({ delta: deviation(68, 68, true), threshold: 0 });
    expect(pill(equal)?.style.color).toBe('var(--tba3-deviation-neutral)');
  });

  it('rendert nichts ohne delta', () => {
    expect(pill(render())).toBeNull();
  });
});
