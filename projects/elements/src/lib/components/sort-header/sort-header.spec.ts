import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { Tba3SortHeaderComponent } from './sort-header';
import type { SortDirection } from '../../model';

function render(inputs: {
  label?: string;
  direction?: SortDirection | undefined;
  priority?: number | undefined;
}) {
  const fixture = TestBed.createComponent(Tba3SortHeaderComponent);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  return fixture;
}

describe('Tba3SortHeaderComponent', () => {
  it('rendert den Sortierbutton mit Label, dann Icon, dann Pille', () => {
    const fixture = render({ label: 'Δ Land', direction: 'asc', priority: 1 });
    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(button?.className).toContain('btn btn-sm btn-link');
    expect(button?.className).toContain('text-nowrap');
    expect(button?.textContent).toContain('Δ Land');

    const icon = button?.querySelector('i');
    expect(icon?.className).toContain('fa-solid');
    expect(icon?.className).toContain('fa-fw');
    expect(icon?.className).toContain('ms-1');
    expect(icon?.className).toContain('text-secondary');
    expect(icon?.className).toContain('fa-sort-up');

    const badge = button?.querySelector('span.badge');
    expect(badge?.className).toContain('rounded-pill');
    expect(badge?.className).toContain('text-bg-secondary');
    expect(badge?.className).toContain('ms-1');
    expect(badge?.textContent?.trim()).toBe('1');
    const children = Array.from(button?.children ?? []);
    expect(children.indexOf(icon as Element)).toBeLessThan(children.indexOf(badge as Element));
  });

  it('zeigt fa-sort-down bei absteigend und fa-sort ohne Sortierung', () => {
    const desc = render({ label: 'n', direction: 'desc' });
    expect(desc.nativeElement.querySelector('i')?.className).toContain('fa-sort-down');

    const none = render({ label: 'n', direction: undefined });
    expect(none.nativeElement.querySelector('i')?.className).toContain('fa-sort');
  });

  it('lässt die Pille weg, wenn keine Priorität gesetzt ist', () => {
    const fixture = render({ label: 'Stufe', direction: undefined, priority: undefined });
    expect(fixture.nativeElement.querySelector('span.badge')).toBeNull();
  });

  it('meldet einen Klick über toggle', () => {
    const fixture = render({ label: 'Name' });
    const spy = vi.fn();
    fixture.componentInstance.toggle.subscribe(spy);
    fixture.nativeElement.querySelector('button')?.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
