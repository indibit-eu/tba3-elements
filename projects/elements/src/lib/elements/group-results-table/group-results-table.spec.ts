import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { GroupResultsTableComponent } from './group-results-table';
import {
  FIXTURE_GROUP_RESULTS_TABLE,
  FIXTURE_GROUP_RESULTS_TABLE_AGGREGATIONS,
  FIXTURE_GROUP_RESULTS_TABLE_EMPTY,
} from '../../../fixtures/group-results-table';
import { EXAMPLE_VALUE_LABELS } from '../../../fixtures/example-labels';

function render(data: unknown, options: { aggregations?: unknown; labels?: unknown } = {}) {
  const fixture = TestBed.createComponent(GroupResultsTableComponent);
  fixture.componentRef.setInput('competenceLevels', data);
  if (options.aggregations !== undefined)
    fixture.componentRef.setInput('aggregations', options.aggregations);
  if (options.labels !== undefined) fixture.componentRef.setInput('valueLabels', options.labels);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return { fixture, root, text: root.textContent ?? '', component: fixture.componentInstance };
}

function rowById(component: GroupResultsTableComponent, id: string) {
  return component.sortedRows().find((row) => row.id === id);
}

describe('GroupResultsTableComponent', () => {
  it('zeigt acht Zeilen, Merkmalsköpfe und Statusmarker', () => {
    const { root, component, text } = render(FIXTURE_GROUP_RESULTS_TABLE, {
      labels: EXAMPLE_VALUE_LABELS,
    });

    // Acht Personenzeilen.
    expect(root.querySelectorAll('tbody tr').length).toBe(8);

    // Merkmalsspalten mit Köpfen aus label.
    expect(component.covariateColumns().map((column) => column.label)).toEqual([
      'Geschlecht',
      'Sprache zu Hause',
      'Sozioökonomischer Status',
    ]);

    // Statusmarker laut Fixture.
    expect(rowById(component, 'student:student-4')?.belowMinimum).toBe(true);
    expect(rowById(component, 'student:student-5')?.optimal).toBe(true);
    expect(rowById(component, 'student:student-7')?.noParticipation).toBe(true);
    expect(root.querySelector('.fa-triangle-exclamation')).not.toBeNull();
    expect(root.querySelector('.fa-crown')).not.toBeNull();
    expect(root.querySelector('.fa-circle-xmark')).not.toBeNull();

    // Badge „III" bei mindestens einer Person (student-1, Lesen und Orthografie).
    expect(rowById(component, 'student:student-1')?.cells.map((cell) => cell.nameShort)).toEqual([
      'III',
      'III',
    ]);
    expect(text).toContain('III');
  });

  it('zeigt voll nicht-teilnehmende Personen mit Stammdaten und leeren Ergebnissen', () => {
    // Leere Kompetenzstufen in allen Domänen: eigene Zeile mit „–" und Marker „ohne Teilnahme".
    const domains = ['Lesen - mit Texten und Medien umgehen', 'Orthografie'];
    const absent = domains.map((domain) => ({
      id: 'student-9',
      type: 'student',
      name: 'Nala Ohnedaten',
      subject: { name: 'Deutsch' },
      domain: { name: domain },
      covariates: [
        { type: 'gender', label: 'Geschlecht', value: 'female' },
        { type: 'languageAtHome', label: 'Sprache zu Hause', value: 'other' },
        { type: 'ses', label: 'Sozioökonomischer Status', value: 'C' },
      ],
      competenceLevels: [],
    }));
    const { component } = render([...FIXTURE_GROUP_RESULTS_TABLE, ...absent] as unknown, {
      labels: EXAMPLE_VALUE_LABELS,
    });
    const row = rowById(component, 'student:student-9');
    expect(row).toBeDefined();
    expect(row?.noParticipation).toBe(true);
    // Beide Domänen ohne Stufe: „–".
    expect(row?.cells.map((cell) => cell.nameShort)).toEqual(['–', '–']);
    expect(row?.cells.every((cell) => !cell.hasStage)).toBe(true);
    // Stammdaten sind gefüllt (nicht „–").
    expect(row?.covariateCells.map((cell) => cell.text)).toEqual(['w', 'andere', 'mittel']);
  });

  it('zeigt mit aggregations Ø-Spalten und die Summenzeile Mittel der Personenwerte oben', () => {
    const { root, component, text } = render(FIXTURE_GROUP_RESULTS_TABLE, {
      aggregations: FIXTURE_GROUP_RESULTS_TABLE_AGGREGATIONS,
    });

    expect(component.hasAggregations()).toBe(true);

    // Ø-Wert einer Person laut Fixture (Mira Brandhauer, Lesen 0.6).
    expect(rowById(component, 'student:student-1')?.cells[0].averageText).toBe('60 %');

    // Summenzeile Mittel der Personenwerte je Domäne, als erste Körperzeile statt tfoot.
    expect(component.footer().map((entry) => entry.averageText)).toEqual(['59 %', '60 %']);
    expect(root.querySelector('tfoot')).toBeNull();
    const summaryRow = root.querySelector('tbody tr');
    expect(summaryRow?.classList.contains('fw-bold')).toBe(true);
    expect(summaryRow?.textContent).toContain('Mittel der Personenwerte');
    expect(text).toContain('Mittel der Personenwerte');
  });

  it('sortiert bei Klick auf den Stufenkopf auf-, ab- und wieder aus', () => {
    const { component } = render(FIXTURE_GROUP_RESULTS_TABLE);
    const column = 'level:Lesen';

    // Erster Klick: aufsteigend, schwächste Stufe zuerst (student-4, Ib).
    component.sort(column);
    expect(component.sortDirection(column)).toBe('asc');
    expect(component.sortedRows()[0].id).toBe('student:student-4');
    expect(component.sortedRows().at(-1)?.id).toBe('student:student-5');

    // Zweiter Klick: absteigend, stärkste Stufe zuerst (student-5, V).
    component.sort(column);
    expect(component.sortDirection(column)).toBe('desc');
    expect(component.sortedRows()[0].id).toBe('student:student-5');

    // Dritter Klick: entfernt das Kriterium, Antwortreihenfolge.
    component.sort(column);
    expect(component.sortDirection(column)).toBeUndefined();
    expect(component.sortedRows()[0].id).toBe('student:student-1');
  });

  it('trägt eine visually-hidden caption und spiegelt die Sortierung in aria-sort', () => {
    const { root, component, fixture } = render(FIXTURE_GROUP_RESULTS_TABLE);

    const caption = root.querySelector('table caption');
    expect(caption).not.toBeNull();
    expect(caption?.classList.contains('visually-hidden')).toBe(true);
    expect(caption?.textContent).toContain('Ergebnisse der Personen');

    // Alle Sortierköpfe (Name, Merkmale, Stufe, Ø) nutzen den Sortierkopf-Baustein.
    expect(root.querySelectorAll('thead tba3-sort-header').length).toBeGreaterThan(0);

    const column = 'level:Lesen';
    // Der erste Stufenkopf gehört zu Lesen.
    const levelHeader = () =>
      [...root.querySelectorAll('thead tr:last-child th')].find((th) =>
        th.textContent?.includes('Stufe'),
      ) as HTMLElement | undefined;

    expect(levelHeader()?.getAttribute('aria-sort')).toBe('none');

    component.sort(column);
    fixture.detectChanges();
    expect(component.ariaSort(column)).toBe('ascending');
    expect(levelHeader()?.getAttribute('aria-sort')).toBe('ascending');

    component.sort(column);
    fixture.detectChanges();
    expect(component.ariaSort(column)).toBe('descending');
    expect(levelHeader()?.getAttribute('aria-sort')).toBe('descending');
  });

  it('meldet die id der angeklickten Person über personSelected', () => {
    const { root, component } = render(FIXTURE_GROUP_RESULTS_TABLE);
    let selected: string | undefined;
    component.personSelected.subscribe((id) => (selected = id));

    const nameButton = root.querySelector<HTMLButtonElement>('tbody tr th[scope="row"] button');
    nameButton?.click();
    expect(selected).toBe('student:student-1');
    expect(nameButton?.getAttribute('aria-label')).toBe('Details zu Mira Brandhauer öffnen');
  });

  it('nutzt labelShort aus valueLabels für Merkmalswerte', () => {
    const withoutLabels = render(FIXTURE_GROUP_RESULTS_TABLE);
    expect(rowById(withoutLabels.component, 'student:student-1')?.covariateCells[0]?.text).toBe(
      'female',
    );

    const withLabels = render(FIXTURE_GROUP_RESULTS_TABLE, { labels: EXAMPLE_VALUE_LABELS });
    expect(rowById(withLabels.component, 'student:student-1')?.covariateCells[0]?.text).toBe('w');
  });

  it('zeigt die Zeile Ansicht mit dem Knopf „Sortierung zurücksetzen", der ohne Sortierung disabled ist', () => {
    const { root, component, fixture } = render(FIXTURE_GROUP_RESULTS_TABLE);

    const panel = root.querySelector('tba3-control-panel');
    expect(panel).not.toBeNull();
    const resetButton = panel?.querySelector<HTMLButtonElement>('button[tba3View]');
    expect(resetButton?.textContent).toContain('Sortierung zurücksetzen');
    expect(resetButton?.disabled).toBe(true);

    component.sort('name');
    fixture.detectChanges();
    expect(resetButton?.disabled).toBe(false);
  });

  it('setzt align-bottom am Kopf, tba3-num an Ø-Zellen und Kennfarben an Markern', () => {
    const { root } = render(FIXTURE_GROUP_RESULTS_TABLE, {
      aggregations: FIXTURE_GROUP_RESULTS_TABLE_AGGREGATIONS,
    });

    // Beide Kopfzeilen tragen align-bottom.
    expect(root.querySelectorAll('thead tr.align-bottom').length).toBe(2);

    // Ø-Zellen der Summen- und Personenzeilen tragen tba3-num und stehen rechtsbündig.
    const numCell = root.querySelector('tbody td.tba3-num');
    expect(numCell).not.toBeNull();
    expect(numCell?.classList.contains('text-end')).toBe(true);

    // Marker nutzen die Kennfarben, nicht die Abweichungsfarben.
    const alert = root.querySelector('.fa-triangle-exclamation') as HTMLElement;
    const crown = root.querySelector('.fa-crown') as HTMLElement;
    expect(alert.getAttribute('style')).toContain('--tba3-mark-alert');
    expect(crown.getAttribute('style')).toContain('--tba3-mark-top');

    // Legende mit Ø-Eintrag und den Marker-Icons als führendem Zeichen.
    const legend = root.querySelector('tba3-legend');
    expect(legend).not.toBeNull();
    expect(legend?.textContent).toContain('Ø = mittlere Lösungsquote');
    // Der Ø-Eintrag hat kein Farbfeld.
    const firstItem = legend?.querySelector('li.list-inline-item');
    expect(firstItem?.querySelector('.fa-square')).toBeNull();
    // Der Optimalstandard-Eintrag trägt die Krone als führenden Marker in der Kennfarbe.
    const crownInLegend = legend?.querySelector('.fa-crown') as HTMLElement;
    expect(crownInLegend).not.toBeNull();
    expect(crownInLegend.getAttribute('style')).toContain('--tba3-mark-top');
  });

  it('projiziert Host-Inhalt in die Slots [tba3Header] und [tba3Footer]', () => {
    @Component({
      standalone: true,
      imports: [GroupResultsTableComponent],
      template: `
        <tba3-group-results-table [competenceLevels]="data">
          <p tba3Header>Kopf</p>
          <p tba3Footer>Fuß</p>
        </tba3-group-results-table>
      `,
    })
    class HostComponent {
      protected readonly data = FIXTURE_GROUP_RESULTS_TABLE;
    }

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const header = root.querySelector('[tba3Header]');
    const footer = root.querySelector('[tba3Footer]');
    expect(header?.textContent).toBe('Kopf');
    expect(footer?.textContent).toBe('Fuß');
    // Kopf steht vor dem Bedienfeld, Fuß nach der Tabelle.
    expect(header?.compareDocumentPosition(root.querySelector('tba3-control-panel')!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(footer?.compareDocumentPosition(root.querySelector('table')!)).toBe(
      Node.DOCUMENT_POSITION_PRECEDING,
    );
  });

  it('zeigt bei einer Antwort ohne Personen den Leerhinweis und rendert ihn auch bei leerem Array', () => {
    const noPersons = render(FIXTURE_GROUP_RESULTS_TABLE_EMPTY);
    expect(noPersons.component.sortedRows().length).toBe(0);
    expect(noPersons.text).toContain('Keine Daten für diese Darstellung.');
    expect(noPersons.root.querySelector('table')).toBeNull();

    const empty = render([]);
    expect(empty.root.textContent?.trim()).toBe('Keine Daten für diese Darstellung.');
  });
});

@Component({
  imports: [GroupResultsTableComponent],
  template: `<tba3-group-results-table [competenceLevels]="data">
    <div tba3Header>Kopf-Slot</div>
    <div tba3Footer>Fuß-Slot</div>
  </tba3-group-results-table>`,
})
class EmptyStateHost {
  data: typeof FIXTURE_GROUP_RESULTS_TABLE = [];
}

describe('GroupResultsTableComponent Leerzustand', () => {
  it('rendert im Leerzustand nur den Hinweis und die Slots', () => {
    const fixture = TestBed.createComponent(EmptyStateHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const hint = root.querySelector('p.text-secondary.mb-0');
    expect(hint?.textContent?.trim()).toBe('Keine Daten für diese Darstellung.');
    expect(root.textContent).toContain('Kopf-Slot');
    expect(root.textContent).toContain('Fuß-Slot');
    expect(root.querySelector('tba3-control-panel')).toBeNull();
  });
});
