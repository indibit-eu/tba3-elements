import { Directive, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxEchartsDirective } from 'ngx-echarts';
import { beforeEach, describe, expect, it } from 'vitest';
import { Tba3DonutChartComponent, type DonutSegment } from './donut-chart';

// Ersatz für NgxEchartsDirective, weil jsdom keinen Canvas-Kontext liefert.
@Directive({ selector: '[echarts]', standalone: true })
class StubEchartsDirective {
  readonly options = input<unknown>();
}

function render(config: {
  segments: DonutSegment[];
  centerLabel?: string;
  title?: string;
  legendValues?: boolean;
}) {
  const fixture = TestBed.createComponent(Tba3DonutChartComponent);
  fixture.componentRef.setInput('segments', config.segments);
  if (config.centerLabel !== undefined)
    fixture.componentRef.setInput('centerLabel', config.centerLabel);
  if (config.title !== undefined) fixture.componentRef.setInput('title', config.title);
  if (config.legendValues !== undefined)
    fixture.componentRef.setInput('legendValues', config.legendValues);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return { fixture, root, text: root.textContent ?? '' };
}

describe('Tba3DonutChartComponent', () => {
  beforeEach(() => {
    TestBed.overrideComponent(Tba3DonutChartComponent, {
      remove: { imports: [NgxEchartsDirective] },
      add: { imports: [StubEchartsDirective] },
    });
  });

  it('baut die Beschreibungstabelle mit Anteilen', () => {
    const { root } = render({
      segments: [
        { label: 'Unter Mindeststandard', value: 10, color: '#a' },
        { label: 'Mindeststandard erreicht', value: 70, color: '#b' },
        { label: 'Optimalstandard', value: 20, color: '#c' },
      ],
      title: 'Lesen',
    });
    const rows = root.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
    const firstRow = rows[0].textContent ?? '';
    expect(firstRow).toContain('Unter Mindeststandard');
    expect(firstRow).toContain('10');
    expect(firstRow).toContain('10 %');
    expect((root.querySelector('caption')?.textContent ?? '').trim()).toBe('Lesen');
  });

  it('bildet die Summe der Segmente', () => {
    const { fixture } = render({
      segments: [
        { label: 'a', value: 5, color: '#a' },
        { label: 'b', value: 7, color: '#b' },
      ],
    });
    expect(fixture.componentInstance.total()).toBe(12);
  });

  it('rendert die Legende über den gemeinsamen Baustein mit Farbfeld, Label und Wert', () => {
    const { root } = render({
      segments: [
        { label: 'männlich', value: 12, color: 'rgb(155, 89, 182)' },
        { label: 'weiblich', value: 10, color: 'rgb(52, 152, 219)' },
        { label: 'divers', value: 1, color: 'rgb(241, 196, 15)' },
      ],
    });
    const items = root.querySelectorAll('ul.list-inline li.list-inline-item');
    expect(items.length).toBe(3);
    expect(items[0].textContent).toContain('männlich');
    expect(items[0].textContent).toContain('12');
    const swatch = items[0].querySelector('i.fa-square') as HTMLElement;
    expect(swatch).not.toBeNull();
    expect(swatch.style.color).toBe('rgb(155, 89, 182)');
  });

  it('lässt bei legendValues=false die Häufigkeit in der Legende weg, behält sie aber in der Tabelle', () => {
    const { root } = render({
      segments: [
        { label: 'männlich', value: 12, color: 'rgb(155, 89, 182)' },
        { label: 'weiblich', value: 10, color: 'rgb(52, 152, 219)' },
      ],
      legendValues: false,
    });
    const items = root.querySelectorAll('ul.list-inline li.list-inline-item');
    expect(items[0].textContent).toContain('männlich');
    expect(items[0].textContent).not.toContain('12');
    const firstDataRow = root.querySelector('tbody tr')?.textContent ?? '';
    expect(firstDataRow).toContain('12');
  });

  it('rendert einen Segment-Marker als Icon vor dem Label in der Legende', () => {
    const { root } = render({
      segments: [
        { label: 'unter Mindeststandard', value: 6, color: '#a' },
        { label: 'Mindeststandard bis Regelstandard plus', value: 74, color: '#b' },
        {
          label: 'Optimalstandard',
          value: 16,
          color: '#c',
          marker: { icon: 'fa-crown', color: 'var(--tba3-mark-top)', title: 'Optimalstandard' },
        },
      ],
    });
    const items = root.querySelectorAll('ul.list-inline li.list-inline-item');
    expect(items[0].querySelector('i.fa-crown')).toBeNull();
    expect(items[1].querySelector('i.fa-crown')).toBeNull();
    const icon = items[2].querySelector('i.fa-crown') as HTMLElement;
    expect(icon).not.toBeNull();
    expect(icon.classList.contains('fa-crown')).toBe(true);
    expect(icon.getAttribute('title')).toBe('Optimalstandard');
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(items[2].textContent).toContain('Optimalstandard');
    expect(items[2].textContent).toContain('16');
  });
});
