import { Component, Directive, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxEchartsDirective } from 'ngx-echarts';
import { beforeEach, describe, expect, it } from 'vitest';
import { CovariateGradientComponent } from './covariate-gradient';
import {
  FIXTURE_COVARIATE_GRADIENT,
  FIXTURE_COVARIATE_GRADIENT_DOMAINS,
  FIXTURE_COVARIATE_GRADIENT_EMPTY,
  FIXTURE_COVARIATE_GRADIENT_GENDER_LANGUAGE,
  FIXTURE_COVARIATE_GRADIENT_TWO_BOOKLETS,
} from '../../../fixtures/covariate-gradient';

// jsdom hat keinen Canvas für ECharts.
@Directive({ selector: '[echarts]', standalone: true })
class StubEchartsDirective {
  readonly options = input<unknown>();
}

function create(data: unknown, inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(CovariateGradientComponent);
  fixture.componentRef.setInput('aggregations', data);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  return fixture;
}

@Component({
  standalone: true,
  imports: [CovariateGradientComponent],
  template: `<tba3-covariate-gradient [aggregations]="data">
    <h3 tba3Header>Titel</h3>
    <p tba3Footer>Fußnote</p>
  </tba3-covariate-gradient>`,
})
class SlotHostComponent {
  readonly data = FIXTURE_COVARIATE_GRADIENT;
}

describe('CovariateGradientComponent', () => {
  beforeEach(() => {
    TestBed.overrideComponent(CovariateGradientComponent, {
      remove: { imports: [NgxEchartsDirective] },
      add: { imports: [StubEchartsDirective] },
    });
  });

  it('zeigt einen Block mit fünf SES-Ausprägungen, drei Serien und der Spannweite als Fußzeile', () => {
    const fixture = create(FIXTURE_COVARIATE_GRADIENT);
    const blocks = fixture.componentInstance.blocks();
    expect(blocks).toHaveLength(1);
    const block = blocks[0];

    expect(block.categories.map((category) => category.label)).toEqual([
      'sehr niedrig',
      'niedrig',
      'mittel',
      'hoch',
      'sehr hoch',
    ]);
    expect(block.series.map((series) => series.name)).toEqual([
      'Gesamtschule Birkenmoor',
      'Landesmittelwert',
      'Vergleichsschulen ähnlicher Sozialstruktur',
    ]);
    expect(block.series[0].data).toEqual([48, 55, 61, 66, 71]);
    expect(block.series[1].data).toEqual([53, 58, 62, 65, 69]);
    expect(block.series[2].data).toEqual([50, 56, 60, 64, 68]);
    expect(block.series[0].totals).toEqual([18, 26, 34, 22, 12]);
    expect(block.spread).toEqual({ min: 48, max: 71, range: 23 });
    expect(block.labelParts).toEqual([]);

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Spannweite 23 Pp');
    expect(root.textContent).toContain('Gesamtschule Birkenmoor: 48 % bis 71 %');
    expect(root.textContent).toContain('sehr niedrig');

    // Kein Bedienfeld bei nur einem Heft, keine Blockzeile bei nur einem Block.
    expect(root.querySelector('tba3-control-panel')).toBeNull();
    expect(root.querySelector('h4')).toBeNull();
    expect(root.querySelector('[title]')).toBeNull();

    // HTML-Legende mit drei Serien unter der Zeichenfläche.
    const legend = root.querySelectorAll('ul.list-inline > li');
    expect(legend).toHaveLength(3);

    // Screenreader-Tabelle statt figcaption, mit n je Zelle.
    const figure = root.querySelector('figure');
    expect(figure?.getAttribute('aria-label')).toContain('Gesamtschule Birkenmoor');
    expect(root.querySelector('figcaption')).toBeNull();
    const table = root.querySelector('div.visually-hidden table');
    expect(table).not.toBeNull();
    expect(table?.textContent).toContain('48 % (n = 18)');
  });

  it('zeigt ohne aggregationType gender, mit aggregationType languageAtHome die Sprache', () => {
    const gender = create(FIXTURE_COVARIATE_GRADIENT_GENDER_LANGUAGE).componentInstance.blocks()[0];
    expect(gender.categories.map((category) => category.label)).toEqual([
      'männlich',
      'weiblich',
      'divers',
    ]);
    expect(gender.series[0].data).toEqual([58, 64, 60]);
    expect(gender.spread?.range).toBe(6);

    const language = create(FIXTURE_COVARIATE_GRADIENT_GENDER_LANGUAGE, {
      aggregationType: 'languageAtHome',
    }).componentInstance.blocks()[0];
    expect(language.categories.map((category) => category.label)).toEqual([
      'Deutsch',
      'andere Sprache',
    ]);
    expect(language.series[0].data).toEqual([65, 54]);
    expect(language.series[1].data).toEqual([64, 55]);
    expect(language.spread?.range).toBe(11);
  });

  it('bietet ein Bedienfeld mit Testheft-Umschalter und zeigt Werte je Heft', () => {
    const fixture = create(FIXTURE_COVARIATE_GRADIENT_TWO_BOOKLETS);
    const component = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;

    expect(component.hasBookletSwitch()).toBe(true);
    expect(component.availableBooklets()).toEqual(['V8-2026-DE-HSA', 'V8-2026-DE-MSA']);

    const panel = root.querySelector('tba3-control-panel');
    expect(panel).not.toBeNull();
    expect(panel?.textContent).toContain('Testheft');

    const hsa = component.blocks()[0];
    expect(hsa.series.map((series) => series.name)).toEqual([
      'Gesamtschule Birkenmoor',
      'Landesmittelwert',
    ]);
    expect(hsa.series[0].data).toEqual([48, 55, 61, 66, 71]);
    expect(hsa.series[1].data).toEqual([53, 58, 62, 65, 69]);
    expect(hsa.spread).toEqual({ min: 48, max: 71, range: 23 });
    expect(root.textContent).toContain('Spannweite 23 Pp');

    component.setBooklet('V8-2026-DE-MSA');
    fixture.detectChanges();
    const msa = component.blocks()[0];
    expect(msa.series[0].data).toEqual([44, 50, 56, 62, 68]);
    expect(msa.series[1].data).toEqual([48, 53, 58, 63, 68]);
    expect(msa.spread).toEqual({ min: 44, max: 68, range: 24 });
    expect(root.textContent).toContain('Spannweite 24 Pp');
    expect(root.textContent).toContain('44 % bis 68 %');
  });

  it('zeigt je Domäne einen Block mit Blockzeile und einem hr dazwischen', () => {
    const fixture = create(FIXTURE_COVARIATE_GRADIENT_DOMAINS);
    const blocks = fixture.componentInstance.blocks();
    expect(blocks.map((block) => block.labelParts.join(' · '))).toEqual(['Lesen', 'Orthografie']);
    expect(blocks[0].series[0].data).toEqual([48, 55, 61, 66, 71]);
    expect(blocks[1].series[0].data).toEqual([42, 49, 55, 60, 66]);
    expect(blocks[1].spread).toEqual({ min: 42, max: 66, range: 24 });
    // Der Landesmittelwert jedes Blocks stammt aus der Value-Group gleicher Domäne.
    expect(blocks[0].series[1].data).toEqual([53, 58, 62, 65, 69]);
    expect(blocks[1].series[1].data).toEqual([47, 52, 57, 60, 64]);

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('h4')).toHaveLength(2);
    expect(root.querySelectorAll('hr.my-4')).toHaveLength(1);
    expect(root.querySelectorAll('figure')).toHaveLength(2);
  });

  it('zeigt keinen Block bei leerem Array und ohne Aggregationen', () => {
    expect(create([]).componentInstance.blocks()).toEqual([]);
    expect(create(FIXTURE_COVARIATE_GRADIENT_EMPTY).componentInstance.blocks()).toEqual([]);
    expect(create(FIXTURE_COVARIATE_GRADIENT_EMPTY).nativeElement.textContent.trim()).toBe(
      'Keine Daten für diese Darstellung.',
    );
  });

  it('projiziert die Slots [tba3Header] und [tba3Footer] außerhalb des Leerzustands', () => {
    const fixture = TestBed.createComponent(SlotHostComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Titel');
    expect(text).toContain('Fußnote');
  });
});

@Component({
  imports: [CovariateGradientComponent],
  template: `<tba3-covariate-gradient [aggregations]="data">
    <div tba3Header>Kopf-Slot</div>
    <div tba3Footer>Fuß-Slot</div>
  </tba3-covariate-gradient>`,
})
class EmptyStateHost {
  data: typeof FIXTURE_COVARIATE_GRADIENT = [];
}

describe('CovariateGradientComponent Leerzustand', () => {
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
