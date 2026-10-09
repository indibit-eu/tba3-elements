import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Tba3StatCardComponent, type StatCardComparison } from './stat-card';

function rows(config: {
  value: number | undefined;
  comparisons: StatCardComparison[];
  higherIsBetter?: boolean;
  subtitle?: string;
}) {
  const fixture = TestBed.createComponent(Tba3StatCardComponent);
  fixture.componentRef.setInput('value', config.value);
  fixture.componentRef.setInput('comparisons', config.comparisons);
  fixture.componentRef.setInput('higherIsBetter', config.higherIsBetter ?? true);
  fixture.componentRef.setInput('subtitle', config.subtitle ?? '');
  fixture.detectChanges();
  return fixture.componentInstance.rows();
}

describe('Tba3StatCardComponent (Vergleichszeilen)', () => {
  it('bildet die Differenz auf den gerundeten Prozentwerten (Hauptgruppe minus Vergleich)', () => {
    const [land, fair] = rows({
      value: 85,
      comparisons: [
        { label: 'Land', value: 82 },
        { label: 'Fair', value: 84 },
      ],
    });
    expect(land.value).toBe(82);
    expect(land.delta.label).toBe('+3 Pp');
    expect(fair.delta.label).toBe('+1 Pp');
  });

  it('nennt im aria-label den Bezug: Hauptgruppe gegenüber Vergleich', () => {
    const [land] = rows({
      value: 85,
      comparisons: [{ label: 'Landesmittelwert', value: 82 }],
      subtitle: 'Gesamtschule Birkenmoor',
    });
    expect(land.delta.ariaLabel).toBe(
      'Gesamtschule Birkenmoor gegenüber Landesmittelwert: 3 Prozentpunkte besser',
    );
  });

  it('dreht die Wertung bei higherIsBetter=false (ein negatives Δ ist günstig)', () => {
    const [favorable] = rows({
      value: 15,
      comparisons: [{ label: 'Land', value: 18 }],
      higherIsBetter: false,
    });
    expect(favorable.delta.label).toBe('−3 Pp');
    expect(favorable.delta.direction).toBe('better');
  });

  it('liefert ohne Wert keine Vergleichszeilen', () => {
    expect(rows({ value: undefined, comparisons: [{ label: 'Land', value: 30 }] })).toEqual([]);
  });

  it('rendert Kopf als Heading-Tags und die Kennzahl ohne Kapitälchen und ohne Inline-Farbe', () => {
    const fixture = TestBed.createComponent(Tba3StatCardComponent);
    fixture.componentRef.setInput('title', 'Mindeststandard erreicht');
    fixture.componentRef.setInput('subtitle', 'Gesamtschule Birkenmoor');
    fixture.componentRef.setInput('value', 62);
    fixture.componentRef.setInput('comparisons', [{ label: 'Landesmittelwert', value: 55 }]);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    const title = host.querySelector('h4.card-title.h6');
    expect(title?.textContent).toContain('Mindeststandard erreicht');
    const subtitle = host.querySelector('p.card-subtitle');
    expect(subtitle?.textContent).toContain('Gesamtschule Birkenmoor');
    expect(title?.className).toBe('card-title h6');

    const value = host.querySelector('.fs-3.fw-semibold') as HTMLElement;
    expect(value.textContent?.replace(/ /g, ' ')).toContain('62 %');
    expect(value.getAttribute('style')).toBeNull();

    expect(host.querySelectorAll('tba3-delta').length).toBe(1);
    const right = host.querySelector('.text-nowrap.flex-shrink-0');
    expect(right).not.toBeNull();
  });

  it('zeigt ohne Wert „–" in text-secondary und keine Karte-interne Struktur der Zeilen', () => {
    const fixture = TestBed.createComponent(Tba3StatCardComponent);
    fixture.componentRef.setInput('value', undefined);
    fixture.componentRef.setInput('comparisons', [{ label: 'Land', value: 30 }]);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const value = host.querySelector('.fs-3.fw-semibold') as HTMLElement;
    expect(value.classList.contains('text-secondary')).toBe(true);
    expect(value.textContent).toContain('–');
    expect(host.querySelectorAll('tba3-delta').length).toBe(0);
  });

  it('rendert Host als Block mit voller Höhe ohne Schatten', () => {
    const fixture = TestBed.createComponent(Tba3StatCardComponent);
    fixture.componentRef.setInput('value', 62);
    fixture.componentRef.setInput('comparisons', [{ label: 'Landesmittelwert', value: 55 }]);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList.contains('d-block')).toBe(true);
    expect(host.classList.contains('h-100')).toBe(true);
    expect(host.querySelector('.card')?.className).toBe('card h-100');
    expect(host.querySelector('hr')).toBeNull();
    expect(host.querySelector('.mt-auto')).not.toBeNull();
  });
});
