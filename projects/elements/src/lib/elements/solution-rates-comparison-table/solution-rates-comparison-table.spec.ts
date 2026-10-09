import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { SolutionRatesComparisonTableComponent } from './solution-rates-comparison-table';
import {
  FIXTURE_SOLUTION_RATES_COMPARISON_TABLE,
  FIXTURE_SOLUTION_RATES_COMPARISON_TABLE_COMPETENCE_TYPES,
  FIXTURE_SOLUTION_RATES_COMPARISON_TABLE_EMPTY,
  FIXTURE_SOLUTION_RATES_COMPARISON_TABLE_READING_STYLES,
} from '../../../fixtures/solution-rates-comparison-table';
import { FIXTURE_SCENARIO_STATES_COMPETENCE } from '../../../fixtures/scenario';

function create(data: unknown, inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(SolutionRatesComparisonTableComponent);
  fixture.componentRef.setInput('aggregations', data);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  return fixture;
}

describe('SolutionRatesComparisonTableComponent', () => {
  it('bildet die Spaltenfolge und -köpfe und lässt die Schule aus', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_COMPARISON_TABLE);
    const component = fixture.componentInstance;

    expect(component.valueColumnViews().map((column) => column.name)).toEqual([
      'Schulamt Nordmark',
      'Landesmittelwert',
      'Durchgang 2025',
    ]);
    // Ohne deltas bildet die erste Vergleichsgruppe die einzige Δ-Spalte.
    expect(component.deltaColumnViews().map((column) => column.header)).toEqual([
      'Δ Landesmittelwert',
    ]);

    // Die Schule (feinerer Typ) ist Teilgruppe und erscheint nicht als Spalte oder Zeile.
    expect(
      component.valueColumnViews().some((column) => column.groupKey === 'school:school-birkenmoor'),
    ).toBe(false);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Teilkompetenz');
    expect(text).not.toContain('Birkenmoor');
    // Die Domäne steht in der Blockzeile, nicht im Tabellenkopf.
    const headText =
      (fixture.nativeElement.querySelector('thead') as HTMLElement).textContent ?? '';
    expect(headText).not.toContain('Domäne');

    // Jede Zeile hat drei Wert- und eine Δ-Zelle.
    const first = component.blocks()[0].rows[0];
    expect(first.valueCells.length).toBe(3);
    expect(first.deltaCells.length).toBe(1);
  });

  it('gruppiert nach Domäne mit Blockzeile, Divider und gestreifter Tabelle', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_COMPARISON_TABLE);
    const component = fixture.componentInstance;
    const el = fixture.nativeElement as HTMLElement;

    // Zwei Blöcke, nach Fach und Domäne sortiert: Lesen vor Orthografie.
    expect(component.blocks().map((block) => block.label.join(' · '))).toEqual([
      'Lesen',
      'Orthografie',
    ]);

    const headings = Array.from(el.querySelectorAll('h4.h5.fw-semibold')).map((node) =>
      node.textContent?.trim(),
    );
    expect(headings).toEqual(['Lesen', 'Orthografie']);

    // Zwei Tabellen mit gestreifter Klassenkette, dazwischen genau ein Divider.
    const tables = el.querySelectorAll('table.table.table-sm.table-striped.align-middle');
    expect(tables.length).toBe(2);
    expect(el.querySelectorAll('hr.my-4').length).toBe(1);
    expect(el.querySelector('thead tr.small.text-secondary.align-bottom')).not.toBeNull();

    // Die Köpfe (Teilkompetenz, Wertspalten, Δ-Spalten) nutzen den Sortierkopf-Baustein.
    expect(el.querySelectorAll('thead tba3-sort-header').length).toBeGreaterThan(0);

    // Standardsortierung aufsteigend nach dem ersten Δ, je Block.
    expect(component.blocks()[0].rows.map((row) => row.value)).toEqual([
      '2.2.1',
      '2.3.4',
      '1.4.2',
      '1.4.3',
    ]);
    expect(component.blocks()[1].rows.map((row) => row.value)).toEqual([
      '4.2.3',
      '3.4.1',
      '3.3.7',
      '4.1.2',
    ]);
    expect(component.ariaSort('delta:state:state-average')).toBe('ascending');
  });

  it('setzt die Δ-Abweichung aus deviation und zeigt eine Δ-Pille', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_COMPARISON_TABLE);
    const component = fixture.componentInstance;
    const rows = component.blocks().flatMap((block) => block.rows);
    const byValue = (value: string) => rows.find((row) => row.value === value);

    // 2.2.1: Schulamt 73, Land 78 → Δ −5, ungünstig, Pfeilrichtung.
    const worst = byValue('2.2.1');
    expect(worst?.deltaCells[0].deviation?.label).toBe('−5 Pp');
    expect(worst?.deltaCells[0].deviation?.direction).toBe('worse');

    // 2.3.4: Δ ±0 → neutral.
    const equal = byValue('2.3.4');
    expect(equal?.deltaCells[0].deviation?.label).toBe('±0 Pp');
    expect(equal?.deltaCells[0].deviation?.direction).toBe('neutral');

    // 1.4.3: Δ +7 → günstig.
    const best = byValue('1.4.3');
    expect(best?.deltaCells[0].deviation?.direction).toBe('better');

    // Werte der Hauptgruppe fett, kein text-secondary an Vergleichen.
    expect(worst?.valueCells[0].isMain).toBe(true);
    expect(worst?.valueCells[0].text).toBe('73 %');
    expect(worst?.valueCells[1].isMain).toBe(false);
    expect(worst?.valueCells[1].text).toBe('78 %');

    // Die Δ-Pille des Bausteins ist im DOM vorhanden.
    expect(fixture.nativeElement.querySelector('tba3-delta .badge.rounded-pill')).not.toBeNull();
  });

  it('zeigt Kennung und Name über tba3-aggregation-value', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_COMPARISON_TABLE);
    const value = fixture.nativeElement.querySelector(
      'tbody th[scope="row"] tba3-aggregation-value',
    ) as HTMLElement;
    expect(value).not.toBeNull();
    expect(value.textContent).toContain('2.2.1');
    expect(value.textContent).toContain('Lesetechniken und Lesestrategien anwenden');
    // In der byDomain-Ansicht steht die Domäne in der Blockzeile, nicht am Wert.
    expect(value.querySelector('.text-body-secondary')).toBeNull();
  });

  it('zeigt zwei Δ-Spalten in deltas-Reihenfolge und ein „–" für den fehlenden Vorjahreswert', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_COMPARISON_TABLE, {
      deltas: ['authority:year-2025', 'state:state-average'],
    });
    const component = fixture.componentInstance;

    expect(component.deltaColumnViews().map((column) => column.key)).toEqual([
      'delta:authority:year-2025',
      'delta:state:state-average',
    ]);

    // 4.2.3 (Orthografie) ohne Vorjahreswert: Δ-Zelle leer mit aria-label, bei Sortierung zuletzt.
    const orthografie = component.blocks().find((block) => block.label.join('') === 'Orthografie');
    const last = orthografie!.rows[orthografie!.rows.length - 1];
    expect(last.value).toBe('4.2.3');
    expect(last.deltaCells[0].deviation).toBeUndefined();
    expect(last.deltaCells[0].emptyLabel).toBe('Δ Durchgang 2025: ohne Wert');
    expect(component.ariaSort('delta:authority:year-2025')).toBe('ascending');
  });

  it('schaltet die Sortierung eines Kopfs im Dreiklick', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_COMPARISON_TABLE);
    const component = fixture.componentInstance;

    expect(component.ariaSort('competence')).toBe('none');
    component.sort('competence');
    fixture.detectChanges();
    expect(component.ariaSort('competence')).toBe('ascending');
    component.sort('competence');
    fixture.detectChanges();
    expect(component.ariaSort('competence')).toBe('descending');
    component.sort('competence');
    fixture.detectChanges();
    expect(component.ariaSort('competence')).toBe('none');
  });

  it('sortiert mit einer Sortierung alle Blöcke gleich', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_COMPARISON_TABLE, {
      defaultSort: { column: 'competence', direction: 'asc' },
    });
    const component = fixture.componentInstance;

    // Eine Sortierung nach Kennung wirkt in beiden Blöcken (je Block aufsteigend).
    expect(component.blocks()[0].rows.map((row) => row.value)).toEqual([
      '1.4.2',
      '1.4.3',
      '2.2.1',
      '2.3.4',
    ]);
    expect(component.blocks()[1].rows.map((row) => row.value)).toEqual([
      '3.3.7',
      '3.4.1',
      '4.1.2',
      '4.2.3',
    ]);
  });

  it('wechselt zwischen „Nach Domäne" und „Flach"', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_COMPARISON_TABLE);
    const component = fixture.componentInstance;
    const el = fixture.nativeElement as HTMLElement;

    // Umschalter erscheint, da zwei Domänen vorliegen.
    expect(component.hasViewSwitch()).toBe(true);
    expect(el.querySelector('[aria-label="Ansicht wählen"]')).not.toBeNull();

    // Nur ein Testheft: keine Filterzeile, kein leeres „Testheft"-Label im Bedienfeld.
    expect(component.hasBookletSwitch()).toBe(false);
    expect(el.querySelector('tba3-booklet-switch')).toBeNull();
    expect(el.textContent).not.toContain('Testheft');

    component.setView('flat');
    fixture.detectChanges();

    // Eine Tabelle über alle Domänen, keine Blockzeile.
    expect(component.blocks().length).toBe(1);
    expect(el.querySelectorAll('table').length).toBe(1);
    expect(el.querySelectorAll('h4.h5').length).toBe(0);
    // Die Domäne wandert als Sekundärinfo in die Zeile.
    const domainInfo = el.querySelector('tbody tba3-aggregation-value .text-body-secondary');
    expect(domainInfo?.textContent?.trim()).toMatch(/Lesen|Orthografie/);
  });

  it('meldet die Zeilenauswahl, die Wertköpfe sind reine Sortierköpfe', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_COMPARISON_TABLE);
    const component = fixture.componentInstance;
    let selectedRow: string | undefined;
    component.rowSelected.subscribe((value) => (selectedRow = value));

    const rowButton = fixture.nativeElement.querySelector(
      'tbody th[scope="row"] tba3-aggregation-value button',
    ) as HTMLButtonElement;
    rowButton.click();
    expect(selectedRow).toBe('competence.2.2.1');

    expect((component as unknown as Record<string, unknown>)['columnSelected']).toBeUndefined();

    // Die Wertspaltenköpfe sind reine Sortierköpfe: kein Namensbutton in Link-Optik.
    const head = fixture.nativeElement.querySelector('thead') as HTMLElement;
    expect(head.querySelector('.link-underline')).toBeNull();
    expect(head.querySelector('button.btn-link.link-underline')).toBeNull();
    // Der Wertkopf trägt den Gruppennamen als Sortierkopf-Label (text-reset).
    const valueHeaderButton = head.querySelectorAll(
      'th tba3-sort-header button',
    )[1] as HTMLButtonElement;
    expect(valueHeaderButton.classList).toContain('text-reset');
    expect(valueHeaderButton.textContent).toContain('Schulamt Nordmark');
  });

  it('rendert nichts bei leerem Array und ohne Aggregationen', () => {
    const empty = create([]);
    expect(empty.componentInstance.hasRows()).toBe(false);
    expect(empty.nativeElement.querySelector('table')).toBeNull();

    const withoutAggregations = create(FIXTURE_SOLUTION_RATES_COMPARISON_TABLE_EMPTY);
    expect(withoutAggregations.componentInstance.blocks().length).toBe(0);
    expect(withoutAggregations.nativeElement.querySelector('table')).toBeNull();
  });

  it('gliedert ohne Domäne je Kompetenztyp einen Block und beschriftet den Umschalter dazu', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_COMPARISON_TABLE_COMPETENCE_TYPES);
    const component = fixture.componentInstance;
    const el = fixture.nativeElement as HTMLElement;

    // Zwei domänenlose Blöcke je Aggregationsart, in Antwortreihenfolge.
    expect(component.blocks().map((block) => block.label.join(' · '))).toEqual([
      'Kompetenz',
      'Domäne',
    ]);
    expect(component.groupedViewLabel()).toBe('Nach Kompetenztyp');

    // Der Gruppieren-Knopf trägt den Kompetenztyp-Text statt „Nach Domäne".
    const groupButton = el.querySelector('[aria-label="Ansicht wählen"] button') as HTMLElement;
    expect(groupButton.textContent?.trim()).toBe('Nach Kompetenztyp');
    const headings = Array.from(el.querySelectorAll('h4.h5')).map((node) =>
      node.textContent?.trim(),
    );
    expect(headings).toEqual(['Kompetenz', 'Domäne']);

    // Spalten: Hauptgruppe und Land; ohne deltas die erste Vergleichsgruppe als Δ.
    expect(component.valueColumnViews().map((column) => column.name)).toEqual([
      'Schulamt Westerau',
      'Beispielland',
    ]);
    expect(component.deltaColumnViews().map((column) => column.header)).toEqual(['Δ Beispielland']);

    // Kompetenz-Block, aufsteigend nach Δ zum Land (D3 −2, D2 −1, D1 +4).
    const kompetenz = component.blocks()[0];
    expect(kompetenz.rows.map((row) => row.value)).toEqual(['D3', 'D2', 'D1']);
    expect(kompetenz.rows.map((row) => row.valueCells[0].text)).toEqual(['58 %', '62 %', '70 %']);
    expect(kompetenz.rows.map((row) => row.valueCells[1].text)).toEqual(['60 %', '63 %', '66 %']);
    expect(kompetenz.caption).toBe(
      'Lösungsquoten je Teilkompetenz, Kompetenz: Schulamt Westerau gegenüber Beispielland, sortierbar.',
    );

    // Domäne-Block, ebenfalls aufsteigend nach Δ (Orthografie −1, Lesen +1).
    const domaene = component.blocks()[1];
    expect(domaene.rows.map((row) => row.value)).toEqual(['Orthografie', 'Lesen']);
    expect(domaene.rows.map((row) => row.valueCells[0].text)).toEqual(['60 %', '64 %']);
  });

  it('nimmt bei gleicher Id das Schulamt als Hauptgruppe, filtert Spalten je Heft und schaltet Hefte', () => {
    // Schulamt Nordmark zuerst, dann Land und Schulamt Seeland als Vergleiche.
    const nordmark = FIXTURE_SCENARIO_STATES_COMPETENCE.filter(
      (group) => group.type === 'authority' && group.id === '7',
    );
    const land = FIXTURE_SCENARIO_STATES_COMPETENCE.filter((group) => group.type === 'state');
    const seeland = FIXTURE_SCENARIO_STATES_COMPETENCE.filter(
      (group) => group.type === 'authority' && group.id === '12',
    );
    const fixture = create([...nordmark, ...land, ...seeland], { deltas: ['state:7'] });
    const component = fixture.componentInstance;

    // Kollision 7/7: das Schulamt bleibt Hauptgruppe, das Land ist eine eigene Spalte.
    expect(component.valueColumnViews()[0].name).toBe('Schulamt Nordmark');
    expect(component.valueColumnViews()[0].isMain).toBe(true);
    expect(component.valueColumnViews().map((column) => column.groupKey)).toEqual([
      'authority:7',
      'state:7',
    ]);

    // Heft DE-HSA: Seeland trägt dieses Heft nicht und ergibt keine reine „–"-Spalte.
    expect(component.bookletList()).toEqual(['DE-HSA', 'DE-MSA', 'MA-MSA']);
    expect(component.hasBookletSwitch()).toBe(true);
    expect(component.valueColumnViews().map((column) => column.name)).toEqual([
      'Schulamt Nordmark',
      'Beispielland',
    ]);
    // `deltas` trifft das Land über seinen typgetrennten Schlüssel `state:7`.
    expect(component.deltaColumnViews().map((column) => column.header)).toEqual(['Δ Beispielland']);
    expect(component.blocks().map((block) => block.label.join(''))).toEqual([
      'Kompetenz',
      'Domäne',
    ]);

    // Heft MA-MSA: nun trägt auch Seeland Werte, die Arten wechseln zu Kompetenz und Leitidee.
    component.setBooklet('MA-MSA');
    fixture.detectChanges();
    expect(component.valueColumnViews().map((column) => column.name)).toEqual([
      'Schulamt Nordmark',
      'Beispielland',
      'Schulamt Seeland',
    ]);
    expect(component.blocks().map((block) => block.label.join(''))).toEqual([
      'Kompetenz',
      'Leitidee',
    ]);

    // Kompetenz-Block, aufsteigend nach Δ zum Land; je Zeile drei Wertspalten.
    const kompetenz = component.blocks()[0];
    expect(kompetenz.rows.map((row) => row.value)).toEqual(['K1', 'K2']);
    expect(kompetenz.rows[0].valueCells.map((cell) => cell.text)).toEqual(['54 %', '59 %', '59 %']);
    expect(kompetenz.rows[0].deltaCells[0].deviation?.direction).toBe('worse');

    // Leitidee-Block, aufsteigend nach Δ (L3 −10, L2 −5, L1 −4).
    const leitidee = component.blocks()[1];
    expect(leitidee.rows.map((row) => row.value)).toEqual(['L3', 'L2', 'L1']);
    expect(leitidee.rows.map((row) => row.valueCells[0].text)).toEqual(['49 %', '54 %', '56 %']);
  });

  it('wählt eine Δ-Spalte über den Schlüssel typ:id, nicht über den bloßen Namen', () => {
    const nordmark = FIXTURE_SCENARIO_STATES_COMPETENCE.filter(
      (group) => group.type === 'authority' && group.id === '7',
    );
    const land = FIXTURE_SCENARIO_STATES_COMPETENCE.filter((group) => group.type === 'state');

    // Über den Schlüssel `state:7` trifft `deltas` das Land.
    const byKey = create([...nordmark, ...land], { deltas: ['state:7'] });
    expect(byKey.componentInstance.deltaColumnViews().map((column) => column.key)).toEqual([
      'delta:state:7',
    ]);
    expect(byKey.componentInstance.deltaColumnViews()[0].header).toBe('Δ Beispielland');

    // Der bloße Name trifft keine Gruppe; dann gibt es keine Δ-Spalte.
    const byName = create([...nordmark, ...land], { deltas: ['Beispielland'] });
    expect(byName.componentInstance.deltaColumnViews()).toEqual([]);
  });

  it('hält denselben Code in zwei Kompetenztypen getrennt, auch in der flachen Ansicht', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_COMPARISON_TABLE_READING_STYLES);
    const component = fixture.componentInstance;

    expect(component.blocks().map((block) => block.label.join(''))).toEqual([
      'Lesestil',
      'Hörstil',
    ]);
    const lesestil = component.blocks()[0];
    const hoerstil = component.blocks()[1];
    expect(lesestil.rows.map((row) => [row.rowKey, row.valueCells[0].text])).toEqual([
      ['Lesestil.detailliert', '62 %'],
      ['Lesestil.suchend', '71 %'],
    ]);
    expect(hoerstil.rows.map((row) => [row.rowKey, row.valueCells[0].text])).toEqual([
      ['Hörstil.detailliert', '55 %'],
      ['Hörstil.selektiv', '64 %'],
    ]);

    // Flache Ansicht: „detailliert" erscheint zweimal, mit getrenntem Schlüssel und der Art als Info.
    component.setView('flat');
    fixture.detectChanges();
    const detailed = component.blocks()[0].rows.filter((row) => row.value === 'detailliert');
    expect(detailed.map((row) => row.rowKey).sort()).toEqual([
      'Hörstil.detailliert',
      'Lesestil.detailliert',
    ]);
    expect(detailed.map((row) => row.secondary).sort()).toEqual(['Hörstil', 'Lesestil']);
    const info = fixture.nativeElement.querySelectorAll(
      'tbody tba3-aggregation-value .text-body-secondary',
    );
    expect(info.length).toBeGreaterThan(0);
  });
});

@Component({
  imports: [SolutionRatesComparisonTableComponent],
  template: `<tba3-solution-rates-comparison-table [aggregations]="data">
    <div tba3Header>Kopfzeile</div>
    <div tba3Footer>Fußzeile</div>
  </tba3-solution-rates-comparison-table>`,
})
class SlotHostComponent {
  readonly data = FIXTURE_SOLUTION_RATES_COMPARISON_TABLE;
}

@Component({
  imports: [SolutionRatesComparisonTableComponent],
  template: `<tba3-solution-rates-comparison-table [aggregations]="data">
    <div tba3Header>Kopfzeile</div>
    <div tba3Footer>Fußzeile</div>
  </tba3-solution-rates-comparison-table>`,
})
class EmptyHostComponent {
  readonly data: typeof FIXTURE_SOLUTION_RATES_COMPARISON_TABLE = [];
}

describe('SolutionRatesComparisonTableComponent Slots', () => {
  it('projiziert Header- und Footer-Slot', () => {
    const fixture = TestBed.createComponent(SlotHostComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Kopfzeile');
    expect(text).toContain('Fußzeile');
    expect(fixture.nativeElement.querySelector('tba3-control-panel')).not.toBeNull();
  });

  it('rendert im Leerzustand nur den Hinweis und die Slots', () => {
    const fixture = TestBed.createComponent(EmptyHostComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const hint = root.querySelector('p.text-secondary.mb-0');
    expect(hint?.textContent?.trim()).toBe('Keine Daten für diese Darstellung.');
    expect(root.textContent).toContain('Kopfzeile');
    expect(root.textContent).toContain('Fußzeile');
    expect(root.querySelector('table')).toBeNull();
    expect(root.querySelector('tba3-control-panel')).toBeNull();
  });
});
