import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { SolutionRatesComponent } from './solution-rates';
import type { AggregationsValueGroup } from '../../model';
import {
  EXAMPLE_SOLUTION_RATE_LINKS,
  FIXTURE_SOLUTION_RATES,
  FIXTURE_SOLUTION_RATES_COMPETENCE_TYPES,
  FIXTURE_SOLUTION_RATES_EMPTY,
  FIXTURE_SOLUTION_RATES_EXERCISES,
  FIXTURE_SOLUTION_RATES_READING_STYLES,
  FIXTURE_SOLUTION_RATES_TWO_BOOKLETS,
} from '../../../fixtures/solution-rates';
import {
  FIXTURE_SCENARIO_SCHOOL_COMPETENCE,
  FIXTURE_SCENARIO_STATES_COMPETENCE,
} from '../../../fixtures/scenario';

function create(data: unknown, inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(SolutionRatesComponent);
  fixture.componentRef.setInput('aggregations', data);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  return fixture;
}

/** Alle `<li>`-Zeilen eines Blocks. */
function rows(fixture: ReturnType<typeof create>, sectionIndex: number): HTMLLIElement[] {
  const section = fixture.nativeElement.querySelectorAll('section')[sectionIndex];
  return Array.from(section.querySelectorAll('ul > li'));
}

/** Die Balken (`.progress-bar`) einer Zeile; der erste ist der Hauptbalken. */
function bars(row: HTMLLIElement): HTMLElement[] {
  return Array.from(row.querySelectorAll('.progress-bar'));
}

/** Die Δ-Pillen (`.badge`) einer Zeile, je Vergleich eine. */
function pills(row: HTMLLIElement): HTMLElement[] {
  return Array.from(row.querySelectorAll('.badge'));
}

describe('SolutionRatesComponent', () => {
  it('zeigt ohne Auswahl je Domäne einen Block mit den Hauptgruppen-Quoten', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES);
    const sections = fixture.componentInstance.sections();

    expect(sections.map((section) => section.labelParts)).toEqual([['Lesen'], ['Orthografie']]);
    for (const section of sections) {
      expect(section.values.length).toBe(4);
      expect(section.hasComparisons).toBe(false);
    }

    // Kein Canvas im DOM: das Element rendert eine HTML-Liste, kein Diagramm.
    expect(fixture.nativeElement.querySelector('canvas')).toBeNull();
    // Zwei Domänen mit je vier Werten, je Zeile ein Balken.
    expect(fixture.nativeElement.querySelectorAll('.progress').length).toBe(8);

    // Je Zeile genau ein Balken in der Hauptbalkenfarbe (keine Wertung am Balken).
    const lesen = rows(fixture, 0);
    expect(lesen.length).toBe(4);
    const first = bars(lesen[0]);
    expect(first.length).toBe(1);
    expect(first[0].style.width).toBe('72%');
    expect(first[0].style.backgroundColor).toBe('var(--tba3-bar)');
    expect(lesen[0].textContent).toContain('2.2.1');
    expect(lesen[0].textContent).toContain('72 %');

    // Balkenhöhe kommt aus der Klasse, kein Inline-Style.
    expect(lesen[0].querySelector('.progress')?.classList.contains('tba3-bar')).toBe(true);
    expect(lesen[0].querySelector('.progress')?.getAttribute('style')).toBeNull();
    // Ohne Vergleich keine Δ-Pille und keine Labelspalte.
    expect(pills(lesen[0]).length).toBe(0);
    expect(lesen[0].querySelector('.tba3-bar-label')).toBeNull();
  });

  it('macht das n für Screenreader lesbar und schneidet den Balken nicht ab', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES);
    const lesen = rows(fixture, 0);

    // Der Balken trägt kein title-Attribut, das n steht als versteckter Text daneben.
    const track = lesen[0].querySelector('.progress') as HTMLElement;
    expect(track.getAttribute('title')).toBeNull();
    const hidden = lesen[0].querySelector('.visually-hidden') as HTMLElement;
    expect(hidden?.textContent).toContain('83 von 115 richtig gelöst');
  });

  it('zeigt Vergleichsnamen ohne Abschneiden (kein text-truncate, kein title)', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES, { comparisons: ['state:state-average'] });
    const label = rows(fixture, 0)[0].querySelector('.tba3-bar-label') as HTMLElement;
    expect(label.classList.contains('text-truncate')).toBe(false);
    expect(label.getAttribute('title')).toBeNull();
  });

  it('setzt eine Blockzeile je Domäne, den Divider nur dazwischen', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES);
    const headings = Array.from(fixture.nativeElement.querySelectorAll('h4')) as HTMLElement[];
    expect(headings.map((heading) => heading.textContent?.replace(/·/g, '').trim())).toEqual([
      'Lesen',
      'Orthografie',
    ]);
    // Keine Unterstreichung an der Blockzeile.
    for (const heading of headings) {
      expect(heading.classList.contains('border-bottom')).toBe(false);
    }
    // Genau ein Divider zwischen den zwei Blöcken, keiner darunter.
    expect(fixture.nativeElement.querySelectorAll('hr').length).toBe(1);
  });

  it('zeigt Vergleiche als eigene Balken mit Δ-Pille und Labelspalte', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES, { comparisons: ['state:state-average'] });
    const section = fixture.componentInstance.sections()[0];
    expect(section.hasComparisons).toBe(true);

    const lesen = rows(fixture, 0);
    // 2.2.1: Hauptbalken plus ein Vergleichsbalken, feste Farben ohne Wertung am Balken.
    const twoBars = bars(lesen[0]);
    expect(twoBars.length).toBe(2);
    expect(twoBars[0].style.backgroundColor).toBe('var(--tba3-bar)');
    expect(twoBars[1].style.backgroundColor).toBe('var(--tba3-bar-comparison)');

    // Labelspalte links (Gruppenname der Hauptgruppe), Vergleichsname als Labelspalte des Vergleichs.
    const labels = Array.from(lesen[0].querySelectorAll('.tba3-bar-label')) as HTMLElement[];
    expect(labels.map((label) => label.textContent?.trim())).toEqual([
      'Klasse 8a',
      'Landesmittelwert',
    ]);

    // Eine Δ-Pille je Vergleich, Bezug im aria-label sichtbar-äquivalent.
    const pill = pills(lesen[0])[0];
    expect(pill).toBeTruthy();
    expect(pill.getAttribute('aria-label')).toContain('Klasse 8a gegenüber Landesmittelwert');
  });

  it('hält die Δ-Pille unter der Schwelle neutral, ab der Schwelle farbig', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES, { comparisons: ['state:state-average'] });

    // Lesen 2.2.1: 72 gegenüber Land 68 → +4 Pp, unter Default-Schwelle 5 → neutral.
    const lesen0 = pills(rows(fixture, 0)[0])[0];
    expect(lesen0.textContent).toContain('+4 Pp');
    expect(lesen0.style.color).toBe('var(--tba3-deviation-neutral)');

    // Orthografie 4.2.3: 47 gegenüber Land 52 → −5 Pp, ab der Schwelle → farbig (schlechter).
    const ortho3 = pills(rows(fixture, 1)[3])[0];
    expect(ortho3.textContent).toContain('−5 Pp');
    expect(ortho3.style.color).toBe('var(--tba3-deviation-worse)');
  });

  it('färbt mit deviationThreshold 0 jede Pille außer ±0', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES, {
      comparisons: ['state:state-average'],
      deviationThreshold: 0,
    });
    // 72 gegenüber 68 → +4 Pp, mit Schwelle 0 farbig (besser).
    const lesen0 = pills(rows(fixture, 0)[0])[0];
    expect(lesen0.style.color).toBe('var(--tba3-deviation-better)');
  });

  it('zeigt zwei Vergleichsgruppen als drei Balken je Zeile', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES, {
      comparisons: ['school:school-average', 'state:state-average'],
    });
    const lesen = rows(fixture, 0);

    const threeBars = bars(lesen[1]);
    expect(threeBars.length).toBe(3);
    expect(threeBars[0].style.backgroundColor).toBe('var(--tba3-bar)');
    expect(threeBars[1].style.backgroundColor).toBe('var(--tba3-bar-comparison)');
    expect(threeBars[2].style.backgroundColor).toBe('var(--tba3-bar-comparison)');
    // Zwei Vergleiche, zwei Δ-Pillen.
    expect(pills(lesen[1]).length).toBe(2);
  });

  it('wechselt Werte je Testheft und blendet Vergleiche nur aus dem aktiven Heft ein', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_TWO_BOOKLETS, {
      comparisons: ['state:state-average'],
    });
    const component = fixture.componentInstance;

    expect(component.hasBookletSwitch()).toBe(true);
    expect(component.bookletList()).toEqual(['V8-2026-DE-HSA', 'V8-2026-DE-MSA']);

    let section = component.sections()[0];
    expect(section.values.map((value) => value.bars[0].percent)).toEqual([72, 64, 81]);
    expect(section.values.map((value) => value.bars[1].percent)).toEqual([68, 61, 77]);

    component.setBooklet('V8-2026-DE-MSA');
    fixture.detectChanges();
    section = component.sections()[0];
    expect(section.values.map((value) => value.bars[0].percent)).toEqual([65, 55, 50]);
    expect(section.values.map((value) => value.bars[1].percent)).toEqual([71, 64, 58]);
  });

  it('zeigt bei einer Domäne keine Blockzeile, mit Aufgabenname und Link', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_EXERCISES, {
      links: EXAMPLE_SOLUTION_RATE_LINKS,
    });
    const sections = fixture.componentInstance.sections();

    expect(sections.length).toBe(1);
    expect(sections[0].labelParts).toEqual([]);
    expect(fixture.nativeElement.querySelector('h4')).toBeNull();
    expect(fixture.nativeElement.querySelector('hr')).toBeNull();
    expect(sections[0].values.map((value) => value.bars[0].percent)).toEqual([74, 66, 58, 71, 49]);
    // Aufgabenname ohne Kennung: kein `code`, der Rohwert ist der Name.
    expect(sections[0].values.every((value) => value.code === undefined)).toBe(true);
    expect(sections[0].values[0].name).toBe('Der Sommer am See');
    // Aufgabenname nicht fett: `aggregation-value` rendert ihn ohne `fw-semibold`.
    expect(rows(fixture, 0)[0].querySelector('tba3-aggregation-value .fw-semibold')).toBeNull();

    const links = fixture.nativeElement.querySelectorAll('a[target="_blank"]');
    expect(links.length).toBe(5);
    expect(fixture.nativeElement.querySelectorAll('.fa-arrow-up-right-from-square').length).toBe(5);
    expect(fixture.nativeElement.textContent).toContain('Aufgabe öffnen');
    expect(links[0].getAttribute('href')).toBe('https://example.org/aufgaben/der-sommer-am-see');
  });

  it('rendert nichts bei leerem Array und ohne Aggregationen', () => {
    expect(create([]).componentInstance.sections().length).toBe(0);
    expect(create(FIXTURE_SOLUTION_RATES_EMPTY).componentInstance.sections().length).toBe(0);
  });

  it('projiziert Host-Text über die Slots auch im Leerzustand', () => {
    const fixture = TestBed.createComponent(SlotHost);
    fixture.componentInstance.data = [];
    fixture.detectChanges();

    // Leerzustand: keine Blöcke, aber Header und Footer bleiben sichtbar.
    expect(fixture.nativeElement.querySelector('section')).toBeNull();
    const header = fixture.nativeElement.querySelector('[data-role="header"]');
    const footer = fixture.nativeElement.querySelector('[data-role="footer"]');
    expect(header?.textContent).toContain('Titel');
    expect(footer?.textContent).toContain('Quelle');
  });

  it('stellt den Header vor den ersten, den Footer nach den letzten Block', () => {
    const fixture = TestBed.createComponent(SlotHost);
    fixture.componentInstance.data = FIXTURE_SOLUTION_RATES;
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('tba3-solution-rates') as HTMLElement;
    const nodes = Array.from(root.children) as HTMLElement[];
    const headerIndex = nodes.findIndex((node) => node.getAttribute('data-role') === 'header');
    const footerIndex = nodes.findIndex((node) => node.getAttribute('data-role') === 'footer');
    const firstSection = nodes.findIndex((node) => node.tagName === 'SECTION');
    expect(firstSection).toBeGreaterThanOrEqual(0);
    expect(headerIndex).toBeLessThan(firstSection);
    expect(footerIndex).toBeGreaterThan(firstSection);
  });

  it('bildet ohne Domäne je Kompetenztyp einen Block und blendet den Landesvergleich ein', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_COMPETENCE_TYPES, {
      comparisons: ['state:7'],
    });
    const sections = fixture.componentInstance.sections();

    // Zwei Aggregationsarten der Value-Group ohne Domäne werden zu zwei Blöcken in Antwortreihenfolge.
    expect(sections.map((section) => section.labelParts)).toEqual([['Kompetenz'], ['Domäne']]);

    const kompetenz = sections[0];
    expect(kompetenz.values.map((value) => value.bars[0].percent)).toEqual([55, 49, 55]);
    expect(kompetenz.hasComparisons).toBe(true);
    // Vergleichswerte des Lands aus demselben Testheft und Block.
    expect(kompetenz.values.map((value) => value.bars[1].percent)).toEqual([57, 55, 55]);

    const domaene = sections[1];
    expect(domaene.values.map((value) => value.bars[0].percent)).toEqual([57, 57]);

    const headings = Array.from(fixture.nativeElement.querySelectorAll('h4')).map((heading) =>
      (heading as HTMLElement).textContent?.trim(),
    );
    expect(headings).toEqual(['Kompetenz', 'Domäne']);
    expect(fixture.nativeElement.querySelectorAll('hr').length).toBe(1);
  });

  it('setzt Schulsicht und Landesvergleich aus getrennten Antworten zusammen und schaltet Hefte', () => {
    const school = FIXTURE_SCENARIO_SCHOOL_COMPETENCE.filter((group) => group.type === 'school');
    const state = FIXTURE_SCENARIO_STATES_COMPETENCE.filter((group) => group.type === 'state');
    const fixture = create([...school, ...state], { comparisons: ['state:7'] });
    const component = fixture.componentInstance;

    expect(component.hasBookletSwitch()).toBe(true);
    expect(component.bookletList()).toEqual(['DE-HSA', 'DE-MSA', 'MA-MSA']);

    let sections = component.sections();
    expect(sections.map((section) => section.labelParts)).toEqual([['Kompetenz'], ['Domäne']]);
    expect(sections[0].values.map((value) => value.bars[0].percent)).toEqual([55, 49, 55]);
    expect(sections[0].values.map((value) => value.bars[1].percent)).toEqual([57, 55, 55]);

    // Mathematik liegt in einem anderen Heft (MA-MSA): Umschalten zeigt die Arten Kompetenz und Leitidee.
    component.setBooklet('MA-MSA');
    fixture.detectChanges();
    sections = component.sections();
    expect(sections.map((section) => section.labelParts)).toEqual([['Kompetenz'], ['Leitidee']]);
    expect(sections[0].values.map((value) => value.bars[0].percent)).toEqual([54, 62]);
    expect(sections[1].values.map((value) => value.bars[0].percent)).toEqual([56, 54, 49]);
  });

  it('hält denselben Code in zwei Kompetenztypen getrennt, ohne Track-Kollision', () => {
    const fixture = create(FIXTURE_SOLUTION_RATES_READING_STYLES);
    const sections = fixture.componentInstance.sections();

    expect(sections.map((section) => section.labelParts)).toEqual([['Lesestil'], ['Hörstil']]);
    expect(sections[0].values.map((value) => [value.key, value.bars[0].percent])).toEqual([
      ['Lesestil.detailliert', 62],
      ['Lesestil.suchend', 71],
    ]);
    expect(sections[1].values.map((value) => [value.key, value.bars[0].percent])).toEqual([
      ['Hörstil.detailliert', 55],
      ['Hörstil.selektiv', 64],
    ]);

    // „detailliert" erscheint in beiden Blöcken; die Zeilen rendern ohne doppelten Track-Schlüssel.
    expect(rows(fixture, 0)[0].textContent).toContain('detailliert');
    expect(rows(fixture, 1)[0].textContent).toContain('detailliert');
  });

  it('nimmt bei gleicher Id das Schulamt als Hauptgruppe und das Land als Vergleich', () => {
    const authority = FIXTURE_SCENARIO_STATES_COMPETENCE.filter(
      (group) => group.type === 'authority',
    );
    const state = FIXTURE_SCENARIO_STATES_COMPETENCE.filter((group) => group.type === 'state');
    const fixture = create([...authority, ...state], { comparisons: ['state:7'] });
    const component = fixture.componentInstance;

    // Schulamt Nordmark und Land tragen beide die id „7": das Schulamt bleibt Hauptgruppe.
    const section = component.sections()[0];
    expect(section.values[0].bars[0].name).toBe('Schulamt Nordmark');
    // Das Land ist ein eingeblendeter Vergleich, nicht mit dem Schulamt verschmolzen.
    expect(section.values[0].bars.some((bar) => bar.name === 'Beispielland')).toBe(true);
    expect(component.availableComparisons().map((group) => group.name)).toContain('Beispielland');
  });
});

@Component({
  standalone: true,
  imports: [SolutionRatesComponent],
  template: `
    <tba3-solution-rates [aggregations]="data">
      <p tba3Header data-role="header">Titel</p>
      <p tba3Footer data-role="footer">Quelle</p>
    </tba3-solution-rates>
  `,
})
class SlotHost {
  data: AggregationsValueGroup[] = [];
}

@Component({
  imports: [SolutionRatesComponent],
  template: `<tba3-solution-rates [aggregations]="data">
    <div tba3Header>Kopf-Slot</div>
    <div tba3Footer>Fuß-Slot</div>
  </tba3-solution-rates>`,
})
class EmptyStateHost {
  data: typeof FIXTURE_SOLUTION_RATES = [];
}

describe('SolutionRatesComponent Leerzustand', () => {
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
