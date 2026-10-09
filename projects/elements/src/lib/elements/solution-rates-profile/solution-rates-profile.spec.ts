import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { SolutionRatesProfileComponent } from './solution-rates-profile';
import {
  EXAMPLE_PROFILE_COLUMNS_SCHOOL,
  FIXTURE_SOLUTION_RATES_PROFILE,
  FIXTURE_SOLUTION_RATES_PROFILE_COMPETENCE_TYPES,
  FIXTURE_SOLUTION_RATES_PROFILE_EMPTY,
  FIXTURE_SOLUTION_RATES_PROFILE_READING_STYLES,
  FIXTURE_SOLUTION_RATES_PROFILE_SCHOOL,
} from '../../../fixtures/solution-rates-profile';
import {
  FIXTURE_SCENARIO_SCHOOL_COMPETENCE,
  FIXTURE_SCENARIO_STATES_COMPETENCE,
} from '../../../fixtures/scenario';

function create(data: unknown, inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(SolutionRatesProfileComponent);
  fixture.componentRef.setInput('aggregations', data);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  return fixture;
}

describe('SolutionRatesProfileComponent', () => {
  it('gliedert die Zeilen nach Domäne in je einen Block mit Blockzeile', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_PROFILE);
    const component = fixture.componentInstance;

    const columns = component.columnViews();
    expect(columns.map((column) => column.key)).toEqual([
      'group:group-8a',
      'student:student-1',
      'student:student-2',
      'student:student-3',
      'student:student-4',
      'student:student-5',
      'student:student-6',
      'state:state-average',
    ]);
    expect(columns[0].role).toBe('main');
    expect(columns.slice(1, 7).every((column) => column.role === 'main')).toBe(true);
    expect(columns[7].role).toBe('comparison');
    expect(columns[7].firstComparison).toBe(true);

    const blocks = component.blocks();
    expect(blocks.map((block) => block.domain)).toEqual(['Lesen', 'Orthografie']);
    // Zwei Domänen: jede bekommt eine Blockzeile.
    expect(blocks.map((block) => block.headingParts)).toEqual([['Lesen'], ['Orthografie']]);
    expect(blocks[0].rows.length).toBe(4);

    const first = blocks[0].rows[0];
    expect(first.value).toBe('2.2.1');
    expect(first.code).toBe('2.2.1');
    expect(first.cells[0].text).toBe('73 %');
    expect(first.cells[1].text).toBe('100 %');
    expect(first.cells[7].text).toBe('70 %');

    // Zwei Blockzeilen als h4.h5.fw-semibold, genau ein Divider dazwischen.
    const headings = fixture.nativeElement.querySelectorAll('h4.h5.fw-semibold');
    expect([...headings].map((h: HTMLElement) => h.textContent?.trim())).toEqual([
      'Lesen',
      'Orthografie',
    ]);
    expect(fixture.nativeElement.querySelectorAll('hr.my-4').length).toBe(1);

    // Keine alten Tabellenklassen.
    const html = fixture.nativeElement.innerHTML as string;
    expect(html).toContain('table-striped');
    expect(html).not.toContain('border-primary');
    expect(html).not.toContain('font-monospace');
    expect(html).not.toContain('table-light');
  });

  it('färbt in der relativen Ansicht die Zellen nach dem Bezug', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_PROFILE);
    const component = fixture.componentInstance;
    expect(component.isRelative()).toBe(true);

    // Bezug ist die erste Vergleichsgruppe (Landesmittelwert), nicht die Hauptgruppe.
    const reading221 = component.blocks()[0].rows[0];
    // Hauptspalte 73 % gegen Bezug 70 %: +3 Pp, unterhalb der Schwelle 5 → neutral, Pfeil aufwärts.
    const main = reading221.cells[0].relative!;
    expect(main.colored).toBe(true);
    expect(main.color).toBe('var(--tba3-deviation-neutral)');
    expect(main.icon).toBe('fa-arrow-up');
    expect(main.ariaLabel).toBe('73 %, 3 Prozentpunkte über Landesmittelwert');

    // Elias Kranich 20 % gegen 70 %: −50 Pp → worse, Pfeil abwärts.
    const elias = reading221.cells[4].relative!;
    expect(elias.colored).toBe(true);
    expect(elias.color).toBe('var(--tba3-deviation-worse)');
    expect(elias.icon).toBe('fa-arrow-down');
    expect(elias.ariaLabel).toBe('20 %, 50 Prozentpunkte unter Landesmittelwert');

    // Relative Ansicht: keine Skala-Legende im DOM, aber gefärbte Δ-Pillen.
    expect(fixture.nativeElement.querySelector('ul[aria-label="Skala Lösungsquoten"]')).toBeNull();
    const html = fixture.nativeElement.innerHTML as string;
    expect(html).toContain('--tba3-deviation-');
  });

  it('zeigt in der relativen Ansicht eine Δ-Legende mit Bezugsname und Schwelle', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_PROFILE);
    const component = fixture.componentInstance;
    expect(component.referenceName()).toBe('Landesmittelwert');
    const legend = fixture.nativeElement.querySelector(
      'ul[aria-label="Skala Abweichung"]',
    ) as HTMLElement;
    expect(legend).not.toBeNull();
    expect(legend.textContent).toContain('Abweichung von Landesmittelwert');
    const texts = component.relativeLegend().map((item) => item.text);
    expect(texts).toEqual(['≥ 5 Pp darüber', '< 5 Pp Abstand', '≥ 5 Pp darunter']);
    const icons = [...legend.querySelectorAll('i')].map((icon) => icon.className);
    expect(icons.some((cls) => cls.includes('fa-arrow-up'))).toBe(true);
    expect(icons.some((cls) => cls.includes('fa-circle-dot'))).toBe(true);
    expect(icons.some((cls) => cls.includes('fa-arrow-down'))).toBe(true);
    // Dieselbe Pillenform wie die Zellen, Farben aus den Δ-Variablen.
    const pills = legend.querySelectorAll('span.badge.rounded-pill');
    expect(pills.length).toBe(3);
    expect(component.relativeLegend()[0].color).toBe('var(--tba3-deviation-better)');
    expect(component.relativeLegend()[2].color).toBe('var(--tba3-deviation-worse)');

    // Schwelle 0: jede Abweichung farbig, Texte nennen nur die Richtung.
    fixture.componentRef.setInput('scale', { mode: 'relative', threshold: 0 });
    fixture.detectChanges();
    expect(component.relativeLegend().map((item) => item.text)).toEqual([
      'darüber',
      'gleich',
      'darunter',
    ]);
  });

  it('lässt die Bezugsspalte in der relativen Ansicht ungefärbt', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_PROFILE);
    const component = fixture.componentInstance;

    const reference = component.blocks()[0].rows[0].cells[7].relative!;
    expect(reference.colored).toBe(false);
    expect(reference.color).toBe('');
    expect(reference.tint).toBe('');
    expect(reference.ariaLabel).toBe('70 %, Bezugswert');

    // Die Bezugsspalte erscheint als reiner Text, nicht als gefärbte Pille.
    const referenceCell = fixture.nativeElement.querySelectorAll(
      'tbody tr:first-child td',
    )[7] as HTMLElement;
    expect(referenceCell.querySelector('.badge')).toBeNull();
    expect(referenceCell.textContent?.trim()).toBe('70 %');
  });

  it('beachtet die relative Schwelle für die Färbung der Zellen', () => {
    // Schwelle 0: jede Abweichung ist farbig. 73 % gegen 70 % → +3 → better.
    const fixture = create(FIXTURE_SOLUTION_RATES_PROFILE, {
      scale: { mode: 'relative', threshold: 0 },
    });
    const main = fixture.componentInstance.blocks()[0].rows[0].cells[0].relative!;
    expect(main.color).toBe('var(--tba3-deviation-better)');

    // Große Schwelle: dieselbe Abweichung bleibt neutral, Pfeil und aria bleiben.
    const high = create(FIXTURE_SOLUTION_RATES_PROFILE, {
      scale: { mode: 'relative', threshold: 10 },
    });
    const stillNeutral = high.componentInstance.blocks()[0].rows[0].cells[0].relative!;
    expect(stillNeutral.color).toBe('var(--tba3-deviation-neutral)');
    expect(stillNeutral.icon).toBe('fa-arrow-up');
    expect(stillNeutral.ariaLabel).toBe('73 %, 3 Prozentpunkte über Landesmittelwert');
  });

  it('zeigt in der absoluten Ansicht die Skala-Legende mit fa-circle-dot', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_PROFILE, {
      scale: { mode: 'absolute', thresholds: [40, 55, 70] },
    });
    const component = fixture.componentInstance;
    expect(component.isRelative()).toBe(false);

    // Nur die Skala-Legende, ihr mittleres Stufensymbol ist fa-circle-dot.
    const legendList = fixture.nativeElement.querySelector('ul[aria-label="Skala Lösungsquoten"]');
    expect(legendList).not.toBeNull();
    expect(fixture.nativeElement.querySelector('ul[aria-label="Skala Abweichung"]')).toBeNull();
    const midPill = legendList.querySelectorAll('li tba3-scale-pill')[2] as HTMLElement;
    expect(midPill.querySelector('i.fa-circle-dot')).not.toBeNull();
    expect(midPill.textContent).not.toMatch(/[▼▲]/);
    expect(legendList.querySelector('i.fa-circle-dot')).not.toBeNull();

    // Lesen 2.3.4 group-8a = 67 % → mid.
    const mid = component.blocks()[0].rows[1].cells[0].absolute!;
    expect(mid.level).toBe('mid');
    expect(fixture.nativeElement.querySelector('tbody i.fa-circle-dot')).not.toBeNull();

    // Die relative Darstellung wird in diesem Modus nicht gebaut.
    expect(mid.level).toBe('mid');
    expect(component.blocks()[0].rows[1].cells[0].relative).toBeUndefined();
  });

  it('wählt den Modus über den scale-Input, nicht über einen Umschalter', () => {
    const relative = create(FIXTURE_SOLUTION_RATES_PROFILE);
    expect(relative.componentInstance.isRelative()).toBe(true);
    expect(
      relative.nativeElement.querySelector('ul[aria-label="Skala Abweichung"]'),
    ).not.toBeNull();
    // Kein Bezug-Umschalter im Bedienfeld.
    expect(relative.nativeElement.querySelector('[aria-label="Bezug"]')).toBeNull();

    const absolute = create(FIXTURE_SOLUTION_RATES_PROFILE, {
      scale: { mode: 'absolute', thresholds: [40, 55, 70] },
    });
    expect(absolute.componentInstance.isRelative()).toBe(false);
    expect(
      absolute.nativeElement.querySelector('ul[aria-label="Skala Lösungsquoten"]'),
    ).not.toBeNull();
    expect(absolute.nativeElement.querySelector('[aria-label="Bezug"]')).toBeNull();
  });

  it('ordnet Werte über die absolute Skala den vier Stufen zu', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_PROFILE, {
      scale: { mode: 'absolute', thresholds: [40, 55, 70] },
    });
    const component = fixture.componentInstance;
    const lesen = component.blocks()[0].rows;
    const ortho = component.blocks()[1].rows;

    // Klasse 8a Lesen 2.2.1 = 73 % → high ▲, erste main-Spalte hervorgehoben.
    const reading221 = lesen[0].cells[0].absolute!;
    expect(reading221.level).toBe('high');
    expect(reading221.emphasis).toBe(true);
    // Den Indikator rendert tba3-scale-pill aus der Stufe: die erste Zelle trägt ▲.
    expect(fixture.nativeElement.querySelector('tbody tba3-scale-pill')?.textContent).toContain(
      '▲',
    );
    // Klasse 8a Lesen 2.3.4 = 67 % → mid (fa-circle-dot, kein Textzeichen).
    expect(lesen[1].cells[0].absolute!.level).toBe('mid');

    // Orthografie 3.4.1: Klasse 8a 54 % → mid-low ▼, Landesmittelwert 55 % → mid (Grenzfall 55).
    const ortho341 = ortho.find((row) => row.value === '3.4.1');
    expect(ortho341?.cells[0].absolute!.level).toBe('mid-low');
    expect(ortho341?.cells[7].text).toBe('55 %');
    expect(ortho341?.cells[7].absolute!.level).toBe('mid');

    // Elias Kranich (Index 4) Lesen 2.2.1 = 20 % → low ▼▼, nicht hervorgehoben.
    const elias = lesen[0].cells[4].absolute!;
    expect(lesen[0].cells[4].text).toBe('20 %');
    expect(elias.level).toBe('low');
    expect(elias.emphasis).toBe(false);

    // Finn Falkenau (Index 6) Lesen 1.4.2 = 40 % → mid-low ▼ (Grenzfall 40, nicht low).
    const reading142 = lesen.find((row) => row.value === '1.4.2');
    expect(reading142?.cells[6].text).toBe('40 %');
    expect(reading142?.cells[6].absolute!.level).toBe('mid-low');
  });

  it('bildet die Skala-Legende aus den thresholds', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_PROFILE, {
      scale: { mode: 'absolute', thresholds: [50, 65, 80] },
    });
    const legendList = fixture.nativeElement.querySelector('ul[aria-label="Skala Lösungsquoten"]');
    expect(legendList).not.toBeNull();
    expect(legendList.textContent).toContain('Skala');
    const pills = [...legendList.querySelectorAll('li tba3-scale-pill')].map((pill) =>
      ((pill as HTMLElement).textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
    expect(pills).toEqual(['▼▼ < 50 %', '▼ 50–65 %', '65–80 %', '▲ ≥ 80 %']);
    expect(legendList.querySelector('i.fa-circle-dot')).not.toBeNull();
    expect(fixture.nativeElement.innerHTML).not.toContain('ms-auto');
  });

  it('setzt border-start an der ersten Vergleichsspalte', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_PROFILE_SCHOOL, {
      scale: { mode: 'absolute', thresholds: [40, 55, 70] },
      columns: EXAMPLE_PROFILE_COLUMNS_SCHOOL,
    });
    const component = fixture.componentInstance;

    // Schule und drei Klassen als Hauptspalten, Landesmittelwert und Vergleichsschulen als Vergleiche.
    const columns = component.columnViews();
    expect(columns.filter((column) => column.role === 'main').length).toBe(4);
    expect(columns.filter((column) => column.role === 'comparison').length).toBe(2);
    // Nur die erste Vergleichsspalte (Landesmittelwert) trägt die Trennlinie.
    expect(columns[4].firstComparison).toBe(true);
    expect(columns[5].firstComparison).toBe(false);
    expect(columns[0].firstComparison).toBe(false);

    const html = fixture.nativeElement.innerHTML as string;
    expect(html).toContain('border-start');
    // Absolut: nur die Skalenfarben färben die Pillen, keine Abweichungsfarben.
    expect(html).not.toContain('--tba3-deviation-');
    expect(html).toContain('--tba3-solution-rate-');
  });

  it('sortiert die Zeilen und beachtet defaultSort', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_PROFILE);
    const component = fixture.componentInstance;

    // Antwortreihenfolge.
    expect(component.blocks()[0].rows.map((row) => row.value)).toEqual([
      '2.2.1',
      '2.3.4',
      '1.4.3',
      '1.4.2',
    ]);

    // Klick auf die Hauptspalte sortiert aufsteigend nach ihrer Lösungsquote (73, 67, 75, 67).
    component.sort(0);
    fixture.detectChanges();
    expect(component.blocks()[0].rows.map((row) => row.value)).toEqual([
      '2.3.4',
      '1.4.2',
      '2.2.1',
      '1.4.3',
    ]);
    expect(component.ariaSort(0)).toBe('ascending');

    // defaultSort absteigend greift beim Aufbau.
    const withDefault = create(FIXTURE_SOLUTION_RATES_PROFILE, {
      defaultSort: { column: 0, direction: 'desc' },
    });
    expect(withDefault.componentInstance.ariaSort(0)).toBe('descending');
    expect(withDefault.componentInstance.blocks()[0].rows.map((row) => row.value)).toEqual([
      '1.4.3',
      '2.2.1',
      '2.3.4',
      '1.4.2',
    ]);
  });

  it('sortiert die Spalte „Teilkompetenz" nach der Kennung und ohne Link-Optik an den Köpfen', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_PROFILE);
    const component = fixture.componentInstance;
    const labelColumn = component.labelColumn;

    expect(component.ariaSort(labelColumn)).toBe('none');

    component.sort(labelColumn);
    fixture.detectChanges();
    expect(component.ariaSort(labelColumn)).toBe('ascending');

    // Sortierung nach der Kennung (code), nicht nach dem Klartext.
    expect(component.blocks()[0].rows.map((row) => row.code)).toEqual([
      '1.4.2',
      '1.4.3',
      '2.2.1',
      '2.3.4',
    ]);

    const labelHeaderButton = fixture.nativeElement.querySelector(
      'thead th:first-child button',
    ) as HTMLButtonElement;
    expect(labelHeaderButton.textContent?.trim()).toContain('Teilkompetenz');
    expect(labelHeaderButton.classList).toContain('text-reset');
    expect(labelHeaderButton.classList).toContain('fw-semibold');

    // Die Köpfe nutzen den Sortierkopf-Baustein (Label- und Wertspalten).
    expect(fixture.nativeElement.querySelectorAll('thead tba3-sort-header').length).toBeGreaterThan(
      0,
    );

    // Kein Wertkopf trägt Link-Optik; der Gruppenname ist das Sortierkopf-Label in Textfarbe.
    const head = fixture.nativeElement.querySelector('thead') as HTMLElement;
    expect(head.querySelector('.link-underline')).toBeNull();
    const valueHeaderButton = head.querySelectorAll(
      'th tba3-sort-header button',
    )[1] as HTMLButtonElement;
    expect(valueHeaderButton.classList).toContain('text-reset');
    expect(valueHeaderButton.textContent).toContain('Klasse 8a');
  });

  it('zeigt flach eine Tabelle über alle Domänen mit Domäne im Zeilenkopf', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_PROFILE, { view: 'flat' });
    const component = fixture.componentInstance;

    expect(component.isFlat()).toBe(true);
    const blocks = component.blocks();
    expect(blocks.length).toBe(1);
    expect(blocks[0].headingParts).toEqual([]);
    expect(blocks[0].rows.length).toBe(8);
    // Jede Zeile trägt ihre Domäne für die Sekundärinfo im Zeilenkopf.
    expect(blocks[0].rows.every((row) => row.domain === 'Lesen' || row.domain === 'Orthografie'));

    // Keine Blockzeile, kein Divider in der flachen Ansicht.
    expect(fixture.nativeElement.querySelector('h4')).toBeNull();
    expect(fixture.nativeElement.querySelector('hr')).toBeNull();
    // Die Domäne steht im Zeilenkopf.
    const rowHeader = fixture.nativeElement.querySelector('tbody th[scope="row"]') as HTMLElement;
    expect(rowHeader.textContent).toContain('Lesen');

    // Sortierung „Teilkompetenz" reiht über beide Domänen nach der Kennung.
    component.sort(component.labelColumn);
    fixture.detectChanges();
    expect(component.blocks()[0].rows.map((row) => row.code)).toEqual([
      '1.4.2',
      '1.4.3',
      '2.2.1',
      '2.3.4',
      '3.3.7',
      '3.4.1',
      '4.1.2',
      '4.2.3',
    ]);
  });

  it('bietet das Bedienfeld mit der Zeile „Ansicht" und dem Gliederungsumschalter', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_PROFILE);
    const panel = fixture.nativeElement.querySelector('tba3-control-panel') as HTMLElement;
    expect(panel).not.toBeNull();
    expect(panel.textContent).toContain('Ansicht');
    // Ein Heft: keine Filterzeile, kein leeres „Testheft"-Label.
    expect(panel.textContent).not.toContain('Testheft');
    // Kein Bezug-Umschalter mehr; der Modus ist ein fester Input.
    expect(panel.querySelector('[aria-label="Bezug"]')).toBeNull();

    const viewGroup = panel.querySelector('[aria-label="Gliederung"]') as HTMLElement;
    expect(viewGroup).not.toBeNull();
    const viewButtons = viewGroup.querySelectorAll('button');
    expect([...viewButtons].map((button) => button.textContent?.trim())).toEqual([
      'Nach Domäne',
      'Flach',
    ]);
    expect((viewButtons[0] as HTMLButtonElement).classList).toContain('active');

    // Die Zeile „Ansicht" benennt die Gruppe über aria-labelledby.
    const labelId = viewGroup.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    expect(panel.querySelector(`#${labelId}`)?.textContent?.trim()).toBe('Ansicht');
  });

  it('rendert die Zeilen über tba3-aggregation-value mit Klickziel', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_PROFILE);
    // Nach Domäne: zwei Tabellen (Lesen, Orthografie) mit je vier Zeilen.
    const rows = fixture.nativeElement.querySelectorAll(
      'tbody th[scope="row"] tba3-aggregation-value',
    );
    expect(rows.length).toBe(8);
    for (const value of rows) {
      expect(value.querySelector('button')).not.toBeNull();
    }
  });

  it('meldet die Zeilenauswahl und hat keinen columnSelected-Output', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_PROFILE);
    const component = fixture.componentInstance;
    let selectedRow: string | undefined;
    component.rowSelected.subscribe((value) => (selectedRow = value));

    const rowHeaderButton = fixture.nativeElement.querySelector(
      'tbody th[scope="row"] button',
    ) as HTMLButtonElement;
    rowHeaderButton.click();
    expect(selectedRow).toBe('competence.2.2.1');

    expect((component as unknown as Record<string, unknown>)['columnSelected']).toBeUndefined();
  });

  it('projiziert die Slots und rendert im Leerzustand nur die Slot-Inhalte', () => {
    @Component({
      standalone: true,
      imports: [SolutionRatesProfileComponent],
      template: `<tba3-solution-rates-profile [aggregations]="data">
        <p tba3Header>Kopftext</p>
        <p tba3Footer>Fußtext</p>
      </tba3-solution-rates-profile>`,
    })
    class HostComponent {
      data = FIXTURE_SOLUTION_RATES_PROFILE_EMPTY;
    }

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Kopftext');
    expect(text).toContain('Fußtext');
    // Leerzustand: keine Tabelle, kein Bedienfeld.
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
    expect(fixture.nativeElement.querySelector('tba3-control-panel')).toBeNull();
  });

  it('rendert nichts bei leerem Array und ohne Aggregationen', () => {
    const empty = create([]);
    expect(empty.componentInstance.hasRows()).toBe(false);
    expect(empty.nativeElement.querySelector('table')).toBeNull();

    const withoutAggregations = create(FIXTURE_SOLUTION_RATES_PROFILE_EMPTY);
    expect(withoutAggregations.componentInstance.blocks().length).toBe(0);
    expect(withoutAggregations.nativeElement.querySelector('table')).toBeNull();
  });

  it('weist in der relativen Ansicht ohne Vergleichsspalte auf den fehlenden Bezug hin', () => {
    // Die Lerngruppe trägt keinen Vergleich: relativ fehlt der Bezug für die Abweichung.
    const fixture = create(FIXTURE_SOLUTION_RATES_PROFILE_READING_STYLES);
    const component = fixture.componentInstance;
    expect(component.missingReference()).toBe(true);
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
    expect(fixture.nativeElement.querySelector('tba3-control-panel')).toBeNull();
    const hint = fixture.nativeElement.querySelector('p.text-secondary.mb-0') as HTMLElement;
    expect(hint?.textContent?.trim()).toBe('Keine Vergleichsgruppe für die relative Darstellung.');

    // Als absolute Skala braucht es keinen Bezug: die Tabelle erscheint.
    fixture.componentRef.setInput('scale', { mode: 'absolute', thresholds: [40, 55, 70] });
    fixture.detectChanges();
    expect(component.missingReference()).toBe(false);
    expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
  });

  it('bildet aus der Lieferform ohne Domäne Blöcke je Kompetenztyp mit Landesvergleich', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_PROFILE_COMPETENCE_TYPES);
    const component = fixture.componentInstance;

    // Ein Heft, kein Umschalter; zwei Spalten (Schule, Land als Vergleich).
    expect(component.hasBookletSwitch()).toBe(false);
    expect(component.columnViews().map((column) => column.name)).toEqual([
      'Gesamtschule Birkenmoor',
      'Beispielland',
    ]);
    expect(component.columnViews()[1].role).toBe('comparison');

    // Ohne Domäne wird jede Aggregationsart ein Block, in Antwortreihenfolge (Kompetenz, Domäne).
    expect(component.hasViewSwitch()).toBe(true);

    // Ohne Domäne heißt der Gruppieren-Knopf „Nach Kompetenztyp".
    expect(component.groupedViewLabel()).toBe('Nach Kompetenztyp');
    const groupButton = fixture.nativeElement.querySelector(
      '[aria-label="Gliederung"] button',
    ) as HTMLElement;
    expect(groupButton.textContent?.trim()).toBe('Nach Kompetenztyp');

    const blocks = component.blocks();
    expect(blocks.map((block) => block.headingParts)).toEqual([['Kompetenz'], ['Domäne']]);
    expect(blocks[0].rows.map((row) => row.value)).toEqual(['D1', 'D2', 'D3', 'D4']);
    expect(blocks[0].rows.map((row) => row.cells[0].text)).toEqual([
      '52 %',
      '55 %',
      '54 %',
      '55 %',
    ]);
    expect(blocks[0].rows.map((row) => row.cells[1].text)).toEqual([
      '59 %',
      '60 %',
      '59 %',
      '60 %',
    ]);

    // Bezug ist das Land (erste Vergleichsspalte): die Schulzelle wird relativ dazu gefärbt.
    const d1 = blocks[0].rows[0];
    expect(d1.cells[0].relative!.colored).toBe(true);
    expect(d1.cells[1].relative!.colored).toBe(false);

    // Zwei Blockzeilen als h4, ein Divider dazwischen.
    const headings = [...fixture.nativeElement.querySelectorAll('h4')].map((heading) =>
      (heading as HTMLElement).textContent?.trim(),
    );
    expect(headings).toEqual(['Kompetenz', 'Domäne']);
  });

  it('hält denselben Code in zwei Kompetenztypen getrennt, ohne Track-Kollision', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_PROFILE_READING_STYLES);
    const component = fixture.componentInstance;

    const blocks = component.blocks();
    expect(blocks.map((block) => block.headingParts)).toEqual([['Lesestil'], ['Hörstil']]);
    expect(blocks[0].rows.map((row) => [row.key, row.cells[0].text])).toEqual([
      ['Lesestil.detailliert', '62 %'],
      ['Lesestil.suchend', '71 %'],
    ]);
    expect(blocks[1].rows.map((row) => [row.key, row.cells[0].text])).toEqual([
      ['Hörstil.detailliert', '55 %'],
      ['Hörstil.selektiv', '64 %'],
    ]);

    // „detailliert" steht in beiden Blöcken, trägt aber je Art einen eigenen Track-Schlüssel.
    component.setView('flat');
    fixture.detectChanges();
    expect(component.blocks()[0].rows.map((row) => row.trackId)).toEqual([
      'type:Lesestil|Lesestil.detailliert',
      'type:Lesestil|Lesestil.suchend',
      'type:Hörstil|Hörstil.detailliert',
      'type:Hörstil|Hörstil.selektiv',
    ]);
  });

  it('setzt je Heft nur Spalten mit Werten zusammen und bildet Blöcke je Kompetenztyp', () => {
    const school = FIXTURE_SCENARIO_SCHOOL_COMPETENCE.filter((group) => group.type === 'school');
    const courses = FIXTURE_SCENARIO_SCHOOL_COMPETENCE.filter((group) => group.type === 'group');
    const state = FIXTURE_SCENARIO_STATES_COMPETENCE.filter((group) => group.type === 'state');
    const fixture = create([...school, ...courses, ...state]);
    const component = fixture.componentInstance;

    expect(component.hasBookletSwitch()).toBe(true);
    expect(component.bookletList()).toEqual(['DE-HSA', 'DE-MSA', 'MA-MSA']);

    // Heft DE-HSA: Kurse anderer Hefte erscheinen nicht als reine „–"-Spalten.
    expect(component.columnViews().map((column) => column.name)).toEqual([
      'Gesamtschule Birkenmoor',
      '8a Deutsch',
      'Beispielland',
    ]);
    expect(component.blocks().map((block) => block.headingParts)).toEqual([
      ['Kompetenz'],
      ['Domäne'],
    ]);
    const kompetenz = component.blocks()[0];
    expect(kompetenz.rows.map((row) => row.cells[0].text)).toEqual(['55 %', '49 %', '55 %']);
    // 8a Deutsch (Kurs) und Land tragen ihre eigenen Werte im selben Heft.
    expect(kompetenz.rows[0].cells[1].text).toBe('55 %');
    expect(kompetenz.rows[0].cells[2].text).toBe('57 %');

    // Heft DE-MSA: 8a Deutsch (DE-HSA) und 8a Mathematik (MA-MSA) fallen weg, 8b Deutsch kommt.
    component.setBooklet('DE-MSA');
    fixture.detectChanges();
    expect(component.columnViews().map((column) => column.name)).toEqual([
      'Gesamtschule Birkenmoor',
      '8b Deutsch',
      'Beispielland',
    ]);
    expect(component.blocks().map((block) => block.headingParts)).toEqual([
      ['Kompetenz'],
      ['Domäne'],
    ]);
    expect(component.blocks()[0].rows.map((row) => row.value)).toEqual(['D1', 'D2', 'D3', 'D4']);
  });
});

@Component({
  imports: [SolutionRatesProfileComponent],
  template: `<tba3-solution-rates-profile [aggregations]="data">
    <div tba3Header>Kopf-Slot</div>
    <div tba3Footer>Fuß-Slot</div>
  </tba3-solution-rates-profile>`,
})
class EmptyStateHost {
  data: typeof FIXTURE_SOLUTION_RATES_PROFILE = [];
}

describe('SolutionRatesProfileComponent Leerzustand', () => {
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
