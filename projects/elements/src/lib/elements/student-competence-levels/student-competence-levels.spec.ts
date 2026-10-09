import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { StudentCompetenceLevelsComponent } from './student-competence-levels';
import type { CompetenceLevelsValueGroup } from '../../model';
import {
  EXAMPLE_LEVEL_CATALOG,
  FIXTURE_STUDENT_COMPETENCE_LEVELS,
  FIXTURE_STUDENT_COMPETENCE_LEVELS_EMPTY,
  FIXTURE_STUDENT_COMPETENCE_LEVELS_SINGLE_SUBJECT,
} from '../../../fixtures/student-competence-levels';
import { EXAMPLE_VALUE_LABELS } from '../../../fixtures/example-labels';

function render(data: unknown, options: { catalog?: unknown; labels?: unknown } = {}) {
  const fixture = TestBed.createComponent(StudentCompetenceLevelsComponent);
  fixture.componentRef.setInput('competenceLevels', data);
  if (options.catalog !== undefined) fixture.componentRef.setInput('levelCatalog', options.catalog);
  if (options.labels !== undefined) fixture.componentRef.setInput('valueLabels', options.labels);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return {
    root,
    text: root.textContent ?? '',
    component: fixture.componentInstance,
  };
}

describe('StudentCompetenceLevelsComponent', () => {
  it('zeigt Kopf, Fächer-Untertitel und Domänenkarten', () => {
    const { text, component } = render(FIXTURE_STUDENT_COMPETENCE_LEVELS, {
      catalog: EXAMPLE_LEVEL_CATALOG,
      labels: EXAMPLE_VALUE_LABELS,
    });

    expect(text).toContain('Lea Brandhauer');
    const header = component.header();
    expect(header?.subjects).toEqual(['Deutsch', 'Mathematik']);
    expect(header?.covariates.map((covariate) => `${covariate.label}: ${covariate.value}`)).toEqual(
      ['Geschlecht: weiblich', 'Sprache zu Hause: andere', 'Sozioökonomischer Status: mittel'],
    );

    // Sortiert nach Fach, dann Domäne.
    const cards = component.cards();
    expect(cards.map((card) => card.domain)).toEqual([
      'Lesen',
      'Orthografie',
      'Zuhören',
      'Zahlen und Operationen',
    ]);
    expect(cards.map((card) => card.subject)).toEqual([
      'Deutsch',
      'Deutsch',
      'Deutsch',
      'Mathematik',
    ]);

    const lesen = cards[0];
    expect(lesen.rows.length).toBe(6);
    expect(lesen.rows.map((row) => row.nameShort)).toEqual(['V', 'IV', 'III', 'II', 'Ib', 'Ia']);
    expect(lesen.rows.filter((row) => row.reached).map((row) => row.nameShort)).toEqual(['III']);

    expect(cards[2].noParticipation).toBe(true);
    expect(text).toContain('Ohne Teilnahme');
  });

  it('rendert Personenkarte, Domänenkarten und Katalogtabelle', () => {
    const { root } = render(FIXTURE_STUDENT_COMPETENCE_LEVELS, {
      catalog: EXAMPLE_LEVEL_CATALOG,
      labels: EXAMPLE_VALUE_LABELS,
    });

    const personTitle = root.querySelector('h4.card-title.h5') as HTMLElement;
    expect(personTitle).not.toBeNull();
    expect(personTitle.className).not.toContain('primary');
    const personCard = root.querySelector('.card') as HTMLElement;
    expect(personCard.className).not.toContain('primary');
    expect(personCard.className).not.toContain('shadow');
    expect(root.querySelector('.rounded-circle')).toBeNull();

    const subtitle = root.querySelector('p.card-subtitle') as HTMLElement;
    expect(subtitle.textContent).toContain('Deutsch');
    expect(subtitle.classList.contains('h6')).toBe(false);
    expect(subtitle.classList.contains('small')).toBe(true);
    expect(root.querySelectorAll('.badge.bg-light.text-dark.border').length).toBe(3);

    expect(root.querySelectorAll('h5.card-title.h6').length).toBe(4);

    // Nicht gestreift, weil die erreichte Stufe hervorgehoben wird.
    expect(root.querySelector('.table-responsive table.table-sm')).not.toBeNull();
    expect(root.querySelector('table.table-striped')).toBeNull();
    expect(root.querySelector('tbody th[scope="row"]')).not.toBeNull();
    expect(root.querySelector('[role="presentation"]')).toBeNull();
    expect(root.querySelector('[style*="height"]')).toBeNull();

    // Je Katalogkarte eine aktive Zeile mit Häkchen.
    const active = root.querySelectorAll('tr.table-active');
    expect(active.length).toBe(3);
    for (const row of active) {
      expect(row.classList.contains('fw-semibold')).toBe(false);
      expect(row.querySelector('.fa-check')).not.toBeNull();
    }
  });

  it('projiziert Header und Footer über die Slots, auch im Leerzustand', () => {
    const fixture = TestBed.createComponent(SlotHost);
    fixture.componentInstance.data = [];
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.card')).toBeNull();
    const header = fixture.nativeElement.querySelector('[data-role="header"]');
    const footer = fixture.nativeElement.querySelector('[data-role="footer"]');
    expect(header?.textContent).toContain('Kompetenzstufen');
    expect(footer?.textContent).toContain('Quelle');
  });

  it('stellt den Header über, den Footer unter die Personenkarte', () => {
    const fixture = TestBed.createComponent(SlotHost);
    fixture.componentInstance.data = FIXTURE_STUDENT_COMPETENCE_LEVELS;
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector(
      'tba3-student-competence-levels',
    ) as HTMLElement;
    const nodes = Array.from(root.children) as HTMLElement[];
    const headerIndex = nodes.findIndex((node) => node.getAttribute('data-role') === 'header');
    const footerIndex = nodes.findIndex((node) => node.getAttribute('data-role') === 'footer');
    const cardIndex = nodes.findIndex((node) => node.classList.contains('card'));
    expect(cardIndex).toBeGreaterThanOrEqual(0);
    expect(headerIndex).toBeLessThan(cardIndex);
    expect(footerIndex).toBeGreaterThan(cardIndex);
  });

  it('zeigt ohne Katalog nur die erreichte Stufe und keinen Fach-Untertitel', () => {
    const { root, component } = render(FIXTURE_STUDENT_COMPETENCE_LEVELS_SINGLE_SUBJECT);
    const cards = component.cards();
    expect(cards.length).toBe(2);
    expect(cards.every((card) => card.subject === '')).toBe(true);
    expect(root.querySelector('.card .card p.card-subtitle')).toBeNull();

    const [lesen, orthografie] = cards;
    expect(lesen.rows.length).toBe(0);
    expect(lesen.reached?.nameShort).toBe('III');
    expect(orthografie.reached?.nameShort).toBe('II');
  });

  it('zeigt bei Nicht-Teilnahme den Kopf und je Domäne den Hinweis', () => {
    const { text, component } = render(FIXTURE_STUDENT_COMPETENCE_LEVELS_EMPTY, {
      catalog: EXAMPLE_LEVEL_CATALOG,
    });
    expect(text).toContain('Jonas Feldhusen');
    const cards = component.cards();
    expect(cards.length).toBe(2);
    expect(cards.every((card) => card.noParticipation)).toBe(true);
    expect(text).toContain('Ohne Teilnahme');
  });

  it('rendert die Personenkarte nicht bei leerem Array', () => {
    const { root, component } = render([]);
    expect(component.header()).toBeUndefined();
    expect(root.querySelector('.card')).toBeNull();
    expect(root.textContent?.trim()).toBe('Keine Daten für diese Darstellung.');
  });

  it('setzt die Heading-Ebenen ohne Sprung: Personenkarte h4, Domänenkarten h5', () => {
    const { root } = render(FIXTURE_STUDENT_COMPETENCE_LEVELS);
    const headings = Array.from(root.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((element) =>
      Number(element.tagName.slice(1)),
    );
    expect(headings[0]).toBe(4);
    for (let i = 1; i < headings.length; i++) {
      expect(headings[i] - headings[i - 1]).toBeLessThanOrEqual(1);
    }
  });
});

@Component({
  standalone: true,
  imports: [StudentCompetenceLevelsComponent],
  template: `
    <tba3-student-competence-levels [competenceLevels]="data">
      <h3 tba3Header data-role="header" class="h5">Kompetenzstufen</h3>
      <p tba3Footer data-role="footer">Quelle: eigene Erhebung</p>
    </tba3-student-competence-levels>
  `,
})
class SlotHost {
  data: CompetenceLevelsValueGroup[] = [];
}

@Component({
  imports: [StudentCompetenceLevelsComponent],
  template: `<tba3-student-competence-levels [competenceLevels]="data">
    <div tba3Header>Kopf-Slot</div>
    <div tba3Footer>Fuß-Slot</div>
  </tba3-student-competence-levels>`,
})
class EmptyStateHost {
  data: typeof FIXTURE_STUDENT_COMPETENCE_LEVELS = [];
}

describe('StudentCompetenceLevelsComponent Leerzustand', () => {
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
