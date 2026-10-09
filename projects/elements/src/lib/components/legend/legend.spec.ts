import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Tba3LegendComponent, type Tba3LegendItem } from './legend';

function render(items: Tba3LegendItem[]) {
  const fixture = TestBed.createComponent(Tba3LegendComponent);
  fixture.componentRef.setInput('items', items);
  fixture.detectChanges();
  return fixture;
}

describe('Tba3LegendComponent', () => {
  it('rendert je Eintrag ein fa-square-Farbfeld, den Text und optional die Zahl', () => {
    const fixture = render([
      { color: 'var(--tba3-focus)', text: 'Klasse 8a', value: 24 },
      { color: '#abc', text: 'Land' },
    ]);
    const html = fixture.nativeElement as HTMLElement;
    const list = html.querySelector('ul');
    expect(list?.className).toContain('list-inline');
    expect(list?.className).toContain('small');
    expect(list?.className).toContain('text-secondary');

    const items = html.querySelectorAll('li.list-inline-item');
    expect(items.length).toBe(2);
    expect(items[0].querySelector('i.fa-square')).not.toBeNull();
    expect(items[0].textContent).toContain('Klasse 8a');
    expect(items[0].textContent).toContain('24');
    expect(items[1].textContent).toContain('Land');
    expect(items[1].querySelector('span')).toBeNull();
  });

  it('zeigt einen Marker vor dem Text, wenn angegeben', () => {
    const fixture = render([
      {
        color: '#eee',
        text: 'Optimalstandard',
        marker: { icon: 'fa-crown', color: 'var(--tba3-mark-top)', title: 'Optimalstandard' },
      },
    ]);
    const marker = (fixture.nativeElement as HTMLElement).querySelector('i.fa-crown');
    expect(marker).not.toBeNull();
    expect(marker?.getAttribute('title')).toBe('Optimalstandard');
  });

  it('lässt das Farbfeld weg, wenn ein Eintrag keine Farbe hat', () => {
    const fixture = render([
      { text: 'Ø = mittlere Lösungsquote' },
      {
        text: 'Optimalstandard',
        marker: { icon: 'fa-crown', color: 'var(--tba3-mark-top)' },
      },
    ]);
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('li.list-inline-item');
    expect(items[0].querySelector('i.fa-square')).toBeNull();
    expect(items[0].querySelector('i')).toBeNull();
    expect(items[0].textContent).toContain('Ø = mittlere Lösungsquote');
    expect(items[1].querySelector('i.fa-square')).toBeNull();
    expect(items[1].querySelector('i.fa-crown')).not.toBeNull();
  });

  it('ist aria-hidden', () => {
    const fixture = render([{ color: '#eee', text: 'A' }]);
    expect(fixture.nativeElement.querySelector('ul')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('rendert nichts bei leerer Liste', () => {
    const fixture = render([]);
    expect(fixture.nativeElement.querySelector('ul')).toBeNull();
  });
});
