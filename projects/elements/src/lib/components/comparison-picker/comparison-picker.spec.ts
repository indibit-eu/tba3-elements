import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Tba3ComparisonPickerComponent } from './comparison-picker';
import type { GroupedValueGroups, ValueGroupLike } from '../../model';

const GROUPS: GroupedValueGroups<ValueGroupLike>[] = [
  { key: 'school-average', name: 'Schule', type: 'school', groups: [] },
  { key: 'state-average', name: 'Landesmittelwert', type: 'state', groups: [] },
  { key: 'group-8b', name: '8b', type: 'group', groups: [] },
  { key: 'group-8c', name: '8c', type: 'group', groups: [] },
];

function render(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(Tba3ComparisonPickerComponent);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  return fixture;
}

function chipLabels(fixture: { nativeElement: HTMLElement }): string[] {
  return Array.from(fixture.nativeElement.querySelectorAll('button.rounded-pill')).map(
    (element) => element.textContent?.trim() ?? '',
  );
}

describe('Tba3ComparisonPickerComponent', () => {
  it('trägt role="group" am Host als eine Gruppe um alle Abschnitte', () => {
    const fixture = render({ groups: GROUPS });
    expect((fixture.nativeElement as HTMLElement).getAttribute('role')).toBe('group');
  });

  it('hält Chips gleichen Typs beisammen, in Reihenfolge des ersten Auftretens', () => {
    const fixture = render({ groups: [GROUPS[2], GROUPS[0], GROUPS[3], GROUPS[1]] });
    expect(chipLabels(fixture)).toEqual(['8b', '8c', 'Schule', 'Landesmittelwert']);
  });

  it('rendert alle Chips in einer umbrechenden Zeile ohne Zwischenüberschriften', () => {
    const fixture = render({ groups: GROUPS });
    const element = fixture.nativeElement as HTMLElement;
    const rows = element.querySelectorAll('.d-flex.flex-wrap');
    expect(rows.length).toBe(1);
    expect(rows[0].querySelectorAll('button.rounded-pill').length).toBe(4);
    expect(element.querySelector('p')).toBeNull();
  });

  it('rendert die Optionen als Chips (button plus rounded-pill, aria-pressed)', () => {
    const fixture = render({ groups: GROUPS });
    const element = fixture.nativeElement as HTMLElement;
    const buttons = element.querySelectorAll('button.btn.btn-outline-secondary.rounded-pill');
    expect(buttons.length).toBe(4);
    expect([...buttons].every((button) => button.getAttribute('aria-pressed') === 'false')).toBe(
      true,
    );
    expect(element.querySelector('details')).toBeNull();
  });

  it('meldet beim Einschalten die neue vollständige Auswahl', () => {
    const fixture = render({ groups: GROUPS, selected: ['state-average'] });
    let emitted: string[] | undefined;
    fixture.componentInstance.selectedChange.subscribe((value) => (emitted = value));

    fixture.componentInstance.toggle('group-8b');
    expect(emitted).toEqual(['state-average', 'group-8b']);
  });

  it('meldet beim Ausschalten die verbleibende Auswahl', () => {
    const fixture = render({ groups: GROUPS, selected: ['state-average', 'group-8b'] });
    let emitted: string[] | undefined;
    fixture.componentInstance.selectedChange.subscribe((value) => (emitted = value));

    fixture.componentInstance.toggle('state-average');
    expect(emitted).toEqual(['group-8b']);
  });

  it('markiert ausgewählte Gruppen als gedrückten, gefüllten Chip', () => {
    const fixture = render({ groups: GROUPS, selected: ['state-average'] });
    const element = fixture.nativeElement as HTMLElement;
    const pressed = [...element.querySelectorAll('button.rounded-pill')].filter(
      (button) => button.getAttribute('aria-pressed') === 'true',
    );
    expect(pressed).toHaveLength(1);
    expect(pressed[0].textContent?.trim()).toBe('Landesmittelwert');
    expect(pressed[0].classList).toContain('btn-secondary');
  });

  it('meldet einen DOM-Klick auf einen Chip als vollständige Auswahl', () => {
    const fixture = render({ groups: GROUPS, selected: ['state-average'] });
    let emitted: string[] | undefined;
    fixture.componentInstance.selectedChange.subscribe((value) => (emitted = value));

    const buttons = [
      ...fixture.nativeElement.querySelectorAll('button.rounded-pill'),
    ] as HTMLButtonElement[];
    const group8b = buttons.find((button) => button.textContent?.trim() === '8b');
    group8b?.click();
    expect(emitted).toEqual(['state-average', 'group-8b']);
  });

  it('rendert nichts ohne Gruppen', () => {
    const fixture = render({ groups: [] });
    expect(fixture.nativeElement.querySelector('button.rounded-pill')).toBeNull();
  });
});
