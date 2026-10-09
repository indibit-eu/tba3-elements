import { Component, Directive, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxEchartsDirective } from 'ngx-echarts';
import { beforeEach, describe, expect, it } from 'vitest';
import { CompetenceLevelsDistributionComponent } from './competence-levels-distribution';
import {
  FIXTURE_COMPETENCE_LEVELS_DISTRIBUTION,
  FIXTURE_COMPETENCE_LEVELS_DISTRIBUTION_EMPTY,
  FIXTURE_COMPETENCE_LEVELS_DISTRIBUTION_TWO_SETS,
  FIXTURE_COMPETENCE_LEVELS_DISTRIBUTION_WITH_COMPARISON,
} from '../../../fixtures/competence-levels-distribution';
import {
  FIXTURE_SCENARIO_SCHOOL_COMPETENCE_LEVELS,
  FIXTURE_SCENARIO_STATE_COMPETENCE_LEVELS,
} from '../../../fixtures/scenario';
import { classificationVariable } from '../../model';
import type { CompetenceLevelsValueGroup } from '../../model';

// jsdom hat keinen Canvas für ECharts.
@Directive({ selector: '[echarts]', standalone: true })
class StubEchartsDirective {
  readonly options = input<unknown>();
}

function render(data: unknown): {
  text: string;
  articles: NodeListOf<Element>;
  root: HTMLElement;
  component: CompetenceLevelsDistributionComponent;
} {
  const fixture = TestBed.createComponent(CompetenceLevelsDistributionComponent);
  fixture.componentRef.setInput('competenceLevels', data);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return {
    text: root.textContent ?? '',
    articles: root.querySelectorAll('article'),
    root,
    component: fixture.componentInstance,
  };
}

@Component({
  standalone: true,
  imports: [CompetenceLevelsDistributionComponent],
  template: `<tba3-competence-levels-distribution [competenceLevels]="data">
    <h3 tba3Header>Titel</h3>
    <p tba3Footer>Fußnote</p>
  </tba3-competence-levels-distribution>`,
})
class SlotHostComponent {
  readonly data = FIXTURE_COMPETENCE_LEVELS_DISTRIBUTION;
}

describe('CompetenceLevelsDistributionComponent', () => {
  beforeEach(() => {
    TestBed.overrideComponent(CompetenceLevelsDistributionComponent, {
      remove: { imports: [NgxEchartsDirective] },
      add: { imports: [StubEchartsDirective] },
    });
  });

  it('rendert je Domäne einen Block mit Blockzeile, Zählwert und Kennzahlen', () => {
    const { text, articles, root } = render(FIXTURE_COMPETENCE_LEVELS_DISTRIBUTION);
    expect(articles.length).toBe(2);
    const headings = Array.from(root.querySelectorAll('h4.h5.fw-semibold.mb-3')).map((h) =>
      h.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(headings).toEqual(['Lesen', 'Orthografie']);
    // Zählwert sichtbar, nicht im Titel.
    expect(text).toContain('n = 24');
    // Lesen: Optimalstandard = 2, Mindeststandard erreicht = 21/24 = 88 %.
    expect(text).toContain('2');
    expect(text).toContain('88 %');
  });

  it('setzt Marker statt Trendpfeilen und Abweichungsfarben', () => {
    const { root } = render(FIXTURE_COMPETENCE_LEVELS_DISTRIBUTION);
    const crown = root.querySelector('.fa-crown') as HTMLElement;
    const alert = root.querySelector('.fa-triangle-exclamation') as HTMLElement;
    expect(crown).not.toBeNull();
    expect(alert).not.toBeNull();
    expect(crown.getAttribute('style')).toContain('--tba3-mark-top');
    expect(alert.getAttribute('style')).toContain('--tba3-mark-alert');
    expect(crown.getAttribute('title')).toBe('Optimalstandard');
    expect(alert.getAttribute('title')).toBe('Unter Mindeststandard');
    // Keine Trendpfeile, keine Abweichungsfarben, keine Bootstrap-Statusklassen an den Kennzahlen.
    const html = root.innerHTML;
    expect(root.querySelector('.fa-arrow-trend-up, .fa-arrow-trend-down')).toBeNull();
    expect(html).not.toContain('var(--tba3-deviation-');
    expect(root.querySelectorAll('.text-success, .text-danger').length).toBe(0);
  });

  it('trennt Blöcke mit hr.my-4, keiner nach dem letzten, keine Rahmenlinie', () => {
    const { root } = render(FIXTURE_COMPETENCE_LEVELS_DISTRIBUTION);
    const dividers = root.querySelectorAll('hr.my-4');
    expect(dividers.length).toBe(1);
    expect(root.querySelectorAll('.border-2').length).toBe(0);
    expect(root.querySelector('article')?.classList.contains('pt-4')).toBe(false);
  });

  it('rendert je Diagramm eine Legende und eine Screenreader-Tabelle, keine figcaption', () => {
    const { root } = render(FIXTURE_COMPETENCE_LEVELS_DISTRIBUTION);
    const firstArticle = root.querySelector('article') as HTMLElement;
    // Legende unter dem Diagramm mit einem Farbfeld je vorkommender Classification.
    const legend = firstArticle.querySelector('ul.list-inline');
    expect(legend).not.toBeNull();
    expect(legend!.querySelectorAll('li .fa-square').length).toBe(5);
    // Screenreader-Tabelle mit caption und scope, ohne Bootstrap-Klasse, keine figcaption.
    expect(root.querySelector('figcaption')).toBeNull();
    const table = firstArticle.querySelector('div.visually-hidden table') as HTMLElement;
    expect(table).not.toBeNull();
    expect(table.querySelector('caption')?.textContent).toContain('n = 24');
    expect(table.querySelector('thead th[scope="col"]')?.textContent?.trim()).toBe('Stufe');
    expect(table.querySelector('tbody th[scope="row"]')).not.toBeNull();
  });

  it('fasst Stufensets zu einem Block mit Classification-Säulen ohne Legende zusammen', () => {
    const { text, articles, root } = render(FIXTURE_COMPETENCE_LEVELS_DISTRIBUTION_TWO_SETS);
    expect(articles.length).toBe(1);
    // total = 40 (HSA) + 35 (MSA) = 75; keine Blockzeile (eine Domäne, eine Gruppe).
    expect(text).toContain('n = 75');
    expect(root.querySelector('h4.h5')).toBeNull();
    // Classification-Modus: keine Legende, aber Screenreader-Tabelle ohne Stufenspalte.
    expect(root.querySelector('ul.list-inline')).toBeNull();
    const headers = Array.from(root.querySelectorAll('div.visually-hidden thead th')).map((h) =>
      h.textContent?.trim(),
    );
    expect(headers).toEqual(['Einordnung', 'Teilnehmende']);
  });

  it('zeigt bei mehreren Gruppen den Gruppennamen als Blockzeile, 8a vor Landesmittelwert', () => {
    const { articles, root } = render(FIXTURE_COMPETENCE_LEVELS_DISTRIBUTION_WITH_COMPARISON);
    expect(articles.length).toBe(2);
    const headings = Array.from(root.querySelectorAll('h4.h5')).map((h) => h.textContent?.trim());
    expect(headings).toEqual(['8a', 'Landesmittelwert']);
  });

  it('rendert keinen Block bei leerem Array', () => {
    expect(render([]).articles.length).toBe(0);
  });

  it('zeigt den Leerhinweis ohne Zählwert, Legende und Kennzahlen bei leerer Verteilung', () => {
    const { text, root } = render(FIXTURE_COMPETENCE_LEVELS_DISTRIBUTION_EMPTY);
    expect(text).toContain('Keine Verteilung in der Antwort.');
    expect(root.querySelectorAll('.tba3-chart').length).toBe(0);
    expect(text).not.toContain('n =');
    expect(root.querySelector('ul.list-inline')).toBeNull();
  });

  it('zeigt eine reine Kurs-Antwort als Block je Kurs und Domäne', () => {
    const courses = FIXTURE_SCENARIO_SCHOOL_COMPETENCE_LEVELS.filter(
      (group) => group.type === 'group',
    );
    const { component, articles } = render(courses);
    const blocks = component.blocks();
    expect(articles.length).toBe(5);
    expect(blocks.map((block) => block.labelParts.join(' · '))).toEqual([
      'Deutsch · Lesen · 8a Deutsch',
      'Deutsch · Lesen · 8b Deutsch',
      'Deutsch · Orthografie · 8a Deutsch',
      'Deutsch · Orthografie · 8b Deutsch',
      'Mathematik · Mathematik · 8a Mathematik',
    ]);
    // Jeder Kurs trägt genau ein Stufenset je Domäne: Stufen-Modus mit Legende.
    expect(blocks.every((block) => block.mode === 'level')).toBe(true);
  });

  it('zeigt die Vergleichsschulen als eigene Blöcke und zwei Sets im Classification-Modus', () => {
    // Schule, Vergleichsschulen und Kurse in einer Antwort.
    const { component, articles } = render(FIXTURE_SCENARIO_SCHOOL_COMPETENCE_LEVELS);
    const blocks = component.blocks();
    const labels = blocks.map((block) => block.labelParts.join(' · '));
    expect(articles.length).toBe(11);
    // Die Vergleichsschulen stehen als eigener Block, nicht mit der Schule verschmolzen.
    expect(labels).toContain('Deutsch · Lesen · Vergleichsschulen');
    // Schule und Vergleichsschulen tragen in Deutsch zwei Sets, die Kurse eines.
    const schoolReading = blocks.find(
      (block) => block.labelParts.join(' · ') === 'Deutsch · Lesen · Gesamtschule Birkenmoor',
    );
    const courseReading = blocks.find(
      (block) => block.labelParts.join(' · ') === 'Deutsch · Lesen · 8a Deutsch',
    );
    expect(schoolReading?.mode).toBe('classification');
    expect(courseReading?.mode).toBe('level');
    // Vier Blöcke im Classification-Modus: Schule und Vergleichsschulen, je Lesen und Orthografie.
    expect(blocks.filter((block) => block.mode === 'classification').length).toBe(4);
  });

  it('zeigt zwei Stufensets je Domäne der Landesantwort als Classification-Säulen', () => {
    const { component, articles } = render(FIXTURE_SCENARIO_STATE_COMPETENCE_LEVELS);
    const blocks = component.blocks();
    expect(articles.length).toBe(3);
    expect(blocks.map((block) => block.labelParts.join(' · '))).toEqual([
      'Deutsch · Lesen',
      'Deutsch · Orthografie',
      'Mathematik · Mathematik',
    ]);
    // Deutsch trägt HSA und MSA: Classification-Modus; Mathematik nur MSA: Stufen-Modus.
    expect(blocks.map((block) => block.mode)).toEqual([
      'classification',
      'classification',
      'level',
    ]);
    const reading = blocks[0];
    expect(reading.total).toBe(2503);
    expect(reading.metrics?.minimumReachedPercent).toBe(92);
    expect(reading.metrics?.optimalCount).toBe(136);
    expect(reading.metrics?.belowCount).toBe(196);
  });

  it('liest „Regelstandard plus" tolerant für Legende, Tabelle und Farbe', () => {
    // Der Cast simuliert eine Schreibweise, die der Spec-Typ nicht zulässt.
    const data = [
      {
        id: 'kurs-8c',
        type: 'group',
        name: '8c',
        subject: { name: 'Deutsch' },
        domain: { name: 'Lesen' },
        competenceLevels: [
          {
            nameShort: 'I',
            classification: 'unter Mindeststandard',
            descriptiveStatistics: { total: 11, mean: 0, frequency: 1 },
          },
          {
            nameShort: 'II',
            classification: 'Mindeststandard',
            descriptiveStatistics: { total: 11, mean: 0, frequency: 2 },
          },
          {
            nameShort: 'III',
            classification: 'Regelstandard',
            descriptiveStatistics: { total: 11, mean: 0, frequency: 3 },
          },
          {
            nameShort: 'IV',
            classification: 'REGELSTANDARD PLUS',
            descriptiveStatistics: { total: 11, mean: 0, frequency: 4 },
          },
          {
            nameShort: 'V',
            classification: 'Optimalstandard',
            descriptiveStatistics: { total: 11, mean: 0, frequency: 1 },
          },
        ],
      },
    ] as unknown as CompetenceLevelsValueGroup[];
    const { component, root } = render(data);
    const legendTexts = Array.from(root.querySelectorAll('ul.list-inline li')).map((item) =>
      item.textContent?.trim(),
    );
    expect(legendTexts).toContain('Regelstandard plus');
    // Die Säule trägt die kanonische Schreibweise, nicht die Rohform aus der Antwort.
    const plusBar = component.blocks()[0].bars.find((bar) => bar.name === 'IV');
    expect(plusBar?.classification).toBe('Regelstandard plus');
    // Die Farbe kommt aus der regular-plus-Variable, nicht aus unknown.
    expect(classificationVariable('REGELSTANDARD PLUS')).toBe('--tba3-classification-regular-plus');
  });

  it('trennt kollidierende numerische Ids verschiedener Ebenen in eigene Blöcke', () => {
    // Ohne Typ im Schlüssel kollidieren die Track-Schlüssel und Angular bricht ab.
    const data: CompetenceLevelsValueGroup[] = [
      {
        id: '7',
        type: 'school',
        name: 'Schule Nord',
        subject: { name: 'Deutsch' },
        domain: { name: 'Lesen' },
        competenceLevels: [
          {
            nameShort: 'III',
            classification: 'Regelstandard',
            descriptiveStatistics: { total: 20, mean: 1, frequency: 20 },
          },
        ],
      },
      {
        id: '7',
        type: 'group',
        name: '8a Deutsch',
        subject: { name: 'Deutsch' },
        domain: { name: 'Lesen' },
        competenceLevels: [
          {
            nameShort: 'III',
            classification: 'Regelstandard',
            descriptiveStatistics: { total: 18, mean: 1, frequency: 18 },
          },
        ],
      },
    ];
    const { component, articles } = render(data);
    expect(articles.length).toBe(2);
    const keys = component.blocks().map((block) => block.key);
    expect(new Set(keys).size).toBe(2);
  });

  it('reicht Header- und Footer-Slot außerhalb des Leerzustands durch', () => {
    const fixture = TestBed.createComponent(SlotHostComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('h3[tba3Header]')?.textContent).toContain('Titel');
    expect(root.querySelector('p[tba3Footer]')?.textContent).toContain('Fußnote');
  });
});

@Component({
  imports: [CompetenceLevelsDistributionComponent],
  template: `<tba3-competence-levels-distribution [competenceLevels]="data">
    <div tba3Header>Kopf-Slot</div>
    <div tba3Footer>Fuß-Slot</div>
  </tba3-competence-levels-distribution>`,
})
class EmptyStateHost {
  data: typeof FIXTURE_COMPETENCE_LEVELS_DISTRIBUTION = [];
}

describe('CompetenceLevelsDistributionComponent Leerzustand', () => {
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
