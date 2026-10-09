import { Component, Directive, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxEchartsDirective } from 'ngx-echarts';
import { beforeEach, describe, expect, it } from 'vitest';
import { StandardAttainmentByDomainComponent } from './standard-attainment-by-domain';
import { Tba3DonutChartComponent } from '../../components/donut-chart/donut-chart';
import type { AggregationsValueGroup, CompetenceLevelsValueGroup } from '../../model';
import { classificationColor, themeColor } from '../../model';
import {
  FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN,
  FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN_EMPTY,
  FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN_TOTALS,
  FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN_TWO_SETS,
  FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN_WITH_COMPARISON,
  FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN_WITH_COMPARISON_TOTALS,
} from '../../../fixtures/standard-attainment-by-domain';
import {
  FIXTURE_SCENARIO_SCHOOL_COMPETENCE_LEVELS,
  FIXTURE_SCENARIO_SCHOOL_MINIMUM_CLASSIFICATION,
} from '../../../fixtures/scenario';

// jsdom hat keinen Canvas für ECharts.
@Directive({ selector: '[echarts]', standalone: true })
class StubEchartsDirective {
  readonly options = input<unknown>();
}

function render(levels: unknown, aggregations: unknown = []) {
  const fixture = TestBed.createComponent(StandardAttainmentByDomainComponent);
  fixture.componentRef.setInput('competenceLevels', levels);
  fixture.componentRef.setInput('aggregations', aggregations);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return {
    root,
    text: root.textContent ?? '',
    cards: root.querySelectorAll('.card'),
    subjects: fixture.componentInstance.subjects(),
  };
}

@Component({
  standalone: true,
  imports: [StandardAttainmentByDomainComponent],
  template: `<tba3-standard-attainment-by-domain [competenceLevels]="data">
    <h3 tba3Header>Kopf</h3>
    <p tba3Footer>Fuß</p>
  </tba3-standard-attainment-by-domain>`,
})
class SlotHostComponent {
  data: CompetenceLevelsValueGroup[] = [];
}

describe('StandardAttainmentByDomainComponent', () => {
  beforeEach(() => {
    TestBed.overrideComponent(Tba3DonutChartComponent, {
      remove: { imports: [NgxEchartsDirective] },
      add: { imports: [StubEchartsDirective] },
    });
    // jsdom kennt die Theme-Variablen nicht.
    const root = document.documentElement;
    root.style.setProperty('--tba3-bar', '#6c757d');
    root.style.setProperty('--tba3-classification-regular', '#666dcc');
    root.style.setProperty('--tba3-classification-optimal', '#e6c44c');
    root.style.setProperty('--tba3-classification-below-minimum', '#df7020');
  });

  it('zeigt je Fach einen Block mit „Fach gesamt" und Domänenkarten', () => {
    const { root, text, cards, subjects } = render(
      FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN,
      FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN_TOTALS,
    );
    expect(text).toContain('Deutsch');
    expect(text).toContain('Mathematik');

    // Zwei Blockzeilen als h4.h5.fw-semibold.mb-3, genau ein Divider dazwischen.
    const headings = root.querySelectorAll('h4.h5.fw-semibold.mb-3');
    expect(headings.length).toBe(2);
    expect(headings[0].textContent).toContain('Deutsch');
    expect(headings[1].textContent).toContain('Mathematik');
    expect(root.querySelectorAll('hr.my-4').length).toBe(1);

    // Je Fach „Fach gesamt" und zwei Domänen, also sechs Karten `card h-100`.
    expect(cards.length).toBe(6);
    cards.forEach((card) => expect(card.classList.contains('h-100')).toBe(true));
    const firstTitle = cards[0].querySelector('h5.card-title.h6');
    expect(firstTitle?.textContent).toBe('Fach gesamt');

    // Deutsch: „Fach gesamt", „Lesen", „Orthografie"; Mathematik Domänen alphabetisch.
    const deutsch = subjects[0];
    expect(deutsch.name).toBe('Deutsch');
    expect(deutsch.showHeading).toBe(true);
    expect(deutsch.donuts.map((donut) => donut.label)).toEqual([
      'Fach gesamt',
      'Lesen',
      'Orthografie',
    ]);
    const mathematik = subjects[1];
    expect(mathematik.name).toBe('Mathematik');
    expect(mathematik.donuts.map((donut) => donut.label)).toEqual([
      'Fach gesamt',
      'Raum und Form',
      'Zahlen und Operationen',
    ]);

    // „Fach gesamt" kommt aus den Aggregationen: Deutsch 87/96 → 91 %, Mathematik 83/96 → 86 %.
    expect(deutsch.donuts[0].centerLabel).toBe('91 %');
    expect(deutsch.donuts[0].total).toBe(96);
    expect(mathematik.donuts[0].centerLabel).toBe('86 %');
    // Domänen aus den Kompetenzstufen: Deutsch Lesen 90/96 → 94 %.
    expect(deutsch.donuts[1].centerLabel).toBe('94 %');
  });

  it('zeigt ohne aggregations-Input nur die Domänen, kein „Fach gesamt"', () => {
    const { subjects } = render(FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN);
    expect(subjects[0].donuts.map((donut) => donut.label)).toEqual(['Lesen', 'Orthografie']);
    expect(subjects[1].donuts.map((donut) => donut.label)).toEqual([
      'Raum und Form',
      'Zahlen und Operationen',
    ]);
  });

  it('stellt bei einer Vergleichsgruppe nur die Hauptgruppe dar, ohne Blockzeile', () => {
    const { root, text, subjects } = render(
      FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN_WITH_COMPARISON,
      FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN_WITH_COMPARISON_TOTALS,
    );
    expect(text).not.toContain('Landesmittelwert');
    expect(text).toContain('Fach gesamt');
    expect(text).toContain('Lesen');
    // Ein Fach: keine Blockzeile, kein Divider, Kartentitel als h4.card-title.h6.
    expect(root.querySelector('h4.h5.fw-semibold')).toBeNull();
    expect(root.querySelector('hr.my-4')).toBeNull();
    expect(root.querySelector('h4.card-title.h6')).not.toBeNull();

    // Schule 87/96 → 91 %, nicht Land 4250/5000 → 85 %.
    expect(subjects[0].donuts[0].label).toBe('Fach gesamt');
    expect(subjects[0].donuts[0].centerLabel).toBe('91 %');
    expect(text).not.toContain('85 %');
  });

  it('fasst zwei Stufensets einer Domäne zu einem Donut zusammen', () => {
    const { root, subjects } = render(FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN_TWO_SETS);
    const donuts = root.querySelectorAll('tba3-donut-chart');
    expect(donuts.length).toBe(1);
    const donut = subjects[0].donuts[0];
    // total 40 + 56 = 96, unter Mindeststandard 11 → 85/96 = 88,54 → 89 %.
    expect(donut.centerLabel).toBe('89 %');
    expect(donut.total).toBe(96);
    // Optimalstandard 3 + 10 = 13 im dritten Segment, unter Mindeststandard 8 + 3 = 11 im ersten.
    expect(donut.segments[2].value).toBe(13);
    expect(donut.segments[0].value).toBe(11);
  });

  it('verarbeitet das Backend-Format (zwei Sets, Kleinschreibung, numerische Ids)', () => {
    const schoolLevels = FIXTURE_SCENARIO_SCHOOL_COMPETENCE_LEVELS.filter(
      (group) => group.type === 'school',
    );
    const { text, subjects } = render(schoolLevels, FIXTURE_SCENARIO_SCHOOL_MINIMUM_CLASSIFICATION);

    expect(subjects.map((subject) => subject.name)).toEqual(['Deutsch', 'Mathematik']);
    expect(subjects[0].donuts.map((donut) => donut.label)).toEqual([
      'Fach gesamt',
      'Lesen',
      'Orthografie',
    ]);
    expect(subjects[1].donuts.map((donut) => donut.label)).toEqual(['Fach gesamt', 'Mathematik']);

    // Lesen fasst beide Sets zusammen (total 23 + 22 = 45), nicht zwei Donuts.
    expect(subjects[0].donuts[1].total).toBe(45);

    // „Regelstandard plus" in abweichender Schreibweise: 37/45 → 82 %.
    expect(subjects[0].donuts[0].centerLabel).toBe('82 %');

    // Die Vergleichsschulen und Kurse der Antwort erscheinen nicht (nur die Hauptgruppe).
    expect(text).not.toContain('Vergleichsschulen');
    expect(text).not.toContain('8a Deutsch');
  });

  it('trennt kollidierende numerische Ids über den Typ', () => {
    // Hauptgruppe Land id „7"; die Aggregationen tragen Land 7 und Schulamt 7 mit derselben id.
    const levels: CompetenceLevelsValueGroup[] = [
      {
        id: '7',
        type: 'state',
        name: 'Beispielland',
        subject: { name: 'Deutsch' },
        domain: { name: 'Lesen' },
        competenceLevels: [
          {
            nameShort: 'III',
            classification: 'Regelstandard',
            descriptiveStatistics: { total: 100, mean: 1, frequency: 100 },
          },
        ],
      },
    ];
    const aggregations: AggregationsValueGroup[] = [
      {
        id: '7',
        type: 'state',
        name: 'Beispielland',
        subject: { name: 'Deutsch' },
        aggregations: [
          {
            type: 'minimumClassification',
            value: 'unter Mindeststandard',
            descriptiveStatistics: { total: 100, mean: 0.1, frequency: 10, standardDeviation: 0 },
          },
          {
            type: 'minimumClassification',
            value: 'Regelstandard',
            descriptiveStatistics: { total: 100, mean: 0.9, frequency: 90, standardDeviation: 0 },
          },
        ],
      },
      {
        id: '7',
        type: 'authority',
        name: 'Schulamt Nordmark',
        subject: { name: 'Deutsch' },
        aggregations: [
          {
            type: 'minimumClassification',
            value: 'unter Mindeststandard',
            descriptiveStatistics: { total: 100, mean: 0.4, frequency: 40, standardDeviation: 0 },
          },
          {
            type: 'minimumClassification',
            value: 'Regelstandard',
            descriptiveStatistics: { total: 100, mean: 0.6, frequency: 60, standardDeviation: 0 },
          },
        ],
      },
    ];
    const { subjects } = render(levels, aggregations);
    // „Fach gesamt" nimmt Land 7 (90 %), nicht Schulamt 7 (60 %).
    expect(subjects[0].donuts[0].label).toBe('Fach gesamt');
    expect(subjects[0].donuts[0].centerLabel).toBe('90 %');
  });

  it('rendert keine Karten bei leerem Array und Leer-Fixture', () => {
    const empty = render([]);
    expect(empty.cards.length).toBe(0);
    expect(empty.root.querySelector('tba3-card-grid')).toBeNull();
    expect(render(FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN_EMPTY).cards.length).toBe(0);
  });

  it('färbt das mittlere Segment neutral und beschriftet es als Spanne', () => {
    const { subjects } = render(FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN);
    const donut = subjects[0].donuts[0]; // Lesen
    // Mittleres Segment: neutrales Balkengrau, nicht die Regelstandard-Stufenfarbe.
    expect(donut.segments[1].label).toBe('Mindeststandard bis Regelstandard plus');
    expect(donut.segments[1].color).toBe(themeColor('--tba3-bar'));
    expect(donut.segments[1].color).not.toBe(classificationColor('Regelstandard'));
    // Außensegmente in Classification-Farben.
    expect(donut.segments[0].color).toBe(classificationColor('unter Mindeststandard'));
    expect(donut.segments[2].color).toBe(classificationColor('Optimalstandard'));
  });

  it('trägt Krone und Warndreieck, das mittlere Segment keinen Marker', () => {
    const { subjects } = render(FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN);
    const lesen = subjects[0].donuts[0]; // Lesen: unter Mindeststandard 6, Optimalstandard 16
    expect(lesen.segments[0].value).toBe(6);
    expect(lesen.segments[0].marker).toEqual({
      icon: 'fa-triangle-exclamation',
      color: 'var(--tba3-mark-alert)',
      title: 'Unter Mindeststandard',
    });
    expect(lesen.segments[2].value).toBe(16);
    expect(lesen.segments[2].marker).toEqual({
      icon: 'fa-crown',
      color: 'var(--tba3-mark-top)',
      title: 'Optimalstandard',
    });
    // Mittleres Segment nie mit Marker.
    expect(lesen.segments[1].marker).toBeUndefined();
  });

  it('projiziert Header- und Footer-Slot, auch im Leerzustand', () => {
    const fixture = TestBed.createComponent(SlotHostComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    // Leerer Input: keine Karte, aber beide Slots sichtbar.
    expect(host.querySelector('.card')).toBeNull();
    expect(host.querySelector('[tba3Header]')?.textContent).toBe('Kopf');
    expect(host.querySelector('[tba3Footer]')?.textContent).toBe('Fuß');
  });
});

@Component({
  imports: [StandardAttainmentByDomainComponent],
  template: `<tba3-standard-attainment-by-domain [competenceLevels]="data">
    <div tba3Header>Kopf-Slot</div>
    <div tba3Footer>Fuß-Slot</div>
  </tba3-standard-attainment-by-domain>`,
})
class EmptyStateHost {
  data: typeof FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN = [];
}

describe('StandardAttainmentByDomainComponent Leerzustand', () => {
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
