import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { echarts } from '../echarts';
import { themeColor } from '../../model';

/** Säule mit fertigen CSS-Farben; `axisLabel` ist eine umbrochene Achsenbeschriftung. */
export interface MiniBar {
  label: string;
  value: number;
  color: string;
  labelColor?: string;
  axisLabel?: string;
}

/** Kompaktes Säulendiagramm mit Kürzeln an der Achse und Häufigkeiten als Label. */
@Component({
  selector: 'tba3-mini-bar-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mini-bar-chart.html',
  styleUrl: './mini-bar-chart.scss',
})
export class Tba3MiniBarChartComponent {
  readonly bars = input<MiniBar[]>([]);
  readonly title = input('');

  readonly description = computed(() => {
    const title = this.title();
    const bars = this.bars();
    if (bars.length === 0) return title ? `${title}: keine Daten` : 'Keine Daten';
    const parts = bars.map((bar) => `${bar.label}: ${bar.value}`).join(', ');
    return title ? `${title}: ${parts}` : parts;
  });

  readonly chartOptions = computed<EChartsOption>(() => {
    const bars = this.bars();
    const axisColor = themeColor('--bs-secondary-color');
    const defaultInsideColor = themeColor('--bs-body-bg');
    const topColor = themeColor('--bs-body-color');
    // Unter 25 % des Maximums ist die Säule zu kurz für ein Innenlabel.
    const max = bars.reduce((peak, bar) => Math.max(peak, bar.value), 0);
    const insideThreshold = max * 0.25;
    const axisData = bars.map((bar) => bar.axisLabel ?? bar.label);
    const maxLines = axisData.reduce((peak, label) => Math.max(peak, label.split('\n').length), 1);
    const bottom = 18 + (maxLines - 1) * 11;

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const point = (params as { dataIndex: number; value: number }[])[0];
          return `${bars[point.dataIndex].label}: ${point.value}`;
        },
      },
      grid: { left: 2, right: 2, top: 6, bottom, containLabel: false },
      xAxis: {
        type: 'category',
        data: axisData,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { interval: 0, fontSize: 10, lineHeight: 11, color: axisColor },
      },
      yAxis: { type: 'value', show: false },
      series: [
        {
          type: 'bar',
          barWidth: '60%',
          data: bars.map((bar) => {
            const inside = bar.value >= insideThreshold;
            return {
              value: bar.value,
              itemStyle: { color: bar.color, borderRadius: [2, 2, 0, 0] },
              label: {
                show: bar.value > 0,
                position: inside ? 'inside' : 'top',
                formatter: '{c}',
                fontSize: 10,
                fontWeight: 'bold',
                color: inside ? (bar.labelColor ?? defaultInsideColor) : topColor,
              },
            };
          }),
        },
      ],
    };
  });
}
