import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { SolutionRatesHeatmapComponent, type HeatmapScale } from './solution-rates-heatmap';
import type { AggregationsValueGroup } from '../../model';
import {
  FIXTURE_SOLUTION_RATES_HEATMAP,
  FIXTURE_SOLUTION_RATES_HEATMAP_EMPTY,
} from '../../../fixtures/solution-rates-heatmap';

// Nur der Landesmittelwert als Vergleichsgruppe.
const WITHOUT_SCHOOL_COMPARISON: AggregationsValueGroup[] = FIXTURE_SOLUTION_RATES_HEATMAP.filter(
  (group) => group.type !== 'school',
);

// Ohne Vergleichsgruppe, nur Klasse und Personen.
const WITHOUT_ANY_COMPARISON: AggregationsValueGroup[] = FIXTURE_SOLUTION_RATES_HEATMAP.filter(
  (group) => group.type !== 'school' && group.type !== 'state',
);

const ABSOLUTE: HeatmapScale = { mode: 'absolute', thresholds: [40, 55, 70] };

function create(data: unknown, inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(SolutionRatesHeatmapComponent);
  fixture.componentRef.setInput('aggregations', data);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  return fixture;
}

describe('SolutionRatesHeatmapComponent', () => {
  it('sortiert die Spalten nach dem Δ zur Vergleichsgruppe, schwächste zuerst (Default relativ)', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_HEATMAP);
    const component = fixture.componentInstance;
    expect(component.isAbsolute()).toBe(false);
    // Startauswahl ist die erste Vergleichsgruppe der Antwort (Schulmittelwert).
    expect(component.referenceRow()?.name).toBe('Schulmittelwert');

    const columns = component.columns();
    expect(columns.map((column) => column.value)).toEqual([
      '1.1.2',
      '2.4.2',
      '4.1.3',
      '2.3.1',
      '3.2.4',
    ]);
    expect(columns.map((column) => column.meanValue)).toEqual([-12, -6, -3, 2, 8]);
    expect(columns.map((column) => column.level)).toEqual(['low', 'mid-low', 'mid', 'mid', 'high']);
  });

  it('sortiert dieselben Spalten nach dem Klassenmittel in der absoluten Ansicht (scale)', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_HEATMAP, { scale: ABSOLUTE });
    const component = fixture.componentInstance;
    expect(component.isAbsolute()).toBe(true);
    expect(component.referenceRow()).toBeUndefined();

    const columns = component.columns();
    expect(columns.map((column) => column.value)).toEqual([
      '1.1.2',
      '2.4.2',
      '2.3.1',
      '3.2.4',
      '4.1.3',
    ]);
    expect(columns.map((column) => column.meanValue)).toEqual([30, 43, 48, 60, 77]);
    expect(columns.map((column) => column.level)).toEqual([
      'low',
      'mid-low',
      'mid-low',
      'mid',
      'high',
    ]);
  });

  it('sortiert die Zeilen nach dem mittleren Δ zur Vergleichsgruppe, schwächste oben', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_HEATMAP);
    const rows = fixture.componentInstance.rows();

    // Bei Gleichstand bleibt die Antwortreihenfolge (Levi vor Emma).
    expect(rows.map((row) => row.name)).toEqual([
      'Ben Ulmer',
      'Lina Tannhäuser',
      'Noah Sonnfeld',
      'Levi Mühlenrath',
      'Emma Rehberg',
      'Ida Haselbeck',
    ]);
    expect(rows.map((row) => row.mean)).toEqual([-14, -11, -2, 2, 2, 6]);
  });

  it('färbt die Zellen in der absoluten Ansicht nach der Lösungsquote (scale-Grenzen)', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_HEATMAP, { scale: ABSOLUTE });
    const component = fixture.componentInstance;
    expect(component.isAbsolute()).toBe(true);

    const ida = component.rows().find((row) => row.name === 'Ida Haselbeck')!;
    // 40 % liegt genau auf der ersten Grenze und zählt als mid-low.
    expect(ida.cells.map((cell) => cell.level)).toEqual(['low', 'mid-low', 'mid', 'high', 'high']);
    expect(ida.cells[0].value).toBe(20);
    expect(ida.cells[0].text).toContain('20 %');
    expect(ida.cells[0].text).toContain('unter 40 %');
  });

  it('färbt die Zellen in der relativen Default-Ansicht nach der Differenz zur Vergleichsgruppe', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_HEATMAP);
    const component = fixture.componentInstance;
    expect(component.isAbsolute()).toBe(false);

    const ben = component.rows().find((row) => row.name === 'Ben Ulmer')!;
    expect(ben.cells.map((cell) => cell.value)).toEqual([-22, -9, -20, -6, -12]);
    expect(ben.cells.map((cell) => cell.level)).toEqual([
      'low',
      'mid-low',
      'low',
      'mid-low',
      'low',
    ]);
    expect(ben.cells[0].text).toContain('22 Prozentpunkte unter der Vergleichsgruppe');
  });

  it('respektiert eigene relative Grenzen über scale.thresholds', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_HEATMAP, {
      scale: { mode: 'relative', thresholds: [-20, -10, 0] } satisfies HeatmapScale,
    });
    const component = fixture.componentInstance;
    expect(component.isAbsolute()).toBe(false);

    const ben = component.rows().find((row) => row.name === 'Ben Ulmer')!;
    // −22 liegt jetzt unter −20 (low), −9 zwischen −10 und 0 (mid), −6 ebenso (mid).
    expect(ben.cells.map((cell) => cell.value)).toEqual([-22, -9, -20, -6, -12]);
    expect(ben.cells.map((cell) => cell.level)).toEqual([
      'low',
      'mid',
      'mid-low',
      'mid',
      'mid-low',
    ]);
  });

  it('zeigt eine fehlende Zelle ungefärbt und mit „ohne Wert"', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_HEATMAP);
    const lina = fixture.componentInstance.rows().find((row) => row.name === 'Lina Tannhäuser')!;
    const missing = lina.cells.find((cell) => cell.key === '2.3.1')!;
    expect(missing.value).toBeUndefined();
    expect(missing.level).toBeUndefined();
    expect(missing.text).toContain('ohne Wert');
    expect(fixture.componentInstance.background(missing.level)).toBeNull();
  });

  it('filtert die Spalten über die Kategorie-Chips (Mehrfachwahl), Personen bleiben erhalten', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_HEATMAP);
    const component = fixture.componentInstance;

    component.toggleLevel('low');
    fixture.detectChanges();
    expect(component.columns().map((column) => column.value)).toEqual(['1.1.2']);
    expect(component.rows().length).toBe(6);

    component.toggleLevel('mid-low');
    fixture.detectChanges();
    expect(component.columns().map((column) => column.value)).toEqual(['1.1.2', '2.4.2']);

    component.toggleLevel('low');
    component.toggleLevel('mid-low');
    fixture.detectChanges();
    expect(component.columns().length).toBe(5);

    const chips = fixture.nativeElement.querySelectorAll('[tba3Filter] button');
    expect(chips.length).toBe(4);
  });

  it('rendert die Kategorie-Chips als gedrückte Buttons (aria-pressed)', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_HEATMAP);
    const component = fixture.componentInstance;

    const chips = [
      ...fixture.nativeElement.querySelectorAll('[tba3Filter] button'),
    ] as HTMLButtonElement[];
    expect(chips.every((chip) => chip.getAttribute('aria-pressed') === 'false')).toBe(true);
    expect(chips.every((chip) => chip.classList.contains('btn-outline-secondary'))).toBe(true);

    component.toggleLevel('low');
    fixture.detectChanges();
    const active = fixture.nativeElement.querySelector(
      '[tba3Filter] button[aria-pressed="true"]',
    ) as HTMLButtonElement;
    expect(active).not.toBeNull();
    expect(active.classList).toContain('btn-secondary');
  });

  it('rendert keinen Klick-Spaltenkopf ohne Listener, aber einen Button mit Listener', () => {
    const withoutListener = create(FIXTURE_SOLUTION_RATES_HEATMAP);
    const headerCell = withoutListener.nativeElement.querySelector(
      'thead th:nth-child(2)',
    ) as HTMLElement;
    expect(headerCell.textContent?.trim()).toBe('1.1.2');
    expect(headerCell.querySelector('button')).toBeNull();

    // Abonnieren vor dem ersten Rendern, wie eine Template-Bindung.
    const fixture = TestBed.createComponent(SolutionRatesHeatmapComponent);
    let selected: string | undefined;
    fixture.componentInstance.columnSelected.subscribe((value) => (selected = value));
    fixture.componentRef.setInput('aggregations', FIXTURE_SOLUTION_RATES_HEATMAP);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('thead th button') as HTMLButtonElement;
    expect(button).not.toBeNull();
    button.click();
    expect(selected).toBe('1.1.2');
  });

  it('rendert die Checkbox-Spalte nur mit einem studentsSelected-Listener', () => {
    const withoutListener = create(FIXTURE_SOLUTION_RATES_HEATMAP);
    expect(withoutListener.nativeElement.querySelector('tbody input[type="checkbox"]')).toBeNull();

    const fixture = TestBed.createComponent(SolutionRatesHeatmapComponent);
    let selection: string[] | undefined;
    fixture.componentInstance.studentsSelected.subscribe((value) => (selection = value));
    fixture.componentRef.setInput('aggregations', FIXTURE_SOLUTION_RATES_HEATMAP);
    fixture.detectChanges();

    const row = [...fixture.nativeElement.querySelectorAll('tbody tr')].find((tr) =>
      tr.textContent?.includes('Ben Ulmer'),
    ) as HTMLElement;
    const checkbox = row.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox).not.toBeNull();
    checkbox.click();
    expect(selection).toEqual(['student:student-6']);
  });

  it('verknüpft den Personennamen als Label der Zeilen-Checkbox (for/id)', () => {
    const withoutListener = create(FIXTURE_SOLUTION_RATES_HEATMAP);
    const row = [...withoutListener.nativeElement.querySelectorAll('tbody tr')].find((tr) =>
      tr.textContent?.includes('Ben Ulmer'),
    ) as HTMLElement;
    expect(row.querySelector('label')).toBeNull();

    const fixture = TestBed.createComponent(SolutionRatesHeatmapComponent);
    fixture.componentInstance.studentsSelected.subscribe(() => {});
    fixture.componentRef.setInput('aggregations', FIXTURE_SOLUTION_RATES_HEATMAP);
    fixture.detectChanges();

    const selectedRow = [...fixture.nativeElement.querySelectorAll('tbody tr')].find((tr) =>
      tr.textContent?.includes('Ben Ulmer'),
    ) as HTMLElement;
    const checkbox = selectedRow.querySelector('input[type="checkbox"]') as HTMLInputElement;
    const label = selectedRow.querySelector('label') as HTMLLabelElement;
    expect(label).not.toBeNull();
    expect(label.textContent?.trim()).toBe('Ben Ulmer');
    expect(label.getAttribute('for')).toBe(checkbox.id);

    label.click();
    fixture.detectChanges();
    expect(checkbox.checked).toBe(true);
  });

  it('beschriftet die Filterzeile mit „Klassenmittel" statt „Kategorie"', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_HEATMAP);
    const labels = [
      ...fixture.nativeElement.querySelectorAll('tba3-control-panel .tba3-control-label'),
    ];
    expect(labels.some((element) => element.textContent?.trim() === 'Klassenmittel')).toBe(true);
    expect(labels.some((element) => element.textContent?.trim() === 'Kategorie')).toBe(false);
  });

  it('zeigt in der relativen Ansicht eine ungefärbte Vergleichszeile mit den absoluten Werten der Vergleichsgruppe', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_HEATMAP);
    const component = fixture.componentInstance;
    expect(component.isAbsolute()).toBe(false);

    const reference = component.referenceRow();
    expect(reference?.name).toBe('Schulmittelwert');
    expect(reference?.cells.map((cell) => cell.value)).toEqual([42, 49, 80, 46, 52]);

    const rowElement = [...fixture.nativeElement.querySelectorAll('tbody tr')].find((tr) =>
      tr.textContent?.includes('Schulmittelwert'),
    ) as HTMLElement;
    expect(rowElement).not.toBeUndefined();

    const cells = [...rowElement.querySelectorAll('td.tba3-heatmap-cell')] as HTMLElement[];
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.every((cell) => cell.style.backgroundColor === '')).toBe(true);
  });

  it('blendet Vergleichszeile und -umschalter in der absoluten Ansicht aus', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_HEATMAP, { scale: ABSOLUTE });
    const component = fixture.componentInstance;
    expect(component.referenceRow()).toBeUndefined();
    expect(component.hasComparisonSwitch()).toBe(false);
    expect(fixture.nativeElement.querySelector('[aria-label="Vergleich"]')).toBeNull();
    // Die Vergleichsgruppen der Daten tauchen in der Tabelle nicht auf.
    const bodyRows = [...fixture.nativeElement.querySelectorAll('tbody tr')];
    expect(bodyRows.some((row: HTMLElement) => row.textContent?.includes('Schulmittelwert'))).toBe(
      false,
    );
  });

  it('wechselt „Zahlen anzeigen": keine, Vergleich und Klassenmittel, alle', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_HEATMAP);
    const component = fixture.componentInstance;
    const findRow = (text: string) =>
      [...fixture.nativeElement.querySelectorAll('tbody tr')].find((tr) =>
        tr.textContent?.includes(text),
      ) as HTMLElement;
    const visibleValue = (row: HTMLElement) =>
      row.querySelector('td.tba3-heatmap-cell span[aria-hidden]')?.textContent?.trim();

    expect(component.showReferenceValues()).toBe(true);
    expect(component.showAllValues()).toBe(false);
    expect(visibleValue(findRow('Klassenmittel'))).toBe('−12 Pp');
    expect(visibleValue(findRow('Schulmittelwert'))).toBe('42 %');
    expect(visibleValue(findRow('Ben Ulmer'))).toBeUndefined();

    component.setCellValues('none');
    fixture.detectChanges();
    expect(component.showReferenceValues()).toBe(false);
    expect(visibleValue(findRow('Klassenmittel'))).toBeUndefined();

    component.setCellValues('all');
    fixture.detectChanges();
    expect(component.showAllValues()).toBe(true);
    expect(visibleValue(findRow('Ben Ulmer'))).toBe('−22 Pp');
  });

  it('wählt die Vergleichsgruppe nur ab zwei Gruppen, ohne Option „keine"', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_HEATMAP);
    const component = fixture.componentInstance;
    expect(component.hasComparisonSwitch()).toBe(true);
    expect(component.comparisonOptions().map((option) => option.name)).toEqual([
      'Schulmittelwert',
      'Landesmittelwert',
    ]);
    // Startauswahl ist die erste Vergleichsgruppe der Antwort.
    expect(component.referenceRow()?.name).toBe('Schulmittelwert');

    const buttons = [
      ...fixture.nativeElement.querySelectorAll('[aria-label="Vergleich"] button'),
    ].map((button) => button.textContent?.trim());
    expect(buttons).toEqual(['Schulmittelwert', 'Landesmittelwert']);

    component.setComparison('state:state-average');
    fixture.detectChanges();
    expect(component.referenceRow()?.name).toBe('Landesmittelwert');
  });

  it('nutzt die einzige Vergleichsgruppe ohne Umschalter', () => {
    const single = create(WITHOUT_SCHOOL_COMPARISON);
    const component = single.componentInstance;
    expect(component.isAbsolute()).toBe(false);
    expect(component.hasComparisonSwitch()).toBe(false);
    expect(component.referenceRow()?.name).toBe('Landesmittelwert');
    expect(single.nativeElement.querySelector('[aria-label="Vergleich"]')).toBeNull();
  });

  it('zeigt relativ ohne Vergleichsgruppe nur den Hinweis statt der Heatmap', () => {
    const fixture = create(WITHOUT_ANY_COMPARISON);
    const component = fixture.componentInstance;
    expect(component.isAbsolute()).toBe(false);
    expect(component.needsComparison()).toBe(true);
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
    expect(fixture.nativeElement.querySelector('tba3-control-panel')).toBeNull();
    expect(fixture.nativeElement.querySelector('p.text-secondary')?.textContent?.trim()).toBe(
      'Keine Vergleichsgruppe für die relative Darstellung.',
    );
  });

  it('zeigt dieselben Daten absolut ohne den Vergleichs-Hinweis', () => {
    const fixture = create(WITHOUT_ANY_COMPARISON, { scale: ABSOLUTE });
    const component = fixture.componentInstance;
    expect(component.needsComparison()).toBe(false);
    expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
    expect(component.referenceRow()).toBeUndefined();
  });

  it('rendert im Leerzustand nur den Hinweis (leeres Array und Hauptgruppe ohne Aggregationen)', () => {
    const empty = create([]);
    expect(empty.componentInstance.hasData()).toBe(false);
    expect(empty.nativeElement.querySelector('table')).toBeNull();
    expect(empty.nativeElement.querySelector('p.text-secondary')?.textContent?.trim()).toBe(
      'Keine Daten für diese Darstellung.',
    );

    const withoutAggregations = create(FIXTURE_SOLUTION_RATES_HEATMAP_EMPTY);
    expect(withoutAggregations.componentInstance.hasData()).toBe(false);
    expect(withoutAggregations.nativeElement.querySelector('table')).toBeNull();
  });

  it('projiziert die Slots und zeigt sie auch im Leerzustand', () => {
    @Component({
      standalone: true,
      imports: [SolutionRatesHeatmapComponent],
      template: `<tba3-solution-rates-heatmap [aggregations]="data">
        <p tba3Header>Kopftext</p>
        <p tba3Footer>Fußtext</p>
      </tba3-solution-rates-heatmap>`,
    })
    class HostComponent {
      data: typeof FIXTURE_SOLUTION_RATES_HEATMAP_EMPTY = FIXTURE_SOLUTION_RATES_HEATMAP_EMPTY;
    }

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Kopftext');
    expect(text).toContain('Fußtext');
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
    expect(fixture.nativeElement.querySelector('tba3-control-panel')).toBeNull();
  });
});
