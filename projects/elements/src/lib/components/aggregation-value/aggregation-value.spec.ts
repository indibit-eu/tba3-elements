import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Tba3AggregationValueComponent } from './aggregation-value';

function render(inputs: Record<string, unknown>) {
  const fixture = TestBed.createComponent(Tba3AggregationValueComponent);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  return fixture;
}

describe('Tba3AggregationValueComponent', () => {
  it('zeigt Kennung fett und den Namen ohne Gewichtsklasse', () => {
    const fixture = render({ code: '2.5.3', name: 'Textschemata erfassen' });
    const element = fixture.nativeElement as HTMLElement;
    const code = element.querySelector('.fw-semibold');
    expect(code?.textContent?.trim()).toBe('2.5.3');
    expect(element.textContent).toContain('Textschemata erfassen');
    expect(element.querySelector('button')).toBeNull();
  });

  it('zeigt ohne Kennung nur den Namen', () => {
    const fixture = render({ name: 'Aufgabe 3' });
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent?.trim()).toBe('Aufgabe 3');
    expect(element.querySelector('.fw-semibold')).toBeNull();
  });

  it('zeigt die Domäne als Sekundärinfo hinter einem aria-hidden-Mittelpunkt', () => {
    const fixture = render({ code: '3.3.5', name: 'Textelemente erfassen', domain: 'Lesen' });
    const element = fixture.nativeElement as HTMLElement;
    const domain = element.querySelector('.text-body-secondary');
    expect(domain?.textContent?.trim()).toBe('Lesen');
    expect(element.querySelector('[aria-hidden="true"]')?.textContent).toBe('·');
  });

  it('macht die Kennung klickbar und meldet den Klick', () => {
    const fixture = render({ code: '2.5.3', name: 'Textschemata erfassen', clickable: true });
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent?.trim()).toBe('2.5.3');
    expect(button.getAttribute('aria-label')).toBe('Details zu 2.5.3 Textschemata erfassen öffnen');

    let emitted = false;
    fixture.componentInstance.selected.subscribe(() => (emitted = true));
    button.click();
    expect(emitted).toBe(true);
  });

  it('macht ohne Kennung den Namen zum Klickziel', () => {
    const fixture = render({ name: 'Aufgabe 3', clickable: true });
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent?.trim()).toBe('Aufgabe 3');
    expect(button.getAttribute('aria-label')).toBe('Details zu Aufgabe 3 öffnen');
  });

  it('rendert einen Inline-Fließtext ohne Flex-Container', () => {
    const fixture = render({ code: '3.2.4', name: 'Textschemata erfassen', domain: 'Lesen' });
    const root = fixture.nativeElement.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('SPAN');
    expect(root.className).toBe('');
    expect(fixture.nativeElement.querySelector('.d-inline-flex')).toBeNull();
    expect(fixture.nativeElement.querySelector('.flex-wrap')).toBeNull();
  });

  it('lässt zwischen Kennung, Name und Domäne ein Leerzeichen fließen', () => {
    const fixture = render({ code: '3.2.4', name: 'Textschemata erfassen', domain: 'Lesen' });
    const text = (fixture.nativeElement as HTMLElement).textContent?.replace(/\s+/g, ' ').trim();
    expect(text).toBe('3.2.4 Textschemata erfassen · Lesen');
  });
});
