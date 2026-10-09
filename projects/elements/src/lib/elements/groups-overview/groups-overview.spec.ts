import { Component, Directive, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxEchartsDirective } from 'ngx-echarts';
import { beforeEach, describe, expect, it } from 'vitest';
import { GroupsOverviewComponent } from './groups-overview';
import { Tba3DonutChartComponent } from '../../components/donut-chart/donut-chart';
import { Tba3MiniBarChartComponent } from '../../components/mini-bar-chart/mini-bar-chart';
import {
  FIXTURE_GROUPS_OVERVIEW,
  FIXTURE_GROUPS_OVERVIEW_AGGREGATIONS,
  FIXTURE_GROUPS_OVERVIEW_EMPTY,
  FIXTURE_GROUPS_OVERVIEW_TWO_SETS,
} from '../../../fixtures/groups-overview';
import { FIXTURE_SCENARIO_SCHOOL_COMPETENCE_LEVELS } from '../../../fixtures/scenario';

// jsdom hat keinen Canvas für ECharts.
@Directive({ selector: '[echarts]', standalone: true })
class StubEchartsDirective {
  readonly options = input<unknown>();
}

function render(config: {
  competenceLevels?: unknown;
  aggregations?: unknown;
  groupBy?: 'group' | 'subject';
  valueLabels?: unknown;
}) {
  const fixture = TestBed.createComponent(GroupsOverviewComponent);
  if (config.competenceLevels !== undefined)
    fixture.componentRef.setInput('competenceLevels', config.competenceLevels);
  if (config.aggregations !== undefined)
    fixture.componentRef.setInput('aggregations', config.aggregations);
  if (config.groupBy !== undefined) fixture.componentRef.setInput('groupBy', config.groupBy);
  if (config.valueLabels !== undefined)
    fixture.componentRef.setInput('valueLabels', config.valueLabels);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return { fixture, root, text: root.textContent ?? '' };
}

describe('GroupsOverviewComponent', () => {
  beforeEach(() => {
    TestBed.overrideComponent(Tba3DonutChartComponent, {
      remove: { imports: [NgxEchartsDirective] },
      add: { imports: [StubEchartsDirective] },
    });
    TestBed.overrideComponent(Tba3MiniBarChartComponent, {
      remove: { imports: [NgxEchartsDirective] },
      add: { imports: [StubEchartsDirective] },
    });
  });

  it('zeigt je Klasse eine Sektion mit einer Zeile je Fach', () => {
    const { root, fixture } = render({ competenceLevels: FIXTURE_GROUPS_OVERVIEW });
    const sections = fixture.componentInstance.sections();
    expect(sections.map((section) => section.heading)).toEqual([
      'Klasse 8a',
      'Klasse 8b',
      'Klasse 8c',
    ]);

    const first = sections[0];
    expect(first.rows.map((row) => row.label)).toEqual(['Deutsch', 'Mathematik']);
    // Deutsch-Zeile hat zwei Domänen-Charts (Lesen, Orthografie).
    expect(first.rows[0].charts.map((chart) => chart.title)).toEqual(['Lesen', 'Orthografie']);
    // Feste zwei Domänenspalten; Mathematik trägt nur eine Domäne, die zweite Spalte ist leer.
    expect(first.rows[1].domainSlots.length).toBe(2);
    expect(first.rows[1].domainSlots[0]?.title).toBe('Zahlen und Operationen');
    expect(first.rows[1].domainSlots[1]).toBeNull();

    expect(root.querySelectorAll('section').length).toBe(3);
    expect(root.textContent ?? '').toContain('Klasse 8a');
  });

  it('gruppiert nach Fach mit einer Zeile je Klasse', () => {
    const { root, fixture } = render({
      competenceLevels: FIXTURE_GROUPS_OVERVIEW,
      groupBy: 'subject',
    });
    const sections = fixture.componentInstance.sections();
    expect(sections.map((section) => section.heading)).toEqual(['Deutsch', 'Mathematik']);
    expect(sections[0].rows.map((row) => row.label)).toEqual([
      'Klasse 8a',
      'Klasse 8b',
      'Klasse 8c',
    ]);
    expect(root.querySelectorAll('section').length).toBe(2);
  });

  it('zeigt nach Lerngruppe die Donuts in jeder Fachzeile mit fachbezogener Teilnahme', () => {
    const { root, fixture } = render({
      competenceLevels: FIXTURE_GROUPS_OVERVIEW,
      aggregations: FIXTURE_GROUPS_OVERVIEW_AGGREGATIONS,
    });
    const sections = fixture.componentInstance.sections();
    const sectionA = sections[0];
    // Die Donuts stehen in den Fachzeilen, nicht am Sektionskopf.
    const deutsch = sectionA.rows[0];
    expect(deutsch.genderDonut?.segments.length).toBe(3);
    // Klasse 8a Deutsch: teilgenommen 24 / angemeldet 25 = 96 %.
    expect(deutsch.participationDonut?.centerLabel).toBe('96 %');

    // Klasse 8b: Mathematik hat zwei Personen weniger als Deutsch (24 statt 26 von 27).
    const sectionB = sections[1];
    expect(sectionB.rows[0].participationDonut?.centerLabel).toBe('96 %');
    expect(sectionB.rows[1].participationDonut?.centerLabel).toBe('89 %');

    expect(root.querySelectorAll('tba3-donut-chart').length).toBeGreaterThan(0);
  });

  it('zeigt nach Fach die Donuts je Klassenzeile mit fachbezogener Teilnahme', () => {
    const { fixture } = render({
      competenceLevels: FIXTURE_GROUPS_OVERVIEW,
      aggregations: FIXTURE_GROUPS_OVERVIEW_AGGREGATIONS,
      groupBy: 'subject',
    });
    const sections = fixture.componentInstance.sections();
    // Sektion Deutsch, Zeile Klasse 8a.
    const deutschRowA = sections[0].rows[0];
    expect(deutschRowA.genderDonut?.segments.length).toBe(3);
    expect(deutschRowA.participationDonut?.centerLabel).toBe('96 %');
    // Sektion Mathematik, Zeile Klasse 8b: fachbezogen 89 %.
    const matheRowB = sections[1].rows[1];
    expect(matheRowB.participationDonut?.centerLabel).toBe('89 %');
  });

  it('fällt ohne fachbezogene Value-Group auf die Gruppen-Value-Group ohne subject zurück', () => {
    // Fachlose Daten: je Klasse eine Value-Group ohne subject.
    const legacy = (FIXTURE_GROUPS_OVERVIEW_AGGREGATIONS as { subject?: { name: string } }[])
      .filter((group) => group.subject?.name === 'Deutsch')
      .map(({ subject: _subject, ...rest }) => rest);
    const { fixture } = render({
      competenceLevels: FIXTURE_GROUPS_OVERVIEW,
      aggregations: legacy,
    });
    const sections = fixture.componentInstance.sections();
    // Beide Fachzeilen der Klasse 8a bekommen die fachlose Value-Group.
    expect(sections[0].rows[0].participationDonut?.centerLabel).toBe('96 %');
    expect(sections[0].rows[1].participationDonut?.centerLabel).toBe('96 %');
  });

  it('ordnet die Kovariaten über den Schlüssel typ:id zu, auch bei kollidierender id (Schule 7, Kurs 7)', () => {
    const bar = (nameShort: string, classification: string, frequency: number, total: number) => ({
      nameShort,
      classification,
      descriptiveStatistics: { total, frequency, mean: total ? frequency / total : 0 },
    });
    const competenceLevels = [
      {
        id: '7',
        name: 'Gesamtschule Beispielmoor',
        type: 'school',
        subject: { name: 'Deutsch' },
        domain: { name: 'Lesen' },
        competenceLevels: [
          bar('Ia', 'unter Mindeststandard', 10, 40),
          bar('II', 'Regelstandard', 30, 40),
        ],
      },
      {
        id: '7',
        name: '7a Deutsch',
        type: 'group',
        subject: { name: 'Deutsch' },
        domain: { name: 'Lesen' },
        competenceLevels: [
          bar('Ia', 'unter Mindeststandard', 4, 20),
          bar('II', 'Regelstandard', 16, 20),
        ],
      },
    ];
    // Anderer `name` als die Teilgruppe, damit der Treffer über `group:7` läuft.
    const aggregations = [
      {
        id: '7',
        name: 'Kovariaten 7a',
        type: 'group',
        subject: { name: 'Deutsch' },
        aggregations: [
          {
            type: 'students-by-participation',
            value: 'participated',
            descriptiveStatistics: { total: 25, frequency: 24, mean: 0.96 },
          },
          {
            type: 'students-by-gender',
            value: 'male',
            description: 'männlich',
            descriptiveStatistics: { total: 24, frequency: 12, mean: 0.5 },
          },
          {
            type: 'students-by-gender',
            value: 'female',
            description: 'weiblich',
            descriptiveStatistics: { total: 24, frequency: 12, mean: 0.5 },
          },
        ],
      },
    ];
    const { fixture } = render({ competenceLevels, aggregations });
    const sections = fixture.componentInstance.sections();
    // Eine Sektion: der Kurs; die Schule ist Hauptgruppe ohne Zeile.
    expect(sections.map((section) => section.heading)).toEqual(['7a Deutsch']);
    const row = sections[0].rows[0];
    expect(row.participationDonut?.centerLabel).toBe('96 %');
    expect(row.genderDonut?.segments.length).toBe(2);
  });

  it('liest den Geschlechter-Donut auch aus der schlichten Zusammensetzungsform (gender)', () => {
    const simpleForm = (
      FIXTURE_GROUPS_OVERVIEW_AGGREGATIONS as { aggregations: { type: string }[] }[]
    ).map((group) => ({
      ...group,
      aggregations: group.aggregations.map((entry) =>
        entry.type === 'students-by-gender' ? { ...entry, type: 'gender' } : entry,
      ),
    }));
    const { fixture } = render({
      competenceLevels: FIXTURE_GROUPS_OVERVIEW,
      aggregations: simpleForm,
    });
    const deutsch = fixture.componentInstance.sections()[0].rows[0];
    // Drei Ausprägungen (männlich, weiblich, divers) trotz schlichter Form.
    expect(deutsch.genderDonut?.segments.length).toBe(3);
    // Die Teilnahmequote bleibt unverändert, die schlichte Form betrifft nur die Merkmale.
    expect(deutsch.participationDonut?.centerLabel).toBe('96 %');
  });

  it('zeigt bei mehreren Sets einer Domäne fünf Classification-Säulen', () => {
    const { fixture } = render({ competenceLevels: FIXTURE_GROUPS_OVERVIEW_TWO_SETS });
    const sections = fixture.componentInstance.sections();
    // Nur Klasse 8a ist Teilgruppe; die Schule ist Hauptgruppe ohne Zeile.
    expect(sections.map((section) => section.heading)).toEqual(['Klasse 8a']);
    const chart = sections[0].rows[0].charts[0];
    expect(chart.title).toBe('Lesen');
    expect(chart.bars.length).toBe(5);
    // Umbrochene Achsenbeschriftung, voller Name als label.
    const belowMinimum = chart.bars[0];
    expect(belowMinimum.label).toBe('unter Mindeststandard');
    expect(belowMinimum.axisLabel).toBe('unter\nMindest-\nstandard');
    expect(belowMinimum.labelColor).toBeTruthy();
    // „Regelstandard plus" klein geschrieben zählt mit (HSA 3 + MSA 3).
    const regularPlus = chart.bars[3];
    expect(regularPlus.label).toBe('Regelstandard plus');
    expect(regularPlus.value).toBe(6);
  });

  it('gibt beim Klick auf die Klassenüberschrift die id aus, Überschrift ist ein h4', () => {
    const { root, fixture } = render({ competenceLevels: FIXTURE_GROUPS_OVERVIEW });
    let emitted: string | undefined;
    fixture.componentInstance.groupSelected.subscribe((id) => (emitted = id));
    const heading = root.querySelector('section h4') as HTMLElement;
    expect(heading.classList.contains('h5')).toBe(true);
    expect(heading.classList.contains('fw-semibold')).toBe(true);
    const button = heading.querySelector('button') as HTMLButtonElement;
    expect(button).not.toBeNull();
    button.click();
    expect(emitted).toBe('group:group-8a');
  });

  it('rendert je Gruppe eine list-group mit Grid-Einträgen, hr dazwischen', () => {
    const { root } = render({
      competenceLevels: FIXTURE_GROUPS_OVERVIEW,
      aggregations: FIXTURE_GROUPS_OVERVIEW_AGGREGATIONS,
    });
    expect(root.querySelector('div.table-responsive')).toBeNull();
    expect(root.querySelector('table.table')).toBeNull();
    const lists = root.querySelectorAll('section > ul.list-group');
    expect(lists.length).toBe(3);
    const first = lists[0];
    const items = first.querySelectorAll(':scope > li.list-group-item');
    // Klasse 8a: zwei Fächer (Deutsch, Mathematik).
    expect(items.length).toBe(2);
    const grid = items[0].querySelector(':scope > div.row.g-3.align-items-center') as HTMLElement;
    expect(grid).not.toBeNull();
    const cols = [...grid.children] as HTMLElement[];
    // Spaltenfolge: Fach/Klasse, Geschlecht, Teilnahme, zwei Domänenspalten (Lücke am Ende).
    expect(cols[0].className).toContain('col-12');
    expect(cols[0].className).toContain('col-md-2');
    expect(cols[1].className).toContain('col-6');
    expect(cols[1].className).toContain('col-md-2');
    expect(cols[2].className).toContain('col-6');
    expect(cols[2].className).toContain('col-md-2');
    expect(cols[3].className).toContain('col-6');
    expect(cols[3].className).toContain('col-md-3');
    expect(cols[4].className).toContain('col-6');
    expect(cols[4].className).toContain('col-md-3');
    expect(cols[1].querySelector('tba3-donut-chart')).not.toBeNull();
    expect(cols[2].querySelector('tba3-donut-chart')).not.toBeNull();
    expect(cols[3].querySelector('tba3-mini-bar-chart')).not.toBeNull();
    // Erste Spalte trägt den Fachnamen als Text (kein Link, weil die Klasse die Überschrift ist).
    expect(cols[0].textContent?.trim()).toBe('Deutsch');
    expect(cols[0].querySelector('button')).toBeNull();
    // Keine Spalte „n": das Total steht im Geschlechts-Donut.
    expect(root.querySelector('.tba3-num')).toBeNull();
    // Geschlecht und Teilnahme sind Donuts, je mit einer Merkmals-Bildunterschrift.
    expect(
      cols[1].querySelector('div.small.text-secondary.text-center')?.textContent?.trim(),
    ).toBeTruthy();
    expect(
      cols[2].querySelector('div.small.text-secondary.text-center')?.textContent?.trim(),
    ).toBeTruthy();
    // Zwischen drei Gruppen genau zwei Divider.
    expect(root.querySelectorAll('hr.my-4').length).toBe(2);
  });

  it('beschriftet die Donuts mit dem Merkmalsnamen aus valueLabels', () => {
    const { root } = render({
      competenceLevels: FIXTURE_GROUPS_OVERVIEW,
      aggregations: FIXTURE_GROUPS_OVERVIEW_AGGREGATIONS,
      valueLabels: {
        'aggregation.students-by-gender': { label: 'Geschlecht' },
        'aggregation.students-by-participation': { label: 'Teilnahme' },
      },
    });
    const captions = [...root.querySelectorAll('li.list-group-item div.small.text-secondary')].map(
      (node) => node.textContent?.trim(),
    );
    expect(captions).toContain('Geschlecht');
    expect(captions).toContain('Teilnahme');
  });

  it('hält dieselbe Spaltenfolge in der Fach-Gruppierung, Klasse als Link', () => {
    const { root } = render({
      competenceLevels: FIXTURE_GROUPS_OVERVIEW,
      aggregations: FIXTURE_GROUPS_OVERVIEW_AGGREGATIONS,
      groupBy: 'subject',
    });
    expect(root.querySelector('div.table-responsive')).toBeNull();
    expect(root.querySelector('table.table')).toBeNull();
    const grid = root.querySelector(
      'section > ul.list-group > li.list-group-item > div.row.g-3.align-items-center',
    ) as HTMLElement;
    const cols = [...grid.children] as HTMLElement[];
    expect(cols[0].className).toContain('col-12');
    expect(cols[0].className).toContain('col-md-2');
    expect(cols[1].className).toContain('col-md-2');
    expect(cols[2].className).toContain('col-md-2');
    expect(cols[3].className).toContain('col-md-3');
    expect(cols[4].className).toContain('col-md-3');
    // Erste Spalte trägt hier die Klasse als klickbaren Link.
    const link = cols[0].querySelector('button.btn-link') as HTMLButtonElement;
    expect(link).not.toBeNull();
    expect(link.textContent?.trim()).toBe('Klasse 8a');
  });

  it('schaltet über den Umschalter „Fach" die Gruppierung um', () => {
    const { root, fixture } = render({ competenceLevels: FIXTURE_GROUPS_OVERVIEW });
    const buttons = [...root.querySelectorAll('tba3-control-panel button')] as HTMLButtonElement[];
    expect(buttons.map((button) => button.textContent?.trim())).toEqual(['Lerngruppe', 'Fach']);
    // Startwert group: „Lerngruppe" ist aktiv.
    expect(buttons[0].classList.contains('active')).toBe(true);
    buttons[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeGroupBy()).toBe('subject');
    expect(fixture.componentInstance.sections().map((section) => section.heading)).toEqual([
      'Deutsch',
      'Mathematik',
    ]);
    // Die Domäne steht als figcaption.
    expect(root.querySelector('div.table-responsive')).toBeNull();
    expect(root.querySelector('table.table')).toBeNull();
    const captions = [...root.querySelectorAll('tba3-mini-bar-chart figcaption')].map((node) =>
      node.textContent?.trim(),
    );
    expect(captions).toContain('Lesen');
    expect(captions).toContain('Orthografie');
  });

  it('trägt die Domäne als Mini-Balken-figcaption in beiden Gruppierungen', () => {
    const byClass = render({ competenceLevels: FIXTURE_GROUPS_OVERVIEW });
    expect(byClass.root.querySelectorAll('tba3-mini-bar-chart figcaption').length).toBeGreaterThan(
      0,
    );
    const bySubject = render({ competenceLevels: FIXTURE_GROUPS_OVERVIEW, groupBy: 'subject' });
    expect(
      bySubject.root.querySelectorAll('tba3-mini-bar-chart figcaption').length,
    ).toBeGreaterThan(0);
  });

  it('projiziert Header- und Footer-Slot außerhalb des Leerzustands', () => {
    const fixture = TestBed.createComponent(SlotHostComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-role="header"]')?.textContent).toContain('Kopf');
    expect(root.querySelector('[data-role="footer"]')?.textContent).toContain('Fuß');
  });

  it('rendert weder Bedienfeld noch Sektion bei leerem Array und bei der Leer-Fixture', () => {
    const empty = render({ competenceLevels: [] });
    expect(empty.root.querySelectorAll('section').length).toBe(0);
    expect(empty.root.querySelector('tba3-control-panel')).toBeNull();
    expect(empty.root.querySelector('table')).toBeNull();
    expect(
      render({ competenceLevels: FIXTURE_GROUPS_OVERVIEW_EMPTY }).root.querySelectorAll('section')
        .length,
    ).toBe(0);
  });
});

@Component({
  standalone: true,
  imports: [GroupsOverviewComponent],
  template: `<tba3-groups-overview [competenceLevels]="data">
    <p tba3Header data-role="header">Kopf</p>
    <p tba3Footer data-role="footer">Fuß</p>
  </tba3-groups-overview>`,
})
class SlotHostComponent {
  readonly data = FIXTURE_GROUPS_OVERVIEW;
}

@Component({
  imports: [GroupsOverviewComponent],
  template: `<tba3-groups-overview [competenceLevels]="data">
    <div tba3Header>Kopf-Slot</div>
    <div tba3Footer>Fuß-Slot</div>
  </tba3-groups-overview>`,
})
class EmptyStateHost {
  data: typeof FIXTURE_GROUPS_OVERVIEW = [];
}

describe('GroupsOverviewComponent mit Kursen', () => {
  beforeEach(() => {
    TestBed.overrideComponent(Tba3DonutChartComponent, {
      remove: { imports: [NgxEchartsDirective] },
      add: { imports: [StubEchartsDirective] },
    });
    TestBed.overrideComponent(Tba3MiniBarChartComponent, {
      remove: { imports: [NgxEchartsDirective] },
      add: { imports: [StubEchartsDirective] },
    });
  });

  it('zeigt je Kurs eine Sektion und ignoriert Schule und Vergleichsschulen', () => {
    const { root, fixture } = render({
      competenceLevels: FIXTURE_SCENARIO_SCHOOL_COMPETENCE_LEVELS,
    });
    const sections = fixture.componentInstance.sections();
    // Eine Sektion je Kurs; die Schule ist Hauptgruppe, die Vergleichsschulen sind Vergleichsgruppe.
    expect(sections.map((section) => section.heading)).toEqual([
      '8a Deutsch',
      '8b Deutsch',
      '8a Mathematik',
    ]);
    expect(root.textContent ?? '').not.toContain('Vergleichsschulen');
    expect(root.textContent ?? '').not.toContain('Gesamtschule Birkenmoor');

    // Jede Kurs-Sektion zeigt ihr Fach als Zeile, mit den Domänen des Fachs.
    const deutsch = sections[0];
    expect(deutsch.emitId).toBe('group:101');
    expect(deutsch.rows.map((row) => row.label)).toEqual(['Deutsch']);
    expect(deutsch.rows[0].charts.map((chart) => chart.title)).toEqual(['Lesen', 'Orthografie']);
    const mathe = sections[2];
    expect(mathe.rows.map((row) => row.label)).toEqual(['Mathematik']);
    expect(mathe.rows[0].charts.map((chart) => chart.title)).toEqual(['Mathematik']);

    // Jeder Kurs trägt genau ein Stufenset, also zeigt das Diagramm die Stufen (nicht Classifications).
    const reading = deutsch.rows[0].charts[0];
    expect(reading.bars.map((bar) => bar.label)).toEqual(['Ia', 'Ib', 'II', 'III', 'IV']);

    // Kurse tragen keine Kovariaten, also entfallen die Donuts still.
    expect(deutsch.hasGender).toBe(false);
    expect(deutsch.hasParticipation).toBe(false);
    expect(deutsch.rows[0].genderDonut).toBeUndefined();
    expect(root.querySelectorAll('tba3-donut-chart').length).toBe(0);
  });

  it('gruppiert die Kurse nach Fach', () => {
    const { fixture } = render({
      competenceLevels: FIXTURE_SCENARIO_SCHOOL_COMPETENCE_LEVELS,
      groupBy: 'subject',
    });
    const sections = fixture.componentInstance.sections();
    expect(sections.map((section) => section.heading)).toEqual(['Deutsch', 'Mathematik']);
    // Fach Deutsch trägt zwei Kurse, Fach Mathematik einen; die Zeilen tragen die Kurs-ids.
    expect(sections[0].rows.map((row) => row.label)).toEqual(['8a Deutsch', '8b Deutsch']);
    expect(sections[0].rows.map((row) => row.emitId)).toEqual(['group:101', 'group:102']);
    expect(sections[1].rows.map((row) => row.label)).toEqual(['8a Mathematik']);
  });
});

describe('GroupsOverviewComponent Leerzustand', () => {
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
