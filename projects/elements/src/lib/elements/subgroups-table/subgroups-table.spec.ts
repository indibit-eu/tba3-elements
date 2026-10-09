import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { SubgroupsTableComponent, type SubgroupsMetric } from './subgroups-table';
import {
  FIXTURE_SUBGROUPS_TABLE_AUTHORITY,
  FIXTURE_SUBGROUPS_TABLE_EMPTY,
  FIXTURE_SUBGROUPS_TABLE_NO_PARTS,
  FIXTURE_SUBGROUPS_TABLE_PARTICIPATION,
  FIXTURE_SUBGROUPS_TABLE_STATE,
} from '../../../fixtures/subgroups-table';
import {
  FIXTURE_SCENARIO_SCHOOL_MINIMUM_CLASSIFICATION,
  FIXTURE_SCENARIO_STATES_COVARIATES,
  FIXTURE_SCENARIO_STATES_MINIMUM_CLASSIFICATION,
} from '../../../fixtures/scenario';
import { EXAMPLE_VALUE_LABELS } from '../../../fixtures/example-labels';
import type { AggregationsValueGroup } from '../../model';

interface RenderOptions {
  thresholds?: [number, number, number];
  upperRangeThresholds?: [number, number, number];
  deviationThreshold?: number;
  metric?: SubgroupsMetric;
  comparison?: string;
  listen?: boolean;
}

function render(aggregations: unknown, options: RenderOptions = {}) {
  const fixture = TestBed.createComponent(SubgroupsTableComponent);
  fixture.componentRef.setInput('aggregations', aggregations);
  fixture.componentRef.setInput('valueLabels', EXAMPLE_VALUE_LABELS);
  for (const key of [
    'thresholds',
    'upperRangeThresholds',
    'deviationThreshold',
    'metric',
    'comparison',
  ] as const) {
    if (options[key] !== undefined) fixture.componentRef.setInput(key, options[key]);
  }
  const selected = vi.fn();
  if (options.listen) fixture.componentInstance.rowSelected.subscribe(selected);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return { fixture, root, component: fixture.componentInstance, selected };
}

const rowsOf = (root: HTMLElement) => [...root.querySelectorAll('tbody tr')] as HTMLElement[];
const headText = (root: HTMLElement) =>
  [...root.querySelectorAll('thead th')].map((th) => th.textContent?.replace(/\s+/g, ' ').trim());
const lastCell = (row: HTMLElement) => {
  const cells = row.querySelectorAll('td');
  return cells[cells.length - 1];
};
const byType = (groups: readonly AggregationsValueGroup[], ...types: string[]) =>
  groups.filter((group) => types.includes(group.type ?? ''));

describe('SubgroupsTableComponent', () => {
  it('stellt feste Zeilen grob nach fein ohne Hervorhebung, dann die Teilgruppen', () => {
    const { component, root } = render(FIXTURE_SUBGROUPS_TABLE_AUTHORITY);

    expect(component.pinnedRows().map((row) => [row.id, row.role])).toEqual([
      ['state:beispielland', 'comparison'],
      ['authority:sa-nordmark', 'focus'],
    ]);
    expect(component.partRows().map((row) => row.id)).toEqual([
      'school:school-birkenmoor',
      'school:school-ahornbach',
      'school:school-steinfurth',
      'school:school-wellinghusen',
      'school:school-lindenhain',
    ]);

    const rows = rowsOf(root);
    expect(rows.some((row) => row.classList.contains('fw-bold'))).toBe(false);
    expect(rows.some((row) => row.classList.contains('table-active'))).toBe(false);
    expect(root.querySelector('caption')?.textContent).toContain('7 Zeilen');

    const bodies = root.querySelectorAll('tbody');
    expect(bodies).toHaveLength(2);
    expect(bodies[0].classList.contains('tba3-pinned-rows')).toBe(true);
    expect(bodies[0].querySelectorAll('tr')).toHaveLength(2);
    expect(bodies[1].classList.contains('table-group-divider')).toBe(true);
    expect(bodies[1].querySelectorAll('tr')).toHaveLength(5);
  });

  it('zeigt Bedienfeld und Spalten Name, Klassen, Personen, Merkmale, Kennzahl', () => {
    const { component, root } = render(FIXTURE_SUBGROUPS_TABLE_AUTHORITY);

    expect(component.unitColumns().map((column) => column.label)).toEqual(['Klassen']);
    expect(component.characteristicColumns().map((column) => column.label)).toEqual([
      'Geschlecht',
      'Sprache zu Hause',
      'Sozioökonomischer Status',
    ]);
    expect(headText(root)).toEqual([
      'Name',
      'Klassen',
      'Personen',
      'Geschlecht',
      'Sprache zu Hause',
      'Sozioökonomischer Status',
      'Mindeststandard erreicht',
    ]);
    const panel = root.querySelector('tba3-control-panel');
    expect(panel).not.toBeNull();
    const buttons = [...panel!.querySelectorAll('button')].map((button) =>
      button.textContent?.trim(),
    );
    expect(buttons).toEqual([
      'Mindeststandard erreicht',
      'Oberer Leistungsbereich',
      'Verteilung',
      'keiner',
      'Beispielland',
      'Schulamt Nordmark',
    ]);
  });

  it('führt Kennzahl (minimumClassification) und Zusammensetzung (classCount) je Zeile zusammen', () => {
    const { component } = render(FIXTURE_SUBGROUPS_TABLE_AUTHORITY);
    const nordmark = component.pinnedRows()[1];
    // Personenzahl aus der Kennzahl-Bezugsgruppe, Klassen aus classCount (schlichte Lieferform).
    expect(nordmark.students).toBe(860);
    expect(nordmark.units['groups-by-participation']).toBe(31);
    const birkenmoor = component.partRows()[0];
    expect(birkenmoor.students).toBe(196);
    expect(birkenmoor.units['groups-by-participation']).toBe(6);
    // Lindenhain ohne Kennzahl: Personenzahl ersatzweise aus dem Geschlecht.
    const lindenhain = component.partRows()[4];
    expect(lindenhain.metric).toBeUndefined();
    expect(lindenhain.students).toBe(190);
  });

  it('zeigt die Kennzahl absolut mit neutralem Balken und Skalen-Pille', () => {
    const { component, root } = render(FIXTURE_SUBGROUPS_TABLE_AUTHORITY);
    const [birkenmoor, ahornbach, steinfurth, wellinghusen, lindenhain] = component.partRows();

    expect(birkenmoor.metric).toEqual({
      value: 85,
      barColor: 'var(--tba3-bar)',
      scale: { level: 'high', ariaLabel: '85 %, ab 85 %' },
      bands: undefined,
      bandsText: '',
      delta: undefined,
    });
    expect(ahornbach.metric?.scale?.level).toBe('high');
    expect(steinfurth.metric).toMatchObject({ value: 68, scale: { level: 'mid-low' } });
    expect(wellinghusen.metric).toMatchObject({ value: 56, scale: { level: 'low' } });
    expect(lindenhain.metric).toBeUndefined();
    expect(component.pinnedRows()[0].metric?.barColor).toBe('var(--tba3-bar-comparison)');
    expect(component.pinnedRows()[1].metric).toMatchObject({
      value: 80,
      barColor: 'var(--tba3-bar)',
    });

    const bar = lastCell(rowsOf(root)[2]).querySelector('.progress-bar') as HTMLElement;
    expect(bar.getAttribute('style')).toContain('var(--tba3-bar)');
    expect(bar.getAttribute('style')).toContain('85%');
    expect(rowsOf(root)[2].querySelector('tba3-scale-pill span')?.textContent).toContain('▲');
    expect(lastCell(rowsOf(root)[6]).textContent?.trim()).toBe('–');
    expect(root.querySelector('ul[aria-label="Skala Mindeststandard erreicht"]')).not.toBeNull();
  });

  it('folgt geänderten thresholds in der Skala-Legende', () => {
    const { root } = render(FIXTURE_SUBGROUPS_TABLE_AUTHORITY, { thresholds: [50, 70, 90] });
    const legend = root.querySelector('ul[aria-label="Skala Mindeststandard erreicht"]');
    expect(legend?.textContent?.replace(/\s+/g, ' ')).toContain('< 50 %');
    expect(legend?.textContent?.replace(/\s+/g, ' ')).toContain('≥ 90 %');
  });

  it('wechselt auf den oberen Leistungsbereich, mit Skala nur bei Grenzen', () => {
    const plain = render(FIXTURE_SUBGROUPS_TABLE_AUTHORITY);
    plain.component.setMetric('upperRange');
    plain.fixture.detectChanges();
    expect(plain.component.partRows().map((row) => row.metric?.value)).toEqual([
      30,
      43,
      16,
      10,
      undefined,
    ]);
    expect(plain.component.partRows()[0].metric?.scale).toBeUndefined();
    expect(headText(plain.root)).toContain('Oberer Leistungsbereich');
    expect(plain.root.querySelector('tbody tba3-scale-pill')).toBeNull();
    expect(plain.component.spread()).toEqual({ min: 10, max: 43, range: 33 });

    const scaled = render(FIXTURE_SUBGROUPS_TABLE_AUTHORITY, {
      metric: 'upperRange',
      upperRangeThresholds: [20, 30, 40],
    });
    expect(scaled.component.partRows().map((row) => row.metric?.scale?.level)).toEqual([
      'mid',
      'high',
      'low',
      'low',
      undefined,
    ]);
    expect(
      scaled.root.querySelector('ul[aria-label="Skala Oberer Leistungsbereich"]'),
    ).not.toBeNull();
  });

  it('zeigt mit gewähltem Vergleich die Δ-Spalte, hebt die Vergleichszeile hervor und lässt die Skala weg', () => {
    const { component, root, fixture } = render(FIXTURE_SUBGROUPS_TABLE_AUTHORITY);
    component.setComparison('state:beispielland');
    fixture.detectChanges();

    expect(headText(root)).toContain('Δ Beispielland');
    const [birkenmoor, , , wellinghusen] = component.partRows();
    expect(birkenmoor.metric?.delta).toMatchObject({
      diff: 4,
      label: '+4 Pp',
      direction: 'better',
    });
    expect(birkenmoor.metric?.delta?.ariaLabel).toBe(
      'Gesamtschule Birkenmoor gegenüber Beispielland: 4 Prozentpunkte besser',
    );
    expect(wellinghusen.metric?.delta).toMatchObject({ label: '−25 Pp', direction: 'worse' });
    expect(component.pinnedRows()[1].metric?.delta).toMatchObject({ label: '−1 Pp' });
    expect(component.pinnedRows()[0].metric?.delta).toBeUndefined();
    expect(birkenmoor.metric?.scale).toBeUndefined();

    const rows = rowsOf(root);
    expect(rows[0].classList.contains('table-active')).toBe(true);
    expect(rows[0].classList.contains('fw-bold')).toBe(true);
    expect(rows[1].classList.contains('table-active')).toBe(false);
    expect(lastCell(rows[0]).querySelector('span')?.getAttribute('aria-label')).toBe(
      'Δ Beispielland: Bezugszeile',
    );
    expect(lastCell(rows[2]).querySelector('tba3-delta')).not.toBeNull();
    expect(root.querySelector('tbody tba3-scale-pill')).toBeNull();

    component.sort('delta');
    expect(component.partRows()[0].id).toBe('school:school-wellinghusen');
  });

  it('nimmt die Startwerte aus metric und comparison', () => {
    const { component, root } = render(FIXTURE_SUBGROUPS_TABLE_AUTHORITY, {
      comparison: 'authority:sa-nordmark',
    });
    expect(component.selectedComparison()?.id).toBe('authority:sa-nordmark');
    expect(rowsOf(root)[1].classList.contains('table-active')).toBe(true);
    expect(component.partRows()[0].metric?.delta?.label).toBe('+5 Pp');

    const distribution = render(FIXTURE_SUBGROUPS_TABLE_AUTHORITY, { metric: 'distribution' });
    expect(distribution.component.isDistribution()).toBe(true);
    expect(distribution.component.partRows()[0].metric?.bands).toHaveLength(3);
  });

  it('zeigt die Verteilung als drei Bänder ohne Vergleich und ohne Spannweite', () => {
    const { component, root, fixture } = render(FIXTURE_SUBGROUPS_TABLE_AUTHORITY, {
      comparison: 'state:beispielland',
    });
    component.setMetric('distribution');
    fixture.detectChanges();

    const birkenmoor = component.partRows()[0].metric!;
    expect(birkenmoor.bands?.map((band) => [band.label, band.percent, band.color])).toEqual([
      ['unter Mindeststandard', 15, 'var(--tba3-classification-below-minimum)'],
      ['Mindeststandard bis Regelstandard plus', 79, 'var(--tba3-bar)'],
      ['Optimalstandard', 6, 'var(--tba3-classification-optimal)'],
    ]);
    expect(birkenmoor.value).toBeUndefined();
    expect(headText(root)).toContain('Verteilung');
    expect(headText(root).some((text) => text?.startsWith('Δ'))).toBe(false);
    expect(component.spread()).toBeUndefined();

    const comparisonButtons = [
      ...root.querySelectorAll('div[aria-label="Vergleich wählen"] button'),
    ];
    expect(comparisonButtons.length).toBeGreaterThan(0);
    expect(comparisonButtons.every((button) => (button as HTMLButtonElement).disabled)).toBe(true);
    expect(rowsOf(root).some((row) => row.classList.contains('table-active'))).toBe(false);

    const legend = root.querySelectorAll('tba3-legend')[0];
    expect(legend.textContent?.replace(/\s+/g, ' ')).toContain('Verteilung');
    expect(legend.querySelector('i.fa-crown')).not.toBeNull();
    expect(legend.querySelector('i.fa-triangle-exclamation')).not.toBeNull();

    component.sort('metric');
    expect(component.partRows().map((row) => row.id)).toEqual([
      'school:school-ahornbach',
      'school:school-birkenmoor',
      'school:school-steinfurth',
      'school:school-wellinghusen',
      'school:school-lindenhain',
    ]);
  });

  it('bindet Merkmalsfarben an die Ausprägung und baut die Legende je Merkmal', () => {
    const { component, root } = render(FIXTURE_SUBGROUPS_TABLE_AUTHORITY);
    const gender = component.characteristicColumns()[0];
    expect(gender.legend.map((item) => item.text)).toEqual([
      'Geschlecht',
      'männlich',
      'weiblich',
      'divers',
      'ohne Angabe',
    ]);
    expect(gender.legend.slice(1, 4).map((item) => item.color)).toEqual([
      'var(--tba3-category-1)',
      'var(--tba3-category-2)',
      'var(--tba3-category-3)',
    ]);
    const birkenmoor = component.partRows()[0].characteristics['students-by-gender'];
    expect(birkenmoor?.text).toContain('männlich');
    // Oberschule Wellinghusen trägt keine Sprach-Aggregation.
    expect(component.partRows()[3].characteristics['students-by-languageAtHome']).toBeUndefined();
    const stacked = rowsOf(root)[2].querySelector('.progress-stacked') as HTMLElement;
    expect(stacked.getAttribute('aria-hidden')).toBe('true');
  });

  it('sortiert nur die Teilgruppen, fehlende Werte ans Ende, und setzt aria-sort', () => {
    const { component, root, fixture } = render(FIXTURE_SUBGROUPS_TABLE_AUTHORITY);
    component.sort('metric');
    fixture.detectChanges();
    expect(component.partRows().map((row) => row.id)).toEqual([
      'school:school-wellinghusen',
      'school:school-steinfurth',
      'school:school-birkenmoor',
      'school:school-ahornbach',
      'school:school-lindenhain',
    ]);
    expect(component.pinnedRows().map((row) => row.id)).toEqual([
      'state:beispielland',
      'authority:sa-nordmark',
    ]);
    const heads = [...root.querySelectorAll('thead th')];
    expect(heads[heads.length - 1].getAttribute('aria-sort')).toBe('ascending');
    expect(heads[0].getAttribute('aria-sort')).toBe('none');

    const fresh = render(FIXTURE_SUBGROUPS_TABLE_AUTHORITY);
    fresh.component.sort('students');
    fresh.component.sort('students');
    fresh.fixture.detectChanges();
    expect(fresh.component.partRows()[0].id).toBe('school:school-ahornbach');
    expect(fresh.root.querySelectorAll('thead th')[2].getAttribute('aria-sort')).toBe('descending');
  });

  it('macht Einheiten-Spalten nur aus den Teilgruppen (Land mit Schulämtern)', () => {
    const { component } = render(FIXTURE_SUBGROUPS_TABLE_STATE);
    expect(component.unitColumns().map((column) => column.label)).toEqual(['Klassen']);
    expect(component.pinnedRows()).toHaveLength(1);
    expect(component.pinnedRows()[0]).toMatchObject({ id: 'state:beispielland', role: 'focus' });
    expect(component.partRows().map((row) => row.metric?.scale?.level)).toEqual([
      'mid',
      'high',
      'mid-low',
      'mid',
    ]);
  });

  it('liest Teilnehmende und Teilnahmequote aus den Teilnahme-Kopfzahlen', () => {
    const { component, root } = render(FIXTURE_SUBGROUPS_TABLE_PARTICIPATION);
    expect(headText(root)).toEqual([
      'Name',
      'Klassen',
      'Teilnehmende',
      'Teilnahmequote',
      'Geschlecht',
      'Mindeststandard erreicht',
    ]);
    const nordmark = component.pinnedRows()[0];
    expect(nordmark.participated).toBe(820);
    expect(nordmark.participationText).toBe('93 %');
    expect(component.showStudents()).toBe(false);
    expect(component.partRows().map((row) => row.metric?.value)).toEqual([85, 92]);
  });

  it('zeigt ohne Teilgruppen die festen Zeilen und eine Hinweiszeile', () => {
    const { component, root } = render(FIXTURE_SUBGROUPS_TABLE_NO_PARTS);
    expect(component.hasParts()).toBe(false);
    expect(component.pinnedRows().map((row) => [row.id, row.role])).toEqual([
      ['state:beispielland', 'comparison'],
      ['authority:sa-nordmark', 'focus'],
    ]);
    const rows = rowsOf(root);
    expect(rows).toHaveLength(3);
    expect(rows[2].textContent).toContain('Keine Teilgruppen in der Antwort.');
    expect(rows[2].querySelector('td')?.getAttribute('colspan')).toBe(
      String(component.columnCount()),
    );
    expect(component.spread()).toBeUndefined();
  });

  it('macht den Namen nur mit Listener klickbar und meldet typ:id', () => {
    const plain = render(FIXTURE_SUBGROUPS_TABLE_AUTHORITY);
    expect(plain.root.querySelector('th[scope="row"] button')).toBeNull();

    const listened = render(FIXTURE_SUBGROUPS_TABLE_AUTHORITY, { listen: true });
    const button = rowsOf(listened.root)[2].querySelector('th button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Details zu Gesamtschule Birkenmoor öffnen');
    button.click();
    expect(listened.selected).toHaveBeenCalledWith('school:school-birkenmoor');
  });

  it('rendert den Leerzustand ohne Hauptgruppe oder ohne verwertbare Spalten', () => {
    for (const data of [[], FIXTURE_SUBGROUPS_TABLE_EMPTY]) {
      const { root } = render(data);
      expect(root.querySelector('table')).toBeNull();
      expect(root.querySelector('p.text-secondary')?.textContent).toBe(
        'Keine Daten für diese Darstellung.',
      );
    }
  });

  it('lässt die Slots tba3Header und tba3Footer im Leerzustand sichtbar', () => {
    @Component({
      imports: [SubgroupsTableComponent],
      template: `
        <tba3-subgroups-table [aggregations]="[]">
          <h2 tba3Header id="head">Kopf</h2>
          <p tba3Footer id="foot">Fuß</p>
        </tba3-subgroups-table>
      `,
    })
    class HostComponent {}

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('#head')?.textContent).toBe('Kopf');
    expect(root.querySelector('#foot')?.textContent).toBe('Fuß');
    expect(root.querySelector('p.text-secondary')?.textContent).toBe(
      'Keine Daten für diese Darstellung.',
    );
  });

  describe('Szenario eines Backends mit fester Ebenenfolge', () => {
    it('Schulsicht: Schule als Hauptgruppe, Vergleichsschulen als Vergleich, Kurse als Teilgruppen', () => {
      const { component } = render(FIXTURE_SCENARIO_SCHOOL_MINIMUM_CLASSIFICATION);

      expect(component.pinnedRows().map((row) => [row.name, row.role])).toEqual([
        ['Vergleichsschulen', 'comparison'],
        ['Gesamtschule Birkenmoor', 'focus'],
      ]);
      expect(component.partRows().map((row) => row.name)).toEqual([
        '8a Deutsch',
        '8b Deutsch',
        '8a Mathematik',
      ]);
      // Das Tabellenfach ist das erste Fach (Deutsch); der Mathematik-Kurs bleibt ohne Kennzahl.
      expect(component.partRows().map((row) => row.metric?.value)).toEqual([83, 82, undefined]);
      expect(component.pinnedRows().map((row) => row.metric?.value)).toEqual([88, 82]);
      expect(component.partRows().map((row) => row.students)).toEqual([23, 22, undefined]);
    });

    it('Landessicht: Land und Schulamt mit kollidierender id 7 getrennt, Zusammensetzung zugeordnet', () => {
      const minimum = byType(FIXTURE_SCENARIO_STATES_MINIMUM_CLASSIFICATION, 'state', 'authority');
      const covariates = byType(FIXTURE_SCENARIO_STATES_COVARIATES, 'state', 'authority');
      const { component } = render([...minimum, ...covariates]);

      expect(component.pinnedRows().map((row) => [row.id, row.name])).toEqual([
        ['state:7', 'Beispielland'],
      ]);
      expect(component.partRows().map((row) => [row.id, row.name])).toEqual([
        ['authority:7', 'Schulamt Nordmark'],
        ['authority:12', 'Schulamt Seeland'],
      ]);
      // Deutsch als Tabellenfach: Land 85 %, Nordmark 88 %, Seeland 82 %.
      expect(component.pinnedRows()[0].metric?.value).toBe(85);
      expect(component.partRows().map((row) => row.metric?.value)).toEqual([88, 82]);
      // Die Zusammensetzung des Schulamts 7 darf nicht die des Landes 7 sein.
      expect(component.pinnedRows()[0].units['groups-by-participation']).toBe(118);
      expect(component.partRows()[0].units['groups-by-participation']).toBe(31);
      expect(component.partRows().map((row) => row.students)).toEqual([1345, 1158]);
    });
  });
});
