import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Tba3PillFilterComponent, type PillFilterOption } from './pill-filter';

const OPTIONS: PillFilterOption[] = [
  { value: 'low', label: '< 40 %', color: 'var(--tba3-heat-low)' },
  { value: 'high', label: '≥ 70 %', color: 'var(--tba3-heat-high)' },
];

function render(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(Tba3PillFilterComponent);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  return fixture;
}

describe('Tba3PillFilterComponent', () => {
  it('trägt role="group" am Host', () => {
    const fixture = render({ options: OPTIONS });
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('role')).toBe('group');
  });

  it('rendert je Option einen Pill-Button mit Farb-Swatch', () => {
    const fixture = render({ options: OPTIONS });
    const buttons = fixture.nativeElement.querySelectorAll('button.rounded-pill');
    expect(buttons.length).toBe(2);
    expect(buttons[0].querySelector('i.fa-square')?.getAttribute('style')).toContain(
      'var(--tba3-heat-low)',
    );
    expect(buttons[0].textContent?.trim()).toContain('< 40 %');
  });

  it('lässt das Farb-Swatch weg, wenn eine Option keine Farbe trägt', () => {
    const fixture = render({ options: [{ value: 'school', label: 'Schule' }] });
    const button = fixture.nativeElement.querySelector('button.rounded-pill') as HTMLButtonElement;
    expect(button.querySelector('i.fa-square')).toBeNull();
    expect(button.textContent?.trim()).toBe('Schule');
  });

  it('markiert ausgewählte Optionen als gedrückten, gefüllten Button (aria-pressed)', () => {
    const fixture = render({ options: OPTIONS, selected: ['low'] });
    const buttons = [
      ...fixture.nativeElement.querySelectorAll('button.rounded-pill'),
    ] as HTMLButtonElement[];
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[0].classList).toContain('btn-secondary');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[1].classList).toContain('btn-outline-secondary');
  });

  it('meldet beim Einschalten die neue vollständige Auswahl', () => {
    const fixture = render({ options: OPTIONS, selected: ['low'] });
    let emitted: string[] | undefined;
    fixture.componentInstance.selectedChange.subscribe((value) => (emitted = value));

    fixture.componentInstance.toggle('high');
    expect(emitted).toEqual(['low', 'high']);
  });

  it('meldet beim Ausschalten die verbleibende Auswahl', () => {
    const fixture = render({ options: OPTIONS, selected: ['low', 'high'] });
    let emitted: string[] | undefined;
    fixture.componentInstance.selectedChange.subscribe((value) => (emitted = value));

    fixture.componentInstance.toggle('low');
    expect(emitted).toEqual(['high']);
  });

  it('rendert nichts ohne Optionen', () => {
    const fixture = render({ options: [] });
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });
});
