import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxEchartsDirective } from 'ngx-echarts';
import { beforeEach, describe, expect, it } from 'vitest';
import { CompetenceLevelsComparisonComponent } from './competence-levels-comparison';
import {
  FIXTURE_COMPETENCE_LEVELS_COMPARISON,
  FIXTURE_COMPETENCE_LEVELS_COMPARISON_DIFFERENT_SETS,
  FIXTURE_COMPETENCE_LEVELS_COMPARISON_EMPTY,
  FIXTURE_COMPETENCE_LEVELS_COMPARISON_ID_COLLISION,
  FIXTURE_COMPETENCE_LEVELS_COMPARISON_MIXED_SETS,
  FIXTURE_COMPETENCE_LEVELS_COMPARISON_WITH_YEAR,
} from '../../../fixtures/competence-levels-comparison';
import {
  FIXTURE_SCENARIO_SCHOOL_COMPETENCE_LEVELS,
  FIXTURE_SCENARIO_STATE_COMPETENCE_LEVELS,
} from '../../../fixtures/scenario';

// jsdom hat keinen Canvas für ECharts.
@Directive({ selector: '[echarts]', standalone: true })
class StubEchartsDirective {
  readonly options = input<unknown>();
}

@Component({
  standalone: true,
  imports: [CompetenceLevelsComparisonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tba3-competence-levels-comparison [competenceLevels]="data">
    <h2 tba3Header>Kopf des Berichts</h2>
    <p tba3Footer>Fußnote des Berichts</p>
  </tba3-competence-levels-comparison>`,
})
class SlotHostComponent {
  readonly data = FIXTURE_COMPETENCE_LEVELS_COMPARISON;
}

function create(data: unknown, inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(CompetenceLevelsComparisonComponent);
  fixture.componentRef.setInput('competenceLevels', data);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  return fixture;
}

function pickerOptionNames(fixture: { nativeElement: HTMLElement }): string[] {
  return Array.from(
    fixture.nativeElement.querySelectorAll('tba3-comparison-picker button.rounded-pill'),
  ).map((element) => element.textContent?.trim() ?? '');
}

function viewButton(
  fixture: { nativeElement: HTMLElement },
  text: string,
): HTMLButtonElement | undefined {
  return Array.from(
    fixture.nativeElement.querySelectorAll<HTMLButtonElement>('[aria-label="Ansicht"] button'),
  ).find((button) => button.textContent?.trim() === text);
}

describe('CompetenceLevelsComparisonComponent', () => {
  beforeEach(() => {
    TestBed.overrideComponent(CompetenceLevelsComparisonComponent, {
      remove: { imports: [NgxEchartsDirective] },
      add: { imports: [StubEchartsDirective] },
    });
  });

  it('zeigt ohne Startauswahl je Domäne einen Block mit nur der Hauptgruppe', () => {
    const fixture = create(FIXTURE_COMPETENCE_LEVELS_COMPARISON);
    const component = fixture.componentInstance;
    const blocks = component.blocks();

    expect(blocks.map((block) => block.domain)).toEqual(['Lesen', 'Orthografie']);
    expect(blocks.map((block) => block.labelParts)).toEqual([['Lesen'], ['Orthografie']]);
    expect(fixture.nativeElement.textContent).toContain('Lesen');
    expect(fixture.nativeElement.textContent).toContain('Orthografie');

    for (const block of blocks) {
      expect(block.bars.length).toBe(1);
      expect(block.byLevel).toBe(true);
    }
    expect(blocks[0].bars[0].percentages).toEqual([4, 8, 17, 38, 25, 8]);
    expect(blocks[1].bars[0].percentages).toEqual([8, 13, 21, 33, 17, 8]);
  });

  it('blendet die Startauswahl ein', () => {
    const fixture = create(FIXTURE_COMPETENCE_LEVELS_COMPARISON, {
      comparisons: ['state:state-average'],
    });
    const component = fixture.componentInstance;
    const blocks = component.blocks();

    for (const block of blocks) {
      expect(block.bars.length).toBe(2);
      expect(block.bars[1].name).toBe('Landesmittelwert');
    }
    expect(blocks[0].bars[1].percentages).toEqual([7, 10, 18, 30, 22, 13]);
    expect(blocks[1].bars[1].percentages).toEqual([8, 11, 19, 30, 20, 12]);

    expect(pickerOptionNames(fixture)).toEqual(['Schule', 'Landesmittelwert', '8b', '8c']);
    expect(fixture.nativeElement.querySelector('tba3-comparison-picker p')).toBeNull();
  });

  it('rendert den Picker als Chip-Zeile ohne Zwischenüberschriften', () => {
    const fixture = create(FIXTURE_COMPETENCE_LEVELS_COMPARISON);
    expect(fixture.nativeElement.querySelector('tba3-comparison-picker p')).toBeNull();
    expect(
      fixture.nativeElement.querySelectorAll('tba3-comparison-picker .d-flex.flex-wrap').length,
    ).toBe(1);
    expect(pickerOptionNames(fixture).length).toBe(4);
  });

  it('blendet eine Vergleichsgruppe per Chip ein', () => {
    const fixture = create(FIXTURE_COMPETENCE_LEVELS_COMPARISON, {
      comparisons: ['state:state-average'],
    });
    const component = fixture.componentInstance;
    component.selectedKeys.set(['state:state-average', 'group:group-8b']);
    fixture.detectChanges();

    const block = component.blocks()[0];
    expect(block.bars.length).toBe(3);
    expect(block.bars.map((bar) => bar.name)).toEqual(['8a', 'Landesmittelwert', '8b']);
    expect(block.bars[2].percentages).toEqual([5, 5, 15, 35, 25, 15]);
  });

  it('stapelt gemischte Sets nach Classification', () => {
    const fixture = create(FIXTURE_COMPETENCE_LEVELS_COMPARISON_MIXED_SETS, {
      comparisons: ['state:state-average'],
    });
    const block = fixture.componentInstance.blocks()[0];

    expect(block.byLevel).toBe(false);
    expect(block.segments.length).toBe(5);
    expect(block.bars[0].percentages).toEqual([17, 21, 29, 25, 8]);
    expect(block.bars[1].percentages).toEqual([10, 18, 32, 25, 15]);
  });

  it('stapelt verschiedene Einzelsets nach Classification, ohne Vergleich nach Stufen', () => {
    // Mit eingeblendetem Landesmittelwert: verschiedene Stufenfolgen, also nach Classification.
    const withComparison = create(FIXTURE_COMPETENCE_LEVELS_COMPARISON_DIFFERENT_SETS, {
      comparisons: ['state:state-average'],
    });
    const component = withComparison.componentInstance;
    const cmpBlock = component.blocks()[0];
    expect(cmpBlock.byLevel).toBe(false);
    expect(cmpBlock.segments.length).toBe(5);
    expect(cmpBlock.bars[0].percentages).toEqual([13, 17, 38, 25, 8]);
    expect(cmpBlock.bars[1].percentages).toEqual([10, 18, 32, 25, 15]);

    // Ohne eingeblendete Vergleichsgruppe: nur die Hauptgruppe mit ihrem einen Set, nach Stufen.
    const soloBlock = create(
      FIXTURE_COMPETENCE_LEVELS_COMPARISON_DIFFERENT_SETS,
    ).componentInstance.blocks()[0];
    expect(soloBlock.byLevel).toBe(true);
    expect(soloBlock.segments.length).toBe(6);
    expect(soloBlock.bars[0].percentages).toEqual([4, 8, 17, 38, 25, 8]);

    // Ausblenden schaltet die Domäne von Classifications zurück auf Stufen.
    component.selectedKeys.set([]);
    withComparison.detectChanges();
    const toggledBlock = component.blocks()[0];
    expect(toggledBlock.byLevel).toBe(true);
    expect(toggledBlock.segments.length).toBe(6);
    expect(toggledBlock.bars.length).toBe(1);
  });

  it('zeigt den Jahresvergleich als normale Option', () => {
    const fixture = create(FIXTURE_COMPETENCE_LEVELS_COMPARISON_WITH_YEAR);
    expect(pickerOptionNames(fixture)).toContain('Durchgang 2024');
  });

  it('zeigt bei nur einer Domäne keine Blockzeile', () => {
    const fixture = create(FIXTURE_COMPETENCE_LEVELS_COMPARISON_WITH_YEAR);
    expect(fixture.componentInstance.blocks().length).toBe(1);
    expect(fixture.componentInstance.blocks()[0].labelParts).toEqual([]);
    expect(fixture.nativeElement.querySelector('h4')).toBeNull();
  });

  it('deaktiviert „Differenz" ohne eingeblendeten Vergleich', () => {
    const withoutSelection = create(FIXTURE_COMPETENCE_LEVELS_COMPARISON);
    expect(viewButton(withoutSelection, 'Differenz')?.disabled).toBe(true);
    expect(withoutSelection.componentInstance.effectiveDifferenceView()).toBe(false);

    const withSelection = create(FIXTURE_COMPETENCE_LEVELS_COMPARISON, {
      comparisons: ['state:state-average'],
    });
    expect(viewButton(withSelection, 'Differenz')?.disabled).toBe(false);

    // Alle Chips abwählen schaltet die wirksame Ansicht auf die Verteilung zurück.
    withSelection.componentInstance.showDifference();
    withSelection.detectChanges();
    expect(withSelection.componentInstance.effectiveDifferenceView()).toBe(true);
    withSelection.componentInstance.selectedKeys.set([]);
    withSelection.detectChanges();
    expect(withSelection.componentInstance.effectiveDifferenceView()).toBe(false);
  });

  it('liefert Differenzzeilen als Δ-Texte für die Screenreadertabelle', () => {
    const block = create(FIXTURE_COMPETENCE_LEVELS_COMPARISON, {
      comparisons: ['state:state-average'],
    }).componentInstance.blocks()[0];
    expect(block.differenceRows.length).toBe(1);
    expect(block.differenceRows[0].label).toBe('8a gegenüber Landesmittelwert');
    // Δ = 8a minus Landesmittelwert je Segment, formatiert über deviation() (U+2212 als Minus).
    expect(block.differenceRows[0].cells).toEqual([
      '−3 Pp',
      '−2 Pp',
      '−1 Pp',
      '+8 Pp',
      '+3 Pp',
      '−5 Pp',
    ]);
    expect(block.differenceChart).not.toBeNull();
  });

  it('gibt jedem Segment eine Kontrast-Labelfarbe und Classification', () => {
    const block = create(FIXTURE_COMPETENCE_LEVELS_COMPARISON).componentInstance.blocks()[0];
    expect(block.segments.every((segment) => segment.labelColor.length > 0)).toBe(true);
    expect(block.segments[0].classification).toBe('unter Mindeststandard');
  });

  it('setzt am Stapel-Chart die Prozentachse ohne ECharts-Legende', () => {
    const block = create(FIXTURE_COMPETENCE_LEVELS_COMPARISON).componentInstance.blocks()[0];
    const chart = block.stackedChart as {
      legend?: unknown;
      grid: { bottom: number };
      yAxis: { axisLabel: { formatter: string }; splitLine: unknown };
    };
    expect(chart.legend).toBeUndefined();
    expect(chart.grid.bottom).toBe(40);
    expect(chart.yAxis.axisLabel.formatter).toBe('{value} %');
    expect(chart.yAxis.splitLine).toBeDefined();
  });

  it('transponiert die Differenzansicht und beschriftet Δ aus deviation()', () => {
    const block = create(FIXTURE_COMPETENCE_LEVELS_COMPARISON, {
      comparisons: ['state:state-average'],
    }).componentInstance.blocks()[0];
    const chart = block.differenceChart as {
      legend?: unknown;
      xAxis: { data: string[] };
      series: { name: string; data: { value: number; label: { formatter: string } }[] }[];
    };
    expect(chart.legend).toBeUndefined();
    expect(chart.xAxis.data).toEqual(['8a gegenüber Landesmittelwert']);
    // Je Stufe eine Serie in Segmentreihenfolge.
    expect(chart.series.map((serie) => serie.name)).toEqual(block.segments.map((s) => s.label));
    // Wert = 8a − Landesmittelwert je Stufe (eine Kategorie).
    expect(chart.series.map((serie) => serie.data[0].value)).toEqual([-3, -2, -1, 8, 3, -5]);
    // Glyphe aus dem Vorzeichen, Text aus deviation().label.
    expect(chart.series[3].data[0].label.formatter).toBe('▲ +8 Pp');
    expect(chart.series[0].data[0].label.formatter).toBe('▼ −3 Pp');
    expect(chart.series[2].data[0].label.formatter).toBe('▼ −1 Pp');
  });

  it('färbt Δ-Labels erst ab der Schwelle, Schwelle 0 färbt jede Abweichung', () => {
    type Chart = { series: { data: { value: number; label: { color: string } }[] }[] };
    // jsdom kennt die Theme-Variablen nicht.
    const root = document.documentElement.style;
    root.setProperty('--tba3-deviation-better', '#0b0');
    root.setProperty('--tba3-deviation-worse', '#b00');
    root.setProperty('--tba3-deviation-neutral', '#888');
    const colorsFor = (deviationThreshold: number) => {
      const block = create(FIXTURE_COMPETENCE_LEVELS_COMPARISON, {
        comparisons: ['state:state-average'],
        deviationThreshold,
      }).componentInstance.blocks()[0];
      return (block.differenceChart as Chart).series.map((serie) => serie.data[0].label.color);
    };
    // Werte je Stufe: −3, −2, −1, +8, +3, −5.
    const strict = colorsFor(5);
    // Unter der Schwelle neutral, ab der Schwelle die Richtungsfarbe.
    expect([0, 1, 2, 4].map((i) => strict[i])).toEqual(['#888', '#888', '#888', '#888']);
    expect(strict[3]).not.toBe('#888');
    expect(strict[5]).not.toBe('#888');
    // Schwelle 0: jede Abweichung farbig, beide Richtungen kommen vor.
    const loose = colorsFor(0);
    expect(loose).not.toContain('#888');
    expect(new Set(loose)).toEqual(new Set(['#0b0', '#b00']));
    for (const name of ['better', 'worse', 'neutral']) {
      root.removeProperty(`--tba3-deviation-${name}`);
    }
  });

  it('rendert Screenreader-Tabellen mit caption und Kopfzellen', () => {
    const fixture = create(FIXTURE_COMPETENCE_LEVELS_COMPARISON, {
      comparisons: ['state:state-average'],
    });

    // Verteilungsansicht: figure mit aria-label und Tabelle Gruppe | n | Segmente.
    const figure = fixture.nativeElement.querySelector('figure');
    expect(figure?.getAttribute('aria-label')).toBe('Verteilung der Kompetenzstufen, Lesen');
    const table = figure?.querySelector('table');
    expect(table?.querySelector('caption')?.textContent?.trim()).toContain('Verteilung');
    expect(table?.querySelector('th[scope="col"]')?.textContent?.trim()).toBe('Gruppe');
    expect(table?.querySelector('tbody th[scope="row"]')?.textContent?.trim()).toBe('8a');

    // Differenzansicht: figure mit passendem aria-label und dieselben Δ-Texte wie das Diagramm.
    fixture.componentInstance.showDifference();
    fixture.detectChanges();
    const diffFigure: HTMLElement = fixture.nativeElement.querySelector('figure');
    expect(diffFigure.getAttribute('aria-label')).toBe('Differenz in Prozentpunkten, Lesen');
    const diffRow: HTMLElement = diffFigure.querySelector('tbody tr')!;
    expect(diffRow.querySelector('th[scope="row"]')?.textContent?.trim()).toBe(
      '8a gegenüber Landesmittelwert',
    );
    const cells = Array.from(diffRow.querySelectorAll('td')).map((cell) =>
      cell.textContent?.trim(),
    );
    expect(cells).toEqual(['−3 Pp', '−2 Pp', '−1 Pp', '+8 Pp', '+3 Pp', '−5 Pp']);
  });

  it('legt einen Divider nur zwischen die Blöcke, nicht nach dem letzten', () => {
    const fixture = create(FIXTURE_COMPETENCE_LEVELS_COMPARISON);
    expect(fixture.nativeElement.querySelectorAll('section').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('hr').length).toBe(1);
  });

  it('projiziert Header- und Footer-Slot', () => {
    const fixture = TestBed.createComponent(SlotHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Kopf des Berichts');
    expect(fixture.nativeElement.textContent).toContain('Fußnote des Berichts');
  });

  it('rendert nichts bei leerem Array und ohne verwertbare Verteilung', () => {
    expect(create([]).componentInstance.blocks().length).toBe(0);
    expect(
      create(FIXTURE_COMPETENCE_LEVELS_COMPARISON_EMPTY).componentInstance.blocks().length,
    ).toBe(0);
  });
});

// Aus zwei Abrufen zusammengesetzt: Schule mit Vergleichsschulen, dahinter das Land.
describe('CompetenceLevelsComparisonComponent Backend-Format', () => {
  beforeEach(() => {
    TestBed.overrideComponent(CompetenceLevelsComparisonComponent, {
      remove: { imports: [NgxEchartsDirective] },
      add: { imports: [StubEchartsDirective] },
    });
  });

  function composeScenario() {
    return [
      ...FIXTURE_SCENARIO_SCHOOL_COMPETENCE_LEVELS.filter(
        (group) => group.type === 'school' || group.type === 'comparisonSchool',
      ),
      ...FIXTURE_SCENARIO_STATE_COMPETENCE_LEVELS,
    ];
  }

  it('bietet Vergleichsschulen und Land als Vergleiche an, der Chip trägt den Gruppennamen', () => {
    const fixture = create(composeScenario());
    const component = fixture.componentInstance;

    // Hauptgruppe ist die Schule; Vergleichsschulen und Land sind wählbare Vergleiche.
    expect(component.blocks()[0].bars[0].name).toBe('Gesamtschule Birkenmoor');
    expect(component.availableComparisons().map((group) => group.name)).toEqual([
      'Vergleichsschulen',
      'Beispielland',
    ]);
    expect(pickerOptionNames(fixture)).toEqual(['Vergleichsschulen', 'Beispielland']);
  });

  it('trifft den Vergleich über den Schlüssel typ:id (comparisonSchool ohne id, state:7)', () => {
    // Die Vergleichsschulen tragen keine id, ihr Schlüssel ist `comparisonSchool:<name>`.
    const bySchools = create(composeScenario(), {
      comparisons: ['comparisonSchool:Vergleichsschulen'],
    });
    expect(bySchools.componentInstance.selectedKeys()).toEqual([
      'comparisonSchool:Vergleichsschulen',
    ]);
    const bySchoolsBlock = bySchools.componentInstance.blocks()[0];
    expect(bySchoolsBlock.bars.length).toBe(2);
    expect(bySchoolsBlock.bars[1].name).toBe('Vergleichsschulen');

    // Das Land trägt die id „7": der Schlüssel ist `state:7`, die bloße id trifft nicht.
    const byId = create(composeScenario(), { comparisons: ['state:7'] });
    expect(byId.componentInstance.selectedKeys()).toEqual(['state:7']);
    expect(byId.componentInstance.blocks()[0].bars[1].name).toBe('Beispielland');

    const byBareId = create(composeScenario(), { comparisons: ['7'] });
    expect(byBareId.componentInstance.selectedKeys()).toEqual([]);
  });

  it('stapelt Deutsch nach Classifications (zwei Sets), Mathematik nach Stufen (ein Set)', () => {
    const fixture = create(composeScenario(), {
      comparisons: ['comparisonSchool:Vergleichsschulen', 'state:7'],
    });
    const blocks = fixture.componentInstance.blocks();
    expect(blocks.map((block) => block.domain)).toEqual(['Lesen', 'Orthografie', 'Mathematik']);

    // Deutsch (zwei Sets): Classification-Modus mit fünf Segmenten, drei Säulen.
    const lesen = blocks[0];
    expect(lesen.byLevel).toBe(false);
    expect(lesen.segments.map((segment) => segment.label)).toEqual([
      'unter Mindeststandard',
      'Mindeststandard',
      'Regelstandard',
      'Regelstandard plus',
      'Optimalstandard',
    ]);
    expect(lesen.bars.length).toBe(3);
    // Schule Lesen HSA+MSA zusammengefasst (n 45): 4/14/17/9/1 → gerundete Prozente.
    expect(lesen.bars[0].percentages).toEqual([9, 31, 38, 20, 2]);

    // Mathematik (ein Set, gleiche Stufenfolge bei Schule, Vergleichsschulen und Land): Stufenmodus.
    const mathe = blocks[2];
    expect(mathe.byLevel).toBe(true);
    expect(mathe.segments.map((segment) => segment.label)).toEqual([
      'Ia',
      'Ib',
      'II',
      'III',
      'IV',
      'V',
    ]);
    expect(mathe.bars.length).toBe(3);
    expect(mathe.bars[0].percentages).toEqual([0, 22, 30, 26, 22, 0]);
  });

  it('erkennt „Regelstandard plus" an Farbe und Wertung trotz Schreibweise', () => {
    // jsdom kennt die Theme-Variablen nicht.
    const root = document.documentElement.style;
    root.setProperty('--tba3-classification-regular-plus', '#abc123');
    root.setProperty('--tba3-classification-unknown', '#999999');

    const lesen = create(composeScenario()).componentInstance.blocks()[0];
    const regularPlus = lesen.segments.find((segment) => segment.label === 'Regelstandard plus');
    // Nicht die Unbekannt-Farbe: „Regelstandard plus" ist als Classification erkannt.
    expect(regularPlus?.color).toBe('#abc123');

    // „unter Mindeststandard" wertet umgekehrt, auch in abweichender Schreibweise.
    const mathe = create(composeScenario()).componentInstance.blocks()[2];
    expect(mathe.segments[0].higherIsWorse).toBe(true);
    expect(mathe.segments[4].higherIsWorse).toBe(false);

    root.removeProperty('--tba3-classification-regular-plus');
    root.removeProperty('--tba3-classification-unknown');
  });

  it('mischt kollidierende numerische Ids nicht in die Hauptgruppe (Schulamt 7 gegen Land 7)', () => {
    const fixture = create(FIXTURE_COMPETENCE_LEVELS_COMPARISON_ID_COLLISION);
    const component = fixture.componentInstance;

    // Hauptgruppe ist das Schulamt, das Land bleibt eine eigene Vergleichsgruppe mit Typpräfix.
    const block = component.blocks()[0];
    expect(block.bars[0].name).toBe('Schulamt Nordmark');
    // Nicht vermischt: der Nenner bleibt das Schulamt (100), nicht Schulamt plus Land (1100).
    expect(block.bars[0].total).toBe(100);
    expect(component.availableComparisons().map((group) => group.key)).toEqual(['state:7']);

    // Die bloße id „7" ist mehrdeutig und trifft keine Gruppe.
    const byId = create(FIXTURE_COMPETENCE_LEVELS_COMPARISON_ID_COLLISION, { comparisons: ['7'] });
    expect(byId.componentInstance.selectedKeys()).toEqual([]);
    expect(byId.componentInstance.blocks()[0].bars.length).toBe(1);

    // Der typpräfixierte Schlüssel „state:7" blendet das Land ein.
    const byPrefixed = create(FIXTURE_COMPETENCE_LEVELS_COMPARISON_ID_COLLISION, {
      comparisons: ['state:7'],
    });
    const prefixedBlock = byPrefixed.componentInstance.blocks()[0];
    expect(byPrefixed.componentInstance.selectedKeys()).toEqual(['state:7']);
    expect(prefixedBlock.bars.length).toBe(2);
    expect(prefixedBlock.bars[1].name).toBe('Beispielland');
    expect(prefixedBlock.byLevel).toBe(true);
    expect(prefixedBlock.bars[0].percentages).toEqual([5, 10, 30, 35, 15, 5]);
  });
});

@Component({
  imports: [CompetenceLevelsComparisonComponent],
  template: `<tba3-competence-levels-comparison [competenceLevels]="data">
    <div tba3Header>Kopf-Slot</div>
    <div tba3Footer>Fuß-Slot</div>
  </tba3-competence-levels-comparison>`,
})
class EmptyStateHost {
  data: typeof FIXTURE_COMPETENCE_LEVELS_COMPARISON = [];
}

describe('CompetenceLevelsComparisonComponent Leerzustand', () => {
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
