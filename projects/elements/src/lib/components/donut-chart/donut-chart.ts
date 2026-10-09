import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { echarts } from '../echarts';
import { Tba3LegendComponent, type Tba3LegendItem } from '../legend/legend';
import { themeColor } from '../../model';

/** Ringsegment mit fertigem CSS-Farbwert und optionalem Icon-Marker in der Legende. */
export interface DonutSegment {
  label: string;
  value: number;
  color: string;
  marker?: {
    icon: string;
    color: string;
    title: string;
  };
}

interface DonutTableRow {
  label: string;
  value: number;
  percent: number;
}

/** Donut mit Zentrumstext, HTML-Legende und Screenreader-Tabelle. */
@Component({
  selector: 'tba3-donut-chart',
  standalone: true,
  imports: [NgxEchartsDirective, Tba3LegendComponent],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './donut-chart.html',
  styleUrl: './donut-chart.scss',
})
export class Tba3DonutChartComponent {
  readonly segments = input<DonutSegment[]>([]);
  /** Ohne Angabe die Summe aller Segmente; ein leerer String lässt das Zentrum leer. */
  readonly centerLabel = input<string | undefined>(undefined);
  /** Titel für `aria-label` und die Screenreader-Tabelle. */
  readonly title = input('');
  readonly size = input<'default' | 'small'>('default');
  /** Ob die Legende die absolute Häufigkeit je Eintrag zeigt. */
  readonly legendValues = input(true);

  readonly total = computed(() => this.segments().reduce((sum, segment) => sum + segment.value, 0));

  readonly legendItems = computed<Tba3LegendItem[]>(() => {
    const withValues = this.legendValues();
    return this.segments().map((segment) => ({
      color: segment.color,
      text: segment.label,
      value: withValues ? segment.value : undefined,
      marker: segment.marker,
    }));
  });

  readonly tableRows = computed<DonutTableRow[]>(() => {
    const total = this.total();
    return this.segments().map((segment) => ({
      label: segment.label,
      value: segment.value,
      percent: total > 0 ? Math.round((segment.value / total) * 100) : 0,
    }));
  });

  readonly description = computed(() => {
    const title = this.title();
    const total = this.total();
    if (total === 0) return title ? `${title}: keine Daten` : 'Keine Daten';
    const parts = this.tableRows()
      .map((row) => `${row.label}: ${row.value} (${row.percent} %)`)
      .join(', ');
    const prefix = title ? `${title}: ` : '';
    return `${prefix}${parts}. Gesamt: ${total}`;
  });

  // Legende als HTML-Liste, weil die ECharts-Legende ab drei Einträgen den Ring überlappt.
  readonly chartOptions = computed<EChartsOption>(() => {
    const segments = this.segments();
    const isSmall = this.size() === 'small';
    const centerText = this.centerLabel() ?? `${this.total()}`;
    const centerFontSize = isSmall ? 16 : centerText.includes('%') ? 24 : 20;
    const centerColor = themeColor('--bs-body-color');

    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c}' },
      legend: { show: false },
      series: [
        {
          type: 'pie',
          radius: ['55%', '80%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          labelLine: { show: false },
          label: {
            show: true,
            position: 'center',
            formatter: () => centerText,
            fontSize: centerFontSize,
            fontWeight: 'bold',
            color: centerColor,
          },
          emphasis: {
            label: { show: true, fontSize: centerFontSize, fontWeight: 'bold', color: centerColor },
          },
          data: segments.map((segment) => ({
            value: segment.value,
            name: segment.label,
            itemStyle: { color: segment.color },
          })),
        },
      ],
    };
  });
}
