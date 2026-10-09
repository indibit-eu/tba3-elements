import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { SolutionRatesRankingComponent } from './solution-rates-ranking';
import type { AggregationsValueGroup } from '../../model';
import {
  FIXTURE_SOLUTION_RATES,
  FIXTURE_SOLUTION_RATES_EMPTY,
  FIXTURE_SOLUTION_RATES_READING_STYLES,
  FIXTURE_SOLUTION_RATES_TWO_BOOKLETS,
} from '../../../fixtures/solution-rates';
import {
  FIXTURE_SCENARIO_SCHOOL_COMPETENCE,
  FIXTURE_SCENARIO_STATES_COMPETENCE,
} from '../../../fixtures/scenario';

function create(data: unknown, inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(SolutionRatesRankingComponent);
  fixture.componentRef.setInput('aggregations', data);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  return fixture;
}

function cardTitles(element: HTMLElement): string[] {
  return Array.from(element.querySelectorAll('.card-title')).map(
    (node) => node.textContent?.trim() ?? '',
  );
}

function cardSubtitles(element: HTMLElement): string[] {
  return Array.from(element.querySelectorAll('.card-subtitle')).map(
    (node) => node.textContent?.trim() ?? '',
  );
}

describe('SolutionRatesRankingComponent', () => {
  it('rankt ohne Vergleich domänenübergreifend nach Lösungsquote', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES);
    const ranking = fixture.componentInstance.ranking();

    expect(ranking.hasComparison).toBe(false);
    expect(ranking.showBlock).toBe(true);
    expect(ranking.cards.map((card) => card.title)).toEqual([
      'Höchste Lösungsquoten',
      'Niedrigste Lösungsquoten',
    ]);
    expect(ranking.cards.map((card) => card.subtitle)).toEqual([undefined, undefined]);
    expect(ranking.cards[0].items.map((item) => item.focusPercent)).toEqual([81, 72, 69]);
    expect(ranking.cards[1].items.map((item) => item.focusPercent)).toEqual([47, 51, 58]);

    expect(cardTitles(fixture.nativeElement)).toEqual([
      'Höchste Lösungsquoten',
      'Niedrigste Lösungsquoten',
    ]);
  });

  it('rankt mit Vergleich nach Δ und zeigt beide Quoten', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES, { comparison: 'state:state-average' });
    const ranking = fixture.componentInstance.ranking();

    expect(ranking.hasComparison).toBe(true);
    expect(ranking.cards.map((card) => card.title)).toEqual(['Stärken', 'Schwächen']);
    expect(ranking.cards.map((card) => card.subtitle)).toEqual([
      'gegenüber Landesmittelwert',
      'gegenüber Landesmittelwert',
    ]);

    expect(ranking.cards[0].items.map((item) => item.focusPercent)).toEqual([72, 81, 64]);
    expect(ranking.cards[0].items.map((item) => item.comparisonPercent)).toEqual([68, 77, 61]);
    expect(ranking.cards[0].items.map((item) => item.deviation?.label)).toEqual([
      '+4 Pp',
      '+4 Pp',
      '+3 Pp',
    ]);

    expect(ranking.cards[1].items.map((item) => item.focusPercent)).toEqual([47, 58, 51]);
    expect(ranking.cards[1].items.map((item) => item.deviation?.label)).toEqual([
      '−5 Pp',
      '−4 Pp',
      '−4 Pp',
    ]);

    // „gegenüber" ausgeschrieben, nicht „ggü.".
    expect(cardSubtitles(fixture.nativeElement)).toEqual([
      'gegenüber Landesmittelwert',
      'gegenüber Landesmittelwert',
    ]);
    expect(fixture.nativeElement.textContent).toContain('gegenüber 68 %');
    expect(fixture.nativeElement.textContent).not.toContain('ggü.');
  });

  it('setzt das aria-label der Δ-Pille auf den Bezug', () => {
    const ranking = create(FIXTURE_SOLUTION_RATES, {
      comparison: 'state:state-average',
    }).componentInstance.ranking();
    expect(ranking.cards[0].items[0].deviation?.ariaLabel).toBe(
      'Klasse 8a gegenüber Landesmittelwert: 4 Prozentpunkte besser',
    );
  });

  it('wechselt über die Zeile Vergleichswerte zurück auf „ohne Vergleich"', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES, { comparison: 'state:state-average' });
    const component = fixture.componentInstance;
    expect(component.hasComparison()).toBe(true);

    component.selectComparison(undefined);
    fixture.detectChanges();

    expect(component.hasComparison()).toBe(false);
    expect(component.ranking().cards[0].title).toBe('Höchste Lösungsquoten');
    expect(component.ranking().cards[0].items.map((item) => item.focusPercent)).toEqual([
      81, 72, 69,
    ]);
  });

  it('bietet einen Testheft-Umschalter und rankt je Heft neu', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_TWO_BOOKLETS);
    const component = fixture.componentInstance;

    expect(component.hasBookletSwitch()).toBe(true);
    expect(component.bookletList()).toEqual(['V8-2026-DE-HSA', 'V8-2026-DE-MSA']);
    expect(component.ranking().cards[0].items.map((item) => item.focusPercent)).toEqual([
      81, 72, 64,
    ]);

    component.setBooklet('V8-2026-DE-MSA');
    fixture.detectChanges();
    expect(component.ranking().cards[0].items.map((item) => item.focusPercent)).toEqual([
      65, 55, 50,
    ]);
  });

  it('begrenzt jede Karte auf count', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES, { count: 2 });
    const ranking = fixture.componentInstance.ranking();

    expect(ranking.cards[0].items.length).toBe(2);
    expect(ranking.cards[1].items.length).toBe(2);
    expect(ranking.cards[0].items.map((item) => item.focusPercent)).toEqual([81, 72]);
    expect(ranking.cards[1].items.map((item) => item.focusPercent)).toEqual([47, 51]);
  });

  it('zeigt keinen Wert in beiden Karten, wenn weniger als zweimal count Werte vorliegen', () => {
    // Acht Werte, count 5: die Stärken-Karte nimmt fünf, die Schwächen-Karte nur die übrigen drei.
    const fixture = create(FIXTURE_SOLUTION_RATES, { count: 5 });
    const ranking = fixture.componentInstance.ranking();

    const strengthKeys = ranking.cards[0].items.map((item) => item.key);
    const weaknessKeys = ranking.cards[1].items.map((item) => item.key);

    expect(ranking.cards[0].items.length).toBe(5);
    expect(ranking.cards[1].items.length).toBe(3);
    expect(weaknessKeys.some((entry) => strengthKeys.includes(entry))).toBe(false);
    expect(new Set([...strengthKeys, ...weaknessKeys]).size).toBe(8);
  });

  it('rendert nichts bei leerem Array und ohne Aggregationen', () => {
    expect(create([]).componentInstance.hasContent()).toBe(false);
    expect(create([]).nativeElement.querySelector('.card')).toBeNull();
    expect(create(FIXTURE_SOLUTION_RATES_EMPTY).componentInstance.hasContent()).toBe(false);
  });

  it('setzt Schulsicht und Landesvergleich zusammen und rankt je Heft über alle Kompetenztypen', () => {
    const school = FIXTURE_SCENARIO_SCHOOL_COMPETENCE.filter((group) => group.type === 'school');
    const state = FIXTURE_SCENARIO_STATES_COMPETENCE.filter((group) => group.type === 'state');
    const fixture = create([...school, ...state]);
    const component = fixture.componentInstance;

    expect(component.hasBookletSwitch()).toBe(true);
    expect(component.bookletList()).toEqual(['DE-HSA', 'DE-MSA', 'MA-MSA']);

    // DE-HSA ohne Vergleich: Kompetenz- und Domänen-Einträge konkurrieren in einer Rangfolge.
    let ranking = component.ranking();
    expect(ranking.showBlock).toBe(true);
    expect(ranking.cards[0].items.map((item) => item.name)).toEqual(['Lesen', 'Orthografie', 'D1']);
    expect(ranking.cards[0].items.map((item) => item.block)).toEqual([
      'Domäne',
      'Domäne',
      'Kompetenz',
    ]);
    expect(ranking.cards[0].items.map((item) => item.focusPercent)).toEqual([57, 57, 55]);
    expect(ranking.cards[1].items.map((item) => item.focusPercent)).toEqual([49, 55]);

    // Mathematik liegt in einem anderen Heft (MA-MSA): Kompetenz und Leitidee werden gemeinsam gerankt.
    component.setBooklet('MA-MSA');
    fixture.detectChanges();
    ranking = component.ranking();
    expect(ranking.cards[0].items.map((item) => item.name)).toEqual(['K2', 'L1', 'K1']);
    expect(ranking.cards[0].items.map((item) => item.block)).toEqual([
      'Kompetenz',
      'Leitidee',
      'Kompetenz',
    ]);
    expect(ranking.cards[0].items.map((item) => item.focusPercent)).toEqual([62, 56, 54]);
  });

  it('rankt mit Landesvergleich nach Δ und nimmt den Vergleich nur aus dem aktiven Heft', () => {
    const school = FIXTURE_SCENARIO_SCHOOL_COMPETENCE.filter((group) => group.type === 'school');
    const state = FIXTURE_SCENARIO_STATES_COMPETENCE.filter((group) => group.type === 'state');
    const fixture = create([...school, ...state], { comparison: 'state:7' });
    const ranking = fixture.componentInstance.ranking();

    expect(ranking.hasComparison).toBe(true);
    expect(ranking.cards.map((card) => card.title)).toEqual(['Stärken', 'Schwächen']);
    expect(ranking.cards.map((card) => card.subtitle)).toEqual([
      'gegenüber Beispielland',
      'gegenüber Beispielland',
    ]);
    // DE-HSA: Δ Lesen +1, Orthografie +1, D3 ±0, D1 −2, D2 −6; die Vergleichsquoten stammen aus DE-HSA.
    expect(ranking.cards[0].items.map((item) => item.name)).toEqual(['Lesen', 'Orthografie', 'D3']);
    expect(ranking.cards[0].items.map((item) => item.focusPercent)).toEqual([57, 57, 55]);
    expect(ranking.cards[0].items.map((item) => item.comparisonPercent)).toEqual([56, 56, 55]);
    expect(ranking.cards[1].items.map((item) => item.name)).toEqual(['D2', 'D1']);
  });

  it('hält denselben Code in zwei Kompetenztypen getrennt, ohne Track-Kollision', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_READING_STYLES);
    const ranking = fixture.componentInstance.ranking();

    expect(ranking.showBlock).toBe(true);
    // „detailliert" kommt in Lese- und Hörstil vor; die Track-Schlüssel bleiben getrennt.
    const keys = [...ranking.cards[0].items, ...ranking.cards[1].items].map((item) => item.key);
    expect(keys).toContain('type:Lesestil|Lesestil.detailliert');
    expect(keys).toContain('type:Hörstil|Hörstil.detailliert');
    expect(new Set(keys).size).toBe(keys.length);

    expect(ranking.cards[0].items.map((item) => [item.name, item.block])).toEqual([
      ['suchend', 'Lesestil'],
      ['selektiv', 'Hörstil'],
      ['detailliert', 'Lesestil'],
    ]);
    expect(ranking.cards[1].items.map((item) => [item.name, item.block])).toEqual([
      ['detailliert', 'Hörstil'],
    ]);

    // Beide „detailliert"-Zeilen rendern nebeneinander, ohne doppelten Track-Schlüssel.
    expect(fixture.nativeElement.querySelectorAll('.card li').length).toBe(4);
    expect(fixture.nativeElement.textContent).toContain('detailliert');
  });

  it('nimmt bei gleicher Id das Schulamt als Hauptgruppe und das Land als Vergleich', () => {
    const authority = FIXTURE_SCENARIO_STATES_COMPETENCE.filter(
      (group) => group.type === 'authority',
    );
    const state = FIXTURE_SCENARIO_STATES_COMPETENCE.filter((group) => group.type === 'state');
    // Schulamt und Land tragen beide die id „7".
    const fixture = create([...authority, ...state], { comparison: 'state:7' });
    const component = fixture.componentInstance;

    expect(component.availableComparisons().map((group) => group.name)).toContain('Beispielland');
    expect(component.hasComparison()).toBe(true);

    const ranking = component.ranking();
    expect(ranking.cards.map((card) => card.subtitle)).toEqual([
      'gegenüber Beispielland',
      'gegenüber Beispielland',
    ]);
    // Die Hauptgruppe bleibt das Schulamt (nicht das Land): der Δ-Bezug nennt es zuerst.
    expect(ranking.cards[0].items[0].deviation?.ariaLabel).toContain(
      'Schulamt Nordmark gegenüber Beispielland',
    );

    // Der bloße Name trifft keine Gruppe, nur der Schlüssel typ:id.
    const byName = create([...authority, ...state], { comparison: 'Beispielland' });
    expect(byName.componentInstance.hasComparison()).toBe(false);
  });

  it('zeigt zwei schlichte Karten ohne Farbrand, Schatten und Icon', () => {
    const element: HTMLElement = create(FIXTURE_SOLUTION_RATES).nativeElement;

    const cards = element.querySelectorAll('.card');
    expect(cards.length).toBe(2);
    for (const card of Array.from(cards)) {
      expect(card.getAttribute('style')).toBeNull();
      expect(card.classList.contains('shadow-sm')).toBe(false);
      expect(card.classList.contains('tba3-rank-card')).toBe(false);
    }
    // Keine Icon-Kreise, kein Pfeil im Titel (Pfeile bedeuten in der Bibliothek nur Δ).
    expect(
      element.querySelectorAll('.card .fa-circle-check, .card .fa-triangle-exclamation').length,
    ).toBe(0);
    expect(element.querySelectorAll('.card-title i').length).toBe(0);
    // Titel als card-title, kein Untertitel ohne Vergleich.
    expect(cardTitles(element)).toEqual(['Höchste Lösungsquoten', 'Niedrigste Lösungsquoten']);
    expect(element.querySelectorAll('.card-subtitle').length).toBe(0);
  });

  it('setzt die Listenzeilen ohne Trennlinie wie die Lösungsquoten', () => {
    const element: HTMLElement = create(FIXTURE_SOLUTION_RATES).nativeElement;
    const items = element.querySelectorAll('.card li');
    expect(items.length).toBeGreaterThan(0);
    for (const item of Array.from(items)) {
      expect(item.classList.contains('border-bottom')).toBe(false);
    }
  });

  it('zeigt die Quoten als Text ohne Pille ohne Vergleich', () => {
    const element: HTMLElement = create(FIXTURE_SOLUTION_RATES).nativeElement;
    expect(element.querySelectorAll('.badge.rounded-pill').length).toBe(0);

    const cards = element.querySelectorAll('.card');
    const nums = (card: Element) =>
      Array.from(card.querySelectorAll('.tba3-num')).map((n) => n.textContent?.trim());
    expect(nums(cards[0])).toEqual(['81 %', '72 %', '69 %']);
    expect(nums(cards[1])).toEqual(['47 %', '51 %', '58 %']);
  });

  it('nutzt den Baustein aggregation-value: Kennung fett, Name nicht small', () => {
    const element: HTMLElement = create(FIXTURE_SOLUTION_RATES).nativeElement;
    const values = element.querySelectorAll('tba3-aggregation-value');
    expect(values.length).toBe(6);
    // Domäne wird bei zwei Domänen als Sekundärinfo angezeigt.
    expect(element.textContent).toContain('Lesen');
    // Kein small am Namen: der Name steht in einem schlichten span ohne small-Klasse.
    expect(element.querySelectorAll('tba3-aggregation-value .small.fw-semibold').length).toBe(0);
  });

  it('zeigt Titel, Untertitel und je Zeile eine Δ-Pille mit Vergleich', () => {
    const element: HTMLElement = create(FIXTURE_SOLUTION_RATES, {
      comparison: 'state:state-average',
    }).nativeElement;

    expect(cardTitles(element)).toEqual(['Stärken', 'Schwächen']);
    expect(cardSubtitles(element)).toEqual([
      'gegenüber Landesmittelwert',
      'gegenüber Landesmittelwert',
    ]);

    const cards = element.querySelectorAll('.card');
    expect(cards[0].querySelectorAll('tba3-delta .badge.rounded-pill').length).toBe(3);
    expect(cards[1].querySelectorAll('tba3-delta .badge.rounded-pill').length).toBe(3);
    // Der Pfeil steht vor der Zahl (fa-arrow-up bei +).
    const firstStrength = cards[0].querySelector('tba3-delta .badge.rounded-pill');
    expect(firstStrength?.querySelector('.fa-arrow-up')).not.toBeNull();
  });

  it('lässt die Δ-Pille unter der Schwelle neutral und färbt sie ab der Schwelle', () => {
    const element: HTMLElement = create(FIXTURE_SOLUTION_RATES, {
      comparison: 'state:state-average',
    }).nativeElement;
    const cards = element.querySelectorAll('.card');

    const firstStrength = cards[0].querySelector<HTMLElement>('.badge.rounded-pill');
    expect(firstStrength?.textContent?.trim()).toContain('+4 Pp');
    // +4 Pp liegt unter der Default-Schwelle 5: neutral (grau).
    expect(firstStrength?.style.color).toBe('var(--tba3-deviation-neutral)');

    const firstWeakness = cards[1].querySelector<HTMLElement>('.badge.rounded-pill');
    expect(firstWeakness?.textContent?.trim()).toContain('−5 Pp');
    expect(firstWeakness?.style.color).toBe('var(--tba3-deviation-worse)');
  });

  it('färbt bei deviationThreshold 0 jede Abweichung', () => {
    const element: HTMLElement = create(FIXTURE_SOLUTION_RATES, {
      comparison: 'state:state-average',
      deviationThreshold: 0,
    }).nativeElement;
    const firstStrength = element.querySelector<HTMLElement>('.card .badge.rounded-pill');
    expect(firstStrength?.textContent?.trim()).toContain('+4 Pp');
    expect(firstStrength?.style.color).toBe('var(--tba3-deviation-better)');
  });

  it('bietet die Vergleichswerte als segmentierte Einfachauswahl mit aria-pressed', () => {
    const element: HTMLElement = create(FIXTURE_SOLUTION_RATES).nativeElement;
    const group = element.querySelector('[tba3Comparisons].btn-group');
    expect(group).not.toBeNull();

    const buttons = Array.from(group!.querySelectorAll('button'));
    expect(buttons.map((b) => b.textContent?.trim())).toEqual([
      'Ohne Vergleich',
      'Schule',
      'Landesmittelwert',
    ]);
    // „Ohne Vergleich" ist aktiv und gedrückt.
    expect(buttons[0].classList.contains('active')).toBe(true);
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
    // Kein select-Feld.
    expect(element.querySelector('select')).toBeNull();
  });

  it('nutzt keine Bootstrap-Statusfarben im DOM', () => {
    const element: HTMLElement = create(FIXTURE_SOLUTION_RATES, {
      comparison: 'state:state-average',
    }).nativeElement;
    expect(
      element.querySelectorAll(
        '.text-success, .text-warning, .bg-success-subtle, .bg-warning-subtle, .bg-danger',
      ).length,
    ).toBe(0);
  });

  it('zeigt die Filterzeile nur bei mehreren Heften, nicht bei einem', () => {
    // Ein Heft: kein Umschalter, keine Testheft-Zeile im Bedienfeld.
    const single: HTMLElement = create(FIXTURE_SOLUTION_RATES).nativeElement;
    expect(single.querySelector('tba3-booklet-switch')).toBeNull();
    expect(single.textContent).not.toContain('Testheft');

    // Mehrere Hefte: die Testheft-Zeile erscheint.
    const many: HTMLElement = create(FIXTURE_SOLUTION_RATES_TWO_BOOKLETS).nativeElement;
    expect(many.querySelector('tba3-booklet-switch')).not.toBeNull();
    expect(many.textContent).toContain('Testheft');
  });

  it('projiziert Host-Text über die Slots auch im Leerzustand', () => {
    const fixture = TestBed.createComponent(SlotHost);
    fixture.componentInstance.data = [];
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.card')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-role="header"]')?.textContent).toContain(
      'Titel',
    );
    expect(fixture.nativeElement.querySelector('[data-role="footer"]')?.textContent).toContain(
      'Quelle',
    );
  });

  it('stellt den Header vor, den Footer nach die Karten', () => {
    const fixture = TestBed.createComponent(SlotHost);
    fixture.componentInstance.data = FIXTURE_SOLUTION_RATES;
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('tba3-solution-rates-ranking') as HTMLElement;
    const nodes = Array.from(root.children) as HTMLElement[];
    const headerIndex = nodes.findIndex((node) => node.getAttribute('data-role') === 'header');
    const footerIndex = nodes.findIndex((node) => node.getAttribute('data-role') === 'footer');
    const rowIndex = nodes.findIndex((node) => node.classList.contains('row'));
    expect(rowIndex).toBeGreaterThanOrEqual(0);
    expect(headerIndex).toBeLessThan(rowIndex);
    expect(footerIndex).toBeGreaterThan(rowIndex);
  });
});

@Component({
  standalone: true,
  imports: [SolutionRatesRankingComponent],
  template: `
    <tba3-solution-rates-ranking [aggregations]="data">
      <p tba3Header data-role="header">Titel</p>
      <p tba3Footer data-role="footer">Quelle</p>
    </tba3-solution-rates-ranking>
  `,
})
class SlotHost {
  data: AggregationsValueGroup[] = [];
}

@Component({
  imports: [SolutionRatesRankingComponent],
  template: `<tba3-solution-rates-ranking [aggregations]="data">
    <div tba3Header>Kopf-Slot</div>
    <div tba3Footer>Fuß-Slot</div>
  </tba3-solution-rates-ranking>`,
})
class EmptyStateHost {
  data: typeof FIXTURE_SOLUTION_RATES = [];
}

describe('SolutionRatesRankingComponent Leerzustand', () => {
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
