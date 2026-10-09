import { Directive, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxEchartsDirective } from 'ngx-echarts';
import { beforeEach, describe, expect, it } from 'vitest';
import { type MiniBar, Tba3MiniBarChartComponent } from './mini-bar-chart';

// Ersatz für NgxEchartsDirective, weil jsdom keinen Canvas-Kontext liefert.
@Directive({ selector: '[echarts]', standalone: true })
class StubEchartsDirective {
  readonly options = input<unknown>();
}

function render(config: { bars: MiniBar[]; title?: string }) {
  const fixture = TestBed.createComponent(Tba3MiniBarChartComponent);
  fixture.componentRef.setInput('bars', config.bars);
  if (config.title !== undefined) fixture.componentRef.setInput('title', config.title);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return { fixture, root, text: root.textContent ?? '' };
}

describe('Tba3MiniBarChartComponent', () => {
  beforeEach(() => {
    TestBed.overrideComponent(Tba3MiniBarChartComponent, {
      remove: { imports: [NgxEchartsDirective] },
      add: { imports: [StubEchartsDirective] },
    });
  });

  it('baut die Screenreader-Beschreibung aus Titel und Säulen ins aria-label', () => {
    const { root } = render({
      bars: [
        { label: 'II', value: 4, color: '#a' },
        { label: 'III', value: 9, color: '#b' },
      ],
      title: 'Lesen',
    });
    const label = root.querySelector('figure')?.getAttribute('aria-label') ?? '';
    expect(label).toContain('Lesen');
    expect(label).toContain('II: 4');
    expect(label).toContain('III: 9');
  });

  it('rendert den Titel sichtbar als figcaption unter dem Diagramm ohne aria-hidden', () => {
    const { root } = render({ bars: [{ label: 'II', value: 4, color: '#a' }], title: 'Lesen' });
    const caption = root.querySelector('figcaption');
    expect(caption?.textContent?.trim()).toBe('Lesen');
    expect(caption?.className).toContain('text-secondary');
    expect(caption?.hasAttribute('aria-hidden')).toBe(false);
    const chart = root.querySelector('.tba3-mini-bar') as HTMLElement;
    expect(chart.compareDocumentPosition(caption!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('lässt die figcaption weg, wenn kein Titel gesetzt ist', () => {
    const { root } = render({ bars: [{ label: 'II', value: 4, color: '#a' }] });
    expect(root.querySelector('figcaption')).toBeNull();
  });

  it('setzt die Wertlabels innen in die Säulen', () => {
    const { fixture } = render({ bars: [{ label: 'II', value: 4, color: '#a' }] });
    const options = fixture.componentInstance.chartOptions() as {
      series: { data: { label: { position: string } }[] }[];
    };
    expect(options.series[0].data[0].label.position).toBe('inside');
  });

  it('stellt zu kurze Säulen (unter 25 % des Maximums) über die Säule', () => {
    const { fixture } = render({
      bars: [
        { label: 'A', value: 1, color: '#a' },
        { label: 'B', value: 2, color: '#b' },
        { label: 'C', value: 9, color: '#c' },
      ],
    });
    const options = fixture.componentInstance.chartOptions() as {
      series: { data: { label: { position: string } }[] }[];
    };
    expect(options.series[0].data[0].label.position).toBe('top');
    expect(options.series[0].data[1].label.position).toBe('top');
    expect(options.series[0].data[2].label.position).toBe('inside');
  });

  it('nutzt die Säulen-Kontrastfarbe innen und die Textfarbe oben', () => {
    const { fixture } = render({
      bars: [
        { label: 'A', value: 1, color: '#a', labelColor: '#111' },
        { label: 'C', value: 9, color: '#c', labelColor: '#111' },
      ],
    });
    const options = fixture.componentInstance.chartOptions() as {
      series: { data: { label: { position: string; color: string } }[] }[];
    };
    expect(options.series[0].data[1].label.color).toBe('#111');
    expect(options.series[0].data[0].label.position).toBe('top');
    expect(options.series[0].data[0].label.color).not.toBe('#111');
  });

  it('nutzt die mehrzeilige Achsenbeschriftung und weitet die Grundlinie', () => {
    const { fixture } = render({
      bars: [
        {
          label: 'unter Mindeststandard',
          value: 3,
          color: '#a',
          axisLabel: 'unter\nMindest-\nstandard',
        },
        { label: 'Optimalstandard', value: 1, color: '#b', axisLabel: 'Optimal-\nstandard' },
      ],
    });
    const options = fixture.componentInstance.chartOptions() as {
      grid: { bottom: number };
      xAxis: { data: string[] };
    };
    expect(options.xAxis.data[0]).toBe('unter\nMindest-\nstandard');
    expect(options.grid.bottom).toBe(40);
  });

  it('meldet den Leerzustand bei leeren Säulen im aria-label', () => {
    const { root } = render({ bars: [], title: 'Lesen' });
    expect(root.querySelector('figure')?.getAttribute('aria-label')).toContain('keine Daten');
  });
});
