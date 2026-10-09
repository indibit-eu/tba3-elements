import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Tba3BookletSwitchComponent } from './booklet-switch';
import type { ValueLabels } from '../../model';

const LABELS: ValueLabels = {
  'booklet.V8-2026-DE-HSA': { label: 'HSA' },
  'booklet.V8-2026-DE-MSA': { label: 'MSA' },
};

function render(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(Tba3BookletSwitchComponent);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  return fixture;
}

function buttons(fixture: { nativeElement: HTMLElement }): HTMLButtonElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('button'));
}

describe('Tba3BookletSwitchComponent', () => {
  it('trägt role="group" am Host, damit das Bedienfeld es über aria-labelledby benennen kann', () => {
    const fixture = render({ booklets: ['V8-2026-DE-HSA', 'V8-2026-DE-MSA'] });
    expect((fixture.nativeElement as HTMLElement).getAttribute('role')).toBe('group');
    const innerGroup = fixture.nativeElement.querySelector('.btn-group') as HTMLElement;
    expect(innerGroup.getAttribute('role')).toBeNull();
    expect(innerGroup.getAttribute('aria-label')).toBeNull();
  });

  it('rendert nichts bei weniger als zwei Heften', () => {
    expect(render({ booklets: [] }).nativeElement.querySelector('.btn-group')).toBeNull();
    expect(
      render({ booklets: ['V8-2026-DE-HSA'] }).nativeElement.querySelector('.btn-group'),
    ).toBeNull();
  });

  it('beschriftet die Hefte per Label und markiert das aktive', () => {
    const fixture = render({
      booklets: ['V8-2026-DE-HSA', 'V8-2026-DE-MSA'],
      active: 'V8-2026-DE-MSA',
      valueLabels: LABELS,
    });
    const rendered = buttons(fixture);
    expect(rendered.map((button) => button.textContent?.trim())).toEqual(['HSA', 'MSA']);

    const active = rendered.find((button) => button.classList.contains('active'));
    expect(active?.textContent?.trim()).toBe('MSA');
    expect(active?.getAttribute('aria-pressed')).toBe('true');
    expect(rendered[0].getAttribute('aria-pressed')).toBe('false');
  });

  it('beschriftet ein Heft ohne Angabe mit „Ohne Testheft"', () => {
    const fixture = render({ booklets: ['V8-2026-DE-HSA', undefined] });
    expect(buttons(fixture).map((button) => button.textContent?.trim())).toEqual([
      'V8-2026-DE-HSA',
      'Ohne Testheft',
    ]);
  });

  it('meldet das gewählte Heft beim Klick', () => {
    const fixture = render({
      booklets: ['V8-2026-DE-HSA', 'V8-2026-DE-MSA'],
      active: 'V8-2026-DE-HSA',
    });
    let emitted: string | undefined = 'unset';
    fixture.componentInstance.activeChange.subscribe((value) => (emitted = value));

    buttons(fixture)[1].click();
    expect(emitted).toBe('V8-2026-DE-MSA');
  });
});
