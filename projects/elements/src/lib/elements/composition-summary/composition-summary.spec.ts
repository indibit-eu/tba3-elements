import { Component, Directive, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxEchartsDirective } from 'ngx-echarts';
import { beforeEach, describe, expect, it } from 'vitest';
import { CompositionSummaryComponent } from './composition-summary';
import { Tba3DonutChartComponent } from '../../components/donut-chart/donut-chart';
import type { AggregationsValueGroup, ValueLabels } from '../../model';
import {
  FIXTURE_COMPOSITION_SUMMARY,
  FIXTURE_COMPOSITION_SUMMARY_EMPTY,
  FIXTURE_COMPOSITION_SUMMARY_PARTICIPATION_GENDER,
  FIXTURE_COMPOSITION_SUMMARY_SUBJECT_BUCKETS,
  FIXTURE_COMPOSITION_SUMMARY_SUBJECTS,
} from '../../../fixtures/composition-summary';
import {
  FIXTURE_SCENARIO_STATES_COVARIATES,
  FIXTURE_SCENARIO_STATES_MINIMUM_CLASSIFICATION,
} from '../../../fixtures/scenario';
import { EXAMPLE_VALUE_LABELS } from '../../../fixtures/example-labels';

// jsdom hat keinen Canvas für ECharts.
@Directive({ selector: '[echarts]', standalone: true })
class StubEchartsDirective {
  readonly options = input<unknown>();
}

function render(config: { aggregations?: unknown; valueLabels?: ValueLabels; subject?: string }) {
  const fixture = TestBed.createComponent(CompositionSummaryComponent);
  if (config.aggregations !== undefined)
    fixture.componentRef.setInput('aggregations', config.aggregations);
  if (config.valueLabels !== undefined)
    fixture.componentRef.setInput('valueLabels', config.valueLabels);
  if (config.subject !== undefined) fixture.componentRef.setInput('subject', config.subject);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return {
    root,
    text: root.textContent ?? '',
    instance: fixture.componentInstance,
  };
}

function entry(
  type: string,
  value: string,
  frequency: number,
  total: number,
): AggregationsValueGroup['aggregations'][number] {
  return {
    type,
    value,
    descriptiveStatistics: {
      total,
      frequency,
      mean: total ? frequency / total : 0,
      standardDeviation: 0,
    },
  };
}

function pick(
  groups: readonly AggregationsValueGroup[],
  type: string,
  id: string,
): AggregationsValueGroup[] {
  return groups.filter((group) => group.type === type && group.id === id);
}

describe('CompositionSummaryComponent', () => {
  beforeEach(() => {
    TestBed.overrideComponent(Tba3DonutChartComponent, {
      remove: { imports: [NgxEchartsDirective] },
      add: { imports: [StubEchartsDirective] },
    });
  });

  it('zeigt Anmeldungen, Merkmals-Donuts und den SES-Median', () => {
    const { text, instance, root } = render({
      aggregations: FIXTURE_COMPOSITION_SUMMARY,
      valueLabels: EXAMPLE_VALUE_LABELS,
    });

    // Angemeldet 25, nicht die 23 Teilnehmenden; die Vergleichsgruppe bleibt außen vor.
    expect(instance.registrations()).toEqual([
      { icon: 'fa-user-graduate', count: 25, label: 'Schüler:innen' },
    ]);
    expect(text).toContain('25');
    expect(text).toContain('Schüler:innen');
    expect(text).not.toContain('Landesmittelwert');

    // 23 / 25 = 92 %, nicht die 96 % des Landesmittelwerts.
    expect(instance.participationDonut()?.centerLabel).toBe('92 %');

    // Ein Donut je Merkmal in fester Reihenfolge, Titel aus `valueLabels`.
    const donuts = instance.characteristicDonuts();
    expect(donuts.map((donut) => donut.title)).toEqual([
      'Geschlecht',
      'Sprache zu Hause',
      'Sozioökonomischer Status',
    ]);

    expect(donuts[0].segments[0].label).toBe('männlich');

    // Median-Code im Ringzentrum, Klartext aus `description`.
    expect(donuts[2].centerLabel).toBe('C');
    expect(donuts[2].median).toEqual({ code: 'C', name: 'mittel' });
    expect(text).toContain('Median');
    expect(text).toContain('C');
    expect(text).toContain('mittel');
    expect(text).not.toContain('Median: mittel');

    // Nur SES trägt etwas im Ringzentrum.
    expect(donuts[0].centerLabel).toBe('');
    expect(donuts[1].centerLabel).toBe('');

    const grid = root.querySelector('tba3-card-grid');
    expect(grid).not.toBeNull();
    const cards = Array.from(root.querySelectorAll('.card'));
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.classList.contains('h-100')).toBe(true);
    }
    expect(root.querySelector('.shadow-sm')).toBeNull();

    expect(root.querySelector('.fa-user-graduate')).not.toBeNull();
    expect(root.querySelector('.text-uppercase')).toBeNull();
    expect(root.querySelector('.fw-bold')).toBeNull();

    const cells = Array.from(grid?.children ?? []);
    expect(cells.length).toBeGreaterThan(0);
    for (const cell of cells) {
      expect(cell.querySelector('.card')).not.toBeNull();
    }

    const titles = Array.from(root.querySelectorAll('h4.card-title.h6'));
    const titleTexts = titles.map((title) => title.textContent?.trim());
    expect(titleTexts).toContain('Teilnahmequote');
    expect(titleTexts).toContain('Anmeldungen');
    expect(titleTexts).not.toContain('Teilnehmende');

    expect(root.querySelector('p.card-subtitle')).toBeNull();
    expect(text).not.toContain('n = ');

    // Legenden ohne Häufigkeiten.
    expect(root.querySelector('ul.list-inline span.ms-1')).toBeNull();
  });

  it('zeigt ohne Sprache und SES nur Anmeldungen und Geschlecht', () => {
    const { instance } = render({
      aggregations: FIXTURE_COMPOSITION_SUMMARY_PARTICIPATION_GENDER,
      valueLabels: EXAMPLE_VALUE_LABELS,
    });
    expect(instance.registrations()).toEqual([
      { icon: 'fa-user-graduate', count: 25, label: 'Schüler:innen' },
    ]);
    expect(instance.characteristicDonuts().map((donut) => donut.title)).toEqual(['Geschlecht']);
  });

  it('baut die Kachel „Anmeldungen" je Kontext aus den Einheiten-Kopfzahlen, grob nach fein', () => {
    const stateAgg: AggregationsValueGroup[] = [
      {
        id: 'beispielland',
        type: 'state',
        name: 'Beispielland',
        aggregations: [
          entry('students-by-participation', 'participated', 1211, 1330),
          entry('schools-by-participation', 'participated', 15, 15),
          entry('authorities-by-participation', 'participated', 4, 4),
        ],
      },
    ];
    expect(render({ aggregations: stateAgg }).instance.registrations()).toEqual([
      { icon: 'fa-building-columns', count: 4, label: 'Schulämter' },
      { icon: 'fa-school', count: 15, label: 'Schulen' },
      { icon: 'fa-user-graduate', count: 1330, label: 'Schüler:innen' },
    ]);

    const schoolAgg: AggregationsValueGroup[] = [
      {
        id: 'school-x',
        type: 'school',
        name: 'Schule X',
        aggregations: [
          entry('students-by-participation', 'participated', 66, 71),
          entry('groups-by-participation', 'participated', 3, 3),
        ],
      },
    ];
    expect(render({ aggregations: schoolAgg }).instance.registrations()).toEqual([
      { icon: 'fa-chalkboard-user', count: 3, label: 'Klassen' },
      { icon: 'fa-user-graduate', count: 71, label: 'Schüler:innen' },
    ]);
  });

  it('übersetzt die Einheiten-Labels über valueLabels (`unit.<einheit>`), sonst deutscher Fallback', () => {
    const agg: AggregationsValueGroup[] = [
      {
        id: 'schulamt-x',
        type: 'authority',
        name: 'Schulamt X',
        aggregations: [
          entry('students-by-participation', 'participated', 200, 220),
          entry('schools-by-participation', 'participated', 5, 5),
        ],
      },
    ];
    expect(render({ aggregations: agg }).instance.registrations()).toEqual([
      { icon: 'fa-school', count: 5, label: 'Schulen' },
      { icon: 'fa-user-graduate', count: 220, label: 'Schüler:innen' },
    ]);
    const labels: ValueLabels = {
      'unit.schools': { label: 'Grundschulen' },
      'unit.students': { label: 'Kinder' },
    };
    expect(render({ aggregations: agg, valueLabels: labels }).instance.registrations()).toEqual([
      { icon: 'fa-school', count: 5, label: 'Grundschulen' },
      { icon: 'fa-user-graduate', count: 220, label: 'Kinder' },
    ]);
  });

  it('bezieht die Merkmalsverteilungen auf die Angemeldeten', () => {
    const { instance } = render({
      aggregations: FIXTURE_COMPOSITION_SUMMARY,
      valueLabels: EXAMPLE_VALUE_LABELS,
    });
    const registered = instance.registrations().at(-1)?.count;
    expect(registered).toBe(25);
    for (const donut of instance.characteristicDonuts()) {
      const sum = donut.segments.reduce((total, segment) => total + segment.value, 0);
      expect(sum).toBe(registered);
    }
  });

  it('liest die schlichte Lieferform und die Fachbalken aus einem `aggregations`-Input', () => {
    const { text, instance, root } = render({
      aggregations: FIXTURE_COMPOSITION_SUMMARY_SUBJECTS,
      valueLabels: EXAMPLE_VALUE_LABELS,
    });

    // Ohne Teilnahme-Kopfzahl kommt die Schülerzahl aus dem `total` des Geschlechts.
    expect(instance.registrations()).toEqual([
      { icon: 'fa-chalkboard-user', count: 4, label: 'Klassen' },
      { icon: 'fa-user-graduate', count: 80, label: 'Schüler:innen' },
    ]);
    expect(instance.participationDonut()).toBeUndefined();

    // `minimumClassification` erscheint nicht als Donut.
    const donuts = instance.characteristicDonuts();
    expect(donuts.map((donut) => donut.title)).toEqual([
      'Geschlecht',
      'Sprache zu Hause',
      'Sozioökonomischer Status',
    ]);
    // `diverse` mit Häufigkeit 0 fehlt.
    expect(donuts[0].segments.map((segment) => segment.label)).toEqual(['männlich', 'weiblich']);
    // Median ohne `unknown`.
    expect(donuts[2].median).toEqual({ code: 'C', name: 'mittel' });

    expect(instance.subjectMinimums()).toEqual([
      { name: 'Deutsch', percent: 83 },
      { name: 'Mathematik', percent: 76 },
    ]);
    expect(text).toContain('83 %');
    expect(text).toContain('76 %');
    expect(root.querySelector('h4.card-title')?.textContent).toBeTruthy();
  });

  it('zeigt mit Input `subject` nur den gewählten Fachbalken', () => {
    const { instance } = render({
      aggregations: FIXTURE_COMPOSITION_SUMMARY_SUBJECTS,
      valueLabels: EXAMPLE_VALUE_LABELS,
      subject: 'Mathematik',
    });
    expect(instance.subjectMinimums()).toEqual([{ name: 'Mathematik', percent: 76 }]);
  });

  it('wertet ohne `subject` den fachlosen Bucket aus und addiert die Fächer nicht auf', () => {
    const { instance } = render({
      aggregations: FIXTURE_COMPOSITION_SUMMARY_SUBJECT_BUCKETS,
      valueLabels: EXAMPLE_VALUE_LABELS,
    });
    // Fachloser Bucket, nicht die Summe über alle Fächer.
    expect(instance.registrations()[0].count).toBe(26);
    const donuts = instance.characteristicDonuts();
    expect(donuts).toHaveLength(1);
    expect(donuts[0].segments).toHaveLength(2);
  });

  it('wertet mit `subject` genau den passenden Fach-Bucket aus', () => {
    const { instance } = render({
      aggregations: FIXTURE_COMPOSITION_SUMMARY_SUBJECT_BUCKETS,
      valueLabels: EXAMPLE_VALUE_LABELS,
      subject: 'Mathematik',
    });
    expect(instance.registrations()[0].count).toBe(22);
  });

  it('nimmt bei nur Fach-Buckets (kein fachloser) den ersten Bucket', () => {
    const onlySubjects = FIXTURE_COMPOSITION_SUMMARY_SUBJECT_BUCKETS.filter(
      (group) => group.subject !== undefined,
    );
    const { instance } = render({ aggregations: onlySubjects });
    // Deutsch ist der erste Fach-Bucket.
    expect(instance.registrations()[0].count).toBe(24);
  });

  it('hält kollidierende Ids getrennt: Schulamt 7 als Hauptgruppe, Land 7 als Vergleich', () => {
    const nordmark = [
      ...pick(FIXTURE_SCENARIO_STATES_COVARIATES, 'authority', '7'),
      ...pick(FIXTURE_SCENARIO_STATES_MINIMUM_CLASSIFICATION, 'authority', '7'),
    ];
    const state = [
      ...pick(FIXTURE_SCENARIO_STATES_COVARIATES, 'state', '7'),
      ...pick(FIXTURE_SCENARIO_STATES_MINIMUM_CLASSIFICATION, 'state', '7'),
    ];
    const { instance } = render({
      aggregations: [...nordmark, ...state],
      valueLabels: EXAMPLE_VALUE_LABELS,
    });

    expect(instance.registrations()).toEqual([
      { icon: 'fa-chalkboard-user', count: 31, label: 'Klassen' },
      { icon: 'fa-user-graduate', count: 695, label: 'Schüler:innen' },
    ]);
    expect(instance.participationDonut()).toBeUndefined();
    // Nicht die Werte des Landes (85 %, 91 %).
    expect(instance.subjectMinimums()).toEqual([
      { name: 'Deutsch', percent: 88 },
      { name: 'Mathematik', percent: 78 },
    ]);
  });

  it('zeigt die Landessicht mit Schulämtern als ignorierten Teilgruppen', () => {
    const state = [
      ...pick(FIXTURE_SCENARIO_STATES_COVARIATES, 'state', '7'),
      ...pick(FIXTURE_SCENARIO_STATES_MINIMUM_CLASSIFICATION, 'state', '7'),
    ];
    const authorities = FIXTURE_SCENARIO_STATES_COVARIATES.filter(
      (group) => group.type === 'authority',
    );
    const { instance } = render({
      aggregations: [...state, ...authorities],
      valueLabels: EXAMPLE_VALUE_LABELS,
    });

    expect(instance.registrations()).toEqual([
      { icon: 'fa-chalkboard-user', count: 118, label: 'Klassen' },
      { icon: 'fa-user-graduate', count: 2700, label: 'Schüler:innen' },
    ]);
    expect(instance.subjectMinimums()).toEqual([
      { name: 'Deutsch', percent: 85 },
      { name: 'Mathematik', percent: 91 },
    ]);
  });

  it('lässt `valueLabels` einen Rohwert ohne `description` überschreiben', () => {
    const aggregations: AggregationsValueGroup[] = [
      {
        id: 'group-9b',
        type: 'group',
        name: 'Klasse 9b',
        aggregations: [
          {
            type: 'students-by-gender',
            value: 'male',
            descriptiveStatistics: { total: 20, frequency: 12, mean: 0.6, standardDeviation: 0.5 },
          },
          {
            type: 'students-by-gender',
            value: 'female',
            descriptiveStatistics: { total: 20, frequency: 8, mean: 0.4, standardDeviation: 0.49 },
          },
        ],
      },
    ];
    const valueLabels: ValueLabels = {
      'gender.male': { label: 'männlich' },
      'gender.female': { label: 'weiblich' },
    };
    const { instance } = render({ aggregations, valueLabels });
    const donut = instance.characteristicDonuts()[0];
    expect(donut.segments.map((segment) => segment.label)).toEqual(['männlich', 'weiblich']);
  });

  it('rendert nichts bei leeren Inputs und bei der Leer-Fixture', () => {
    expect(render({ aggregations: [] }).instance.hasContent()).toBe(false);
    expect(render({ aggregations: [] }).root.querySelector('tba3-card-grid')).toBeNull();
    expect(render({ aggregations: FIXTURE_COMPOSITION_SUMMARY_EMPTY }).instance.hasContent()).toBe(
      false,
    );
  });

  it('projiziert Header und Footer über die Slots, auch im Leerzustand', () => {
    const fixture = TestBed.createComponent(SlotHost);
    fixture.componentInstance.data = [];
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('tba3-card-grid')).toBeNull();
    const header = fixture.nativeElement.querySelector('[data-role="header"]');
    const footer = fixture.nativeElement.querySelector('[data-role="footer"]');
    expect(header?.textContent).toContain('Zusammensetzung');
    expect(footer?.textContent).toContain('Quelle');
  });

  it('stellt den Header über, den Footer unter die Kartenreihe', () => {
    const fixture = TestBed.createComponent(SlotHost);
    fixture.componentInstance.data = FIXTURE_COMPOSITION_SUMMARY;
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('tba3-composition-summary') as HTMLElement;
    const nodes = Array.from(root.children) as HTMLElement[];
    const headerIndex = nodes.findIndex((node) => node.getAttribute('data-role') === 'header');
    const footerIndex = nodes.findIndex((node) => node.getAttribute('data-role') === 'footer');
    const rowIndex = nodes.findIndex((node) => node.tagName === 'TBA3-CARD-GRID');
    expect(rowIndex).toBeGreaterThanOrEqual(0);
    expect(headerIndex).toBeLessThan(rowIndex);
    expect(footerIndex).toBeGreaterThan(rowIndex);
  });
});

@Component({
  standalone: true,
  imports: [CompositionSummaryComponent],
  template: `
    <tba3-composition-summary [aggregations]="data">
      <h3 tba3Header data-role="header" class="h5">Zusammensetzung</h3>
      <p tba3Footer data-role="footer">Quelle: eigene Erhebung</p>
    </tba3-composition-summary>
  `,
})
class SlotHost {
  data: AggregationsValueGroup[] = [];
}

@Component({
  imports: [CompositionSummaryComponent],
  template: `<tba3-composition-summary [aggregations]="data">
    <div tba3Header>Kopf-Slot</div>
    <div tba3Footer>Fuß-Slot</div>
  </tba3-composition-summary>`,
})
class EmptyStateHost {
  data: typeof FIXTURE_COMPOSITION_SUMMARY = [];
}

describe('CompositionSummaryComponent Leerzustand', () => {
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
