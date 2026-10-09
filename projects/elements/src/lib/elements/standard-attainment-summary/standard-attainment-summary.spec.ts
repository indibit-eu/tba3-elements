import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { StandardAttainmentSummaryComponent } from './standard-attainment-summary';
import type { AggregationsValueGroup } from '../../model';
import {
  FIXTURE_STANDARD_ATTAINMENT_SUMMARY,
  FIXTURE_STANDARD_ATTAINMENT_SUMMARY_EMPTY,
  FIXTURE_STANDARD_ATTAINMENT_SUMMARY_NO_COMPARISON,
  FIXTURE_STANDARD_ATTAINMENT_SUMMARY_TWO_SUBJECTS,
} from '../../../fixtures/standard-attainment-summary';
import { FIXTURE_SCENARIO_SCHOOL_MINIMUM_CLASSIFICATION } from '../../../fixtures/scenario';

function render(data: unknown): { text: string; cards: NodeListOf<Element>; root: HTMLElement } {
  const fixture = TestBed.createComponent(StandardAttainmentSummaryComponent);
  fixture.componentRef.setInput('aggregations', data);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  // Geschützte Leerzeichen vor „%" normalisieren.
  const text = (root.textContent ?? '').replace(/ /g, ' ');
  return { text, cards: root.querySelectorAll('tba3-stat-card'), root };
}

describe('StandardAttainmentSummaryComponent', () => {
  it('rendert drei Karten mit den Anteilen und Differenzen', () => {
    const { text, cards, root } = render(FIXTURE_STANDARD_ATTAINMENT_SUMMARY);
    expect(cards.length).toBe(3);

    // Anteile der Hauptgruppe: 85 % / 15 % / 30 %.
    expect(text).toContain('85 %');
    expect(text).toContain('15 %');
    expect(text).toContain('30 %');

    // Zwei Vergleichszeilen je Karte: die Vergleichsschulen (comparisonSchool) und das Land.
    expect(text).toContain('Vergleichsschulen');
    expect(text).toContain('Landesmittelwert');

    // Ein Fach, also keine Blockzeile und keine Trennlinie.
    expect(root.querySelectorAll('h4.h5').length).toBe(0);
    expect(root.querySelectorAll('hr').length).toBe(0);

    // Karte „Mindeststandard erreicht" gegen Land: 85 − 82 = +3, günstig.
    const reached = cards[0] as HTMLElement;
    expect(reached.textContent).toContain('+3 Pp');
    const reachedDiff = reached.querySelector(
      '[aria-label="Gesamtschule Birkenmoor gegenüber Landesmittelwert: 3 Prozentpunkte besser"]',
    );
    expect(reachedDiff).not.toBeNull();

    // Karte „Unter Mindeststandard" gegen Land: 15 − 18 = −3, hier günstig; Pfeil nach unten.
    const below = cards[1] as HTMLElement;
    expect(below.textContent).toContain('−3 Pp');
    const belowDiff = below.querySelector(
      '[aria-label="Gesamtschule Birkenmoor gegenüber Landesmittelwert: 3 Prozentpunkte besser"]',
    );
    expect(belowDiff).not.toBeNull();
    expect(below.querySelector('.fa-arrow-down')).not.toBeNull();

    // Je Karte ein Kennzahltitel als Heading, die Kennzahl in Textfarbe ohne Inline-Farbe.
    expect(root.querySelectorAll('h4.card-title.h6').length).toBe(3);
    for (const card of Array.from(cards)) {
      const value = card.querySelector('.fs-3.fw-semibold') as HTMLElement;
      expect(value.getAttribute('style')).toBeNull();
    }
  });

  it('zeigt je Fach eine Kartenreihe mit Blockzeile und Trennlinie', () => {
    const { text, cards, root } = render(FIXTURE_STANDARD_ATTAINMENT_SUMMARY_TWO_SUBJECTS);
    // Zwei Fächer: zwei Reihen à drei Karten.
    expect(cards.length).toBe(6);

    // Je Fach eine Blockzeile, dazwischen eine Trennlinie.
    const headings = Array.from(root.querySelectorAll('h4.h5')).map((node) =>
      node.textContent?.trim(),
    );
    expect(headings).toEqual(['Deutsch', 'Mathematik']);
    expect(root.querySelectorAll('hr').length).toBe(1);

    // Deutsch: 84 % / 16 % / 30 %, Mathematik: 90 % / 10 % / 25 %.
    expect(text).toContain('84 %');
    expect(text).toContain('16 %');
    expect(text).toContain('90 %');
    expect(text).toContain('10 %');
    expect(text).toContain('25 %');

    // Beide Fächer tragen den Landesmittelwert als Vergleich.
    expect(root.querySelectorAll('section').length).toBe(2);
    for (const section of Array.from(root.querySelectorAll('section'))) {
      expect(section.textContent).toContain('Landesmittelwert');
    }
  });

  it('verarbeitet das Backend-Format (numerische Ids, comparisonSchool, Kleinschreibung)', () => {
    // Schule mit zwei Fächern, Vergleichsschulen ohne id und Kurse als feinere Teilgruppen.
    const { text, cards, root } = render(FIXTURE_SCENARIO_SCHOOL_MINIMUM_CLASSIFICATION);
    // Zwei Fächer: zwei Reihen à drei Karten mit Blockzeile und Trennlinie.
    expect(cards.length).toBe(6);
    const headings = Array.from(root.querySelectorAll('h4.h5')).map((node) =>
      node.textContent?.trim(),
    );
    expect(headings).toEqual(['Deutsch', 'Mathematik']);
    expect(root.querySelectorAll('hr').length).toBe(1);

    // „Regelstandard plus" (kleines p) zählt mit: 82 % in Deutsch (8 von 45 darunter).
    expect(text).toContain('82 %');

    // Die Vergleichsschulen erscheinen als Vergleich, die Kurse (feinere Teilgruppen) nicht.
    expect(text).toContain('Vergleichsschulen');
    expect(text).not.toContain('8a Deutsch');
  });

  it('zeigt ohne Vergleichsgruppe keine Vergleichszeilen', () => {
    const { text, cards, root } = render(FIXTURE_STANDARD_ATTAINMENT_SUMMARY_NO_COMPARISON);
    expect(cards.length).toBe(3);
    expect(text).toContain('80 %');
    expect(text).toContain('20 %');
    expect(text).toContain('25 %');
    // Keine Δ-Zeile, also keine „Pp"-Angabe und keine Pille.
    expect(text).not.toContain('Pp');
    expect(root.querySelectorAll('tba3-delta').length).toBe(0);
    expect(root.querySelectorAll('hr').length).toBe(0);
  });

  it('überspringt eine Vergleichsgruppe ohne Classifications', () => {
    // Trägt minimumClassification, zählt aber niemanden.
    const emptyComparison: AggregationsValueGroup = {
      id: 'school-ohne-daten',
      type: 'school',
      name: 'Schule ohne Standarddaten',
      subject: { name: 'Deutsch' },
      aggregations: [
        {
          type: 'minimumClassification',
          value: 'unter Mindeststandard',
          descriptiveStatistics: { total: 0, mean: 0, frequency: 0, standardDeviation: 0 },
        },
      ],
    };
    const { text, cards } = render([...FIXTURE_STANDARD_ATTAINMENT_SUMMARY, emptyComparison]);

    expect(cards.length).toBe(3);
    // Die beiden echten Vergleichsgruppen bleiben.
    expect(text).toContain('Vergleichsschulen');
    expect(text).toContain('Landesmittelwert');
    // Die leere Vergleichsgruppe erscheint nicht.
    expect(text).not.toContain('Schule ohne Standarddaten');
  });

  it('übergeht Value-Groups ohne minimumClassification bei der Rollenaufteilung', () => {
    // Eine vorangestellte Value-Group anderer Aggregationsart wird nicht Hauptgruppe.
    const covariates: AggregationsValueGroup = {
      id: 'school-birkenmoor',
      type: 'school',
      name: 'Gesamtschule Birkenmoor',
      aggregations: [
        {
          type: 'students-by-gender',
          value: 'female',
          descriptiveStatistics: { total: 100, mean: 0.5, frequency: 50, standardDeviation: 0 },
        },
      ],
    };
    const { text, cards } = render([covariates, ...FIXTURE_STANDARD_ATTAINMENT_SUMMARY]);
    expect(cards.length).toBe(3);
    expect(text).toContain('85 %');
    expect(text).toContain('Gesamtschule Birkenmoor');
  });

  it('rendert bei leerem Array keine Karten', () => {
    const { root } = render([]);
    expect(root.querySelectorAll('tba3-stat-card').length).toBe(0);
    expect(root.querySelector('.row')).toBeNull();
  });

  it('zeigt bei leerer Verteilung Karten ohne Wert und ohne Vergleiche', () => {
    const { text, cards, root } = render(FIXTURE_STANDARD_ATTAINMENT_SUMMARY_EMPTY);
    expect(cards.length).toBe(3);
    expect(text).toContain('–');
    expect(text).not.toContain('Pp');
    expect(root.querySelectorAll('tba3-delta').length).toBe(0);
    expect(root.querySelectorAll('hr').length).toBe(0);
  });

  it('projiziert Host-Text über die Slots, Header vor den Reihen, Footer danach', () => {
    const fixture = TestBed.createComponent(SlotHost);
    fixture.componentInstance.data = FIXTURE_STANDARD_ATTAINMENT_SUMMARY;
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector(
      'tba3-standard-attainment-summary',
    ) as HTMLElement;
    const nodes = Array.from(root.children) as HTMLElement[];
    const headerIndex = nodes.findIndex((node) => node.getAttribute('data-role') === 'header');
    const footerIndex = nodes.findIndex((node) => node.getAttribute('data-role') === 'footer');
    const sectionIndex = nodes.findIndex((node) => node.tagName.toLowerCase() === 'section');
    expect(sectionIndex).toBeGreaterThanOrEqual(0);
    expect(headerIndex).toBeLessThan(sectionIndex);
    expect(footerIndex).toBeGreaterThan(sectionIndex);
  });

  it('projiziert die Slots auch im Leerzustand', () => {
    const fixture = TestBed.createComponent(SlotHost);
    fixture.componentInstance.data = [];
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.row')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-role="header"]')?.textContent).toContain(
      'Titel',
    );
    expect(fixture.nativeElement.querySelector('[data-role="footer"]')?.textContent).toContain(
      'Quelle',
    );
  });
});

@Component({
  standalone: true,
  imports: [StandardAttainmentSummaryComponent],
  template: `
    <tba3-standard-attainment-summary [aggregations]="data">
      <p tba3Header data-role="header">Titel</p>
      <p tba3Footer data-role="footer">Quelle</p>
    </tba3-standard-attainment-summary>
  `,
})
class SlotHost {
  data: AggregationsValueGroup[] = [];
}

@Component({
  imports: [StandardAttainmentSummaryComponent],
  template: `<tba3-standard-attainment-summary [aggregations]="data">
    <div tba3Header>Kopf-Slot</div>
    <div tba3Footer>Fuß-Slot</div>
  </tba3-standard-attainment-summary>`,
})
class EmptyStateHost {
  data: typeof FIXTURE_STANDARD_ATTAINMENT_SUMMARY = [];
}

describe('StandardAttainmentSummaryComponent Leerzustand', () => {
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
