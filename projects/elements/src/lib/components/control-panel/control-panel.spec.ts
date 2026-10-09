import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Tba3ControlPanelComponent } from './control-panel';
import { Tba3ComparisonsSlot, Tba3FilterSlot, Tba3ViewSlot } from './control-panel-slots';

@Component({
  standalone: true,
  imports: [Tba3ControlPanelComponent, Tba3FilterSlot, Tba3ComparisonsSlot, Tba3ViewSlot],
  template: `
    <tba3-control-panel [filterLabel]="filterLabel">
      @if (filter) {
        <div tba3Filter role="group">Testheft-Umschalter</div>
      }
      @if (comparisons) {
        <div tba3Comparisons role="group">Vergleichs-Chips</div>
      }
      @if (view) {
        <div tba3View role="group">Ansicht-Umschalter</div>
      }
    </tba3-control-panel>
  `,
})
class HostComponent {
  filterLabel = 'Testheft';
  filter = false;
  comparisons = false;
  view = false;
}

function render(setup: Partial<HostComponent> = {}) {
  const fixture = TestBed.createComponent(HostComponent);
  Object.assign(fixture.componentInstance, setup);
  fixture.detectChanges();
  return fixture;
}

function labels(fixture: { nativeElement: HTMLElement }): string[] {
  return Array.from(fixture.nativeElement.querySelectorAll('.row > .small')).map(
    (element) => element.textContent?.trim() ?? '',
  );
}

describe('Tba3ControlPanelComponent', () => {
  it('zeigt drei Zeilen in fester Reihenfolge mit dem Filterlabel des Elements', () => {
    const fixture = render({ filter: true, comparisons: true, view: true, filterLabel: 'Metrik' });
    expect(labels(fixture)).toEqual(['Metrik', 'Vergleichswerte', 'Ansicht']);
    expect(fixture.nativeElement.textContent).toContain('Testheft-Umschalter');
    expect(fixture.nativeElement.textContent).toContain('Vergleichs-Chips');
    expect(fixture.nativeElement.textContent).toContain('Ansicht-Umschalter');
  });

  it('zeigt nur die Zeile mit projiziertem Umschalter', () => {
    const fixture = render({ comparisons: true });
    expect(labels(fixture)).toEqual(['Vergleichswerte']);
  });

  it('zeigt keine Zeile ohne projizierten Umschalter', () => {
    const fixture = render();
    expect(labels(fixture)).toEqual([]);
    expect(fixture.nativeElement.querySelector('.row')).toBeNull();
  });

  it('verbindet jeden Umschalter über aria-labelledby mit der id seines Zeilenlabels', () => {
    const fixture = render({ filter: true, comparisons: true, view: true });
    const root = fixture.nativeElement as HTMLElement;

    for (const [attr, rowLabel] of [
      ['tba3Filter', 'Testheft'],
      ['tba3Comparisons', 'Vergleichswerte'],
      ['tba3View', 'Ansicht'],
    ]) {
      const control = root.querySelector(`[${attr}]`) as HTMLElement;
      const labelledBy = control.getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
      const label = root.querySelector(`#${labelledBy}`);
      expect(label?.textContent?.trim()).toBe(rowLabel);
    }
  });

  it('vergibt je Instanz eigene Label-Ids, damit zwei Bedienfelder sich nicht überschneiden', () => {
    const first = render({ filter: true });
    const second = render({ filter: true });
    const id = (fixture: { nativeElement: HTMLElement }) =>
      fixture.nativeElement.querySelector('[tba3Filter]')?.getAttribute('aria-labelledby');
    expect(id(first)).toBeTruthy();
    expect(id(second)).toBeTruthy();
    expect(id(first)).not.toBe(id(second));
  });

  it('setzt aria-labelledby nicht auf einen einzelnen Knopf und behält dessen Namen', () => {
    const fixture = TestBed.createComponent(ButtonHostComponent);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button[tba3View]') as HTMLButtonElement;
    // Ohne role="group" überschriebe der Zeilenname den sichtbaren Knopftext.
    expect(button.getAttribute('aria-labelledby')).toBeNull();
    expect(button.textContent?.trim()).toBe('Sortierung zurücksetzen');
  });
});

@Component({
  standalone: true,
  imports: [Tba3ControlPanelComponent, Tba3ViewSlot],
  template: `
    <tba3-control-panel>
      <button tba3View type="button">Sortierung zurücksetzen</button>
    </tba3-control-panel>
  `,
})
class ButtonHostComponent {}
