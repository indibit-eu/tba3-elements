import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { echarts } from '../../components/echarts';
import { Tba3BookletSwitchComponent } from '../../components/booklet-switch/booklet-switch';
import { createBookletState } from '../../components/booklet-switch/booklet-state';
import { Tba3ControlPanelComponent } from '../../components/control-panel/control-panel';
import { Tba3FilterSlot } from '../../components/control-panel/control-panel-slots';
import { Tba3LegendComponent, type Tba3LegendItem } from '../../components/legend/legend';
import type { AggregationsValueGroup, ValueLabels } from '../../model';
import {
  type AggregationEntry,
  type GroupedValueGroups,
  aggregationTypeOf,
  blockLabelParts,
  compareBlocks,
  entriesOfType,
  forBooklet,
  percent,
  resolveLabel,
  seriesColor,
  splitByRole,
  themeColor,
} from '../../model';

interface Category {
  value: string;
  label: string;
}

interface GradientSeries {
  name: string;
  color: string;
  data: (number | null)[];
  totals: (number | null)[];
}

interface Spread {
  min: number;
  max: number;
  range: number;
}

interface GradientBlock {
  key: string;
  labelParts: string[];
  label: string;
  focusName: string;
  ariaLabel: string;
  tableCaption: string;
  categories: Category[];
  series: GradientSeries[];
  legend: Tba3LegendItem[];
  spread: Spread | null;
  option: EChartsOption;
}

/**
 * Zeigt die Lösungsquote nach den Ausprägungen eines Merkmals als gruppiertes Balkendiagramm mit
 * einer Serie je Gruppe, darunter die Spannweite der Hauptgruppe.
 */
@Component({
  selector: 'tba3-covariate-gradient',
  standalone: true,
  imports: [
    NgxEchartsDirective,
    Tba3ControlPanelComponent,
    Tba3FilterSlot,
    Tba3BookletSwitchComponent,
    Tba3LegendComponent,
  ],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './covariate-gradient.html',
  styleUrl: './covariate-gradient.scss',
})
export class CovariateGradientComponent {
  /** Value-Groups eines `aggregations`-Endpunkts, die erste ist die Hauptgruppe. */
  readonly aggregations = input<AggregationsValueGroup[]>([]);

  /** Anzuzeigendes Merkmal, ohne Angabe das des ersten Eintrags der Hauptgruppe. */
  readonly aggregationType = input<string | undefined>(undefined);

  /** Anzeigetexte für Ausprägungen, Merkmal und Testhefte. */
  readonly valueLabels = input<ValueLabels | undefined>(undefined);

  private readonly roles = computed(() => splitByRole(this.aggregations()));

  private readonly focus = computed(() => this.roles().focus);

  private readonly bookletState = createBookletState(() => this.focus()?.groups ?? []);

  readonly availableBooklets = this.bookletState.booklets;

  readonly hasBookletSwitch = this.bookletState.hasSwitch;

  readonly activeBooklet = this.bookletState.active;

  private readonly activeType = computed<string | undefined>(() => {
    const explicit = this.aggregationType();
    if (explicit) return explicit;
    return aggregationTypeOf(this.focus());
  });

  readonly blocks = computed<GradientBlock[]>(() => {
    const focus = this.focus();
    const type = this.activeType();
    if (!focus || !type) return [];

    const booklet = this.activeBooklet();
    const labels = this.valueLabels();
    const typeLabel = resolveLabel(labels, 'aggregation', type);

    const focusGroups = forBooklet(focus.groups, booklet);
    if (focusGroups.length === 0) return [];

    const orderedGroups = [...focusGroups].sort(compareBlocks);
    const comparisons = this.roles().comparisons;

    const blocks: GradientBlock[] = [];
    for (const focusGroup of orderedGroups) {
      const block = this.buildBlock(
        focusGroup,
        focusGroups,
        focus,
        comparisons,
        booklet,
        type,
        typeLabel,
        labels,
      );
      if (block) blocks.push(block);
    }
    return blocks;
  });

  setBooklet(booklet: string | undefined): void {
    this.bookletState.set(booklet);
  }

  cellText(series: GradientSeries, row: number): string {
    const value = series.data[row];
    if (value === null) return '–';
    const total = series.totals[row];
    return total === null ? `${value} %` : `${value} % (n = ${total})`;
  }

  private buildBlock(
    focusGroup: AggregationsValueGroup,
    focusGroups: AggregationsValueGroup[],
    focus: GroupedValueGroups<AggregationsValueGroup>,
    comparisons: GroupedValueGroups<AggregationsValueGroup>[],
    booklet: string | undefined,
    type: string,
    typeLabel: string,
    labels: ValueLabels | undefined,
  ): GradientBlock | null {
    const focusEntries = entriesOfType([focusGroup], type);
    if (focusEntries.length === 0) return null;

    const labelParts = blockLabelParts(focusGroups, focusGroup);
    const label = labelParts.join(' · ') || focus.name;

    const categories = focusEntries.map<Category>((entry) => ({
      value: entry.value,
      label: resolveLabel(labels, type, entry.value, { description: entry.description }),
    }));

    const series: GradientSeries[] = [
      {
        name: focus.name,
        color: seriesColor('focus'),
        data: focusEntries.map((entry) => percent(entry.descriptiveStatistics.mean)),
        totals: focusEntries.map((entry) => entry.descriptiveStatistics.total),
      },
    ];

    // Der Farbindex zählt nur über die im Block gezeigten Vergleiche.
    const shownComparisons = comparisons
      .map((comparison) => ({
        name: comparison.name,
        valueGroup: forBooklet(comparison.groups, booklet).find(
          (group) =>
            group.domain?.name === focusGroup.domain?.name &&
            group.subject?.name === focusGroup.subject?.name,
        ),
      }))
      .filter(
        (comparison): comparison is { name: string; valueGroup: AggregationsValueGroup } =>
          comparison.valueGroup !== undefined,
      );

    shownComparisons.forEach((comparison, index) => {
      const entries = new Map<string, AggregationEntry>();
      for (const entry of comparison.valueGroup.aggregations) {
        if (entry.type === type && !entries.has(entry.value)) entries.set(entry.value, entry);
      }
      series.push({
        name: comparison.name,
        color: seriesColor(index),
        data: categories.map((category) => {
          const entry = entries.get(category.value);
          return entry ? percent(entry.descriptiveStatistics.mean) : null;
        }),
        totals: categories.map((category) => {
          const entry = entries.get(category.value);
          return entry ? entry.descriptiveStatistics.total : null;
        }),
      });
    });

    const focusValues = series[0].data as number[];
    const min = Math.min(...focusValues);
    const max = Math.max(...focusValues);
    // Eine Spannweite ist erst ab zwei Ausprägungen aussagekräftig.
    const spread: Spread | null = categories.length > 1 ? { min, max, range: max - min } : null;

    return {
      key: `${focusGroup.subject?.name ?? ''}|${focusGroup.domain?.name ?? ''}`,
      labelParts,
      label,
      focusName: focus.name,
      ariaLabel: `Lösungsquote nach ${typeLabel} je Ausprägung, ${label}`,
      tableCaption: `Lösungsquote je Ausprägung und Gruppe in Prozent, ${label}.`,
      categories,
      series,
      legend: series.map((entry) => ({ text: entry.name, color: entry.color })),
      spread,
      option: this.buildOption(categories, series),
    };
  }

  private buildOption(categories: Category[], series: GradientSeries[]): EChartsOption {
    const axisColor = themeColor('--bs-secondary-color');
    const lineColor = themeColor('--bs-border-color');

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const items = params as {
            dataIndex: number;
            seriesIndex: number;
            seriesName: string;
            value: number | null;
            marker: string;
          }[];
          const category = categories[items[0]?.dataIndex ?? 0];
          const lines = items
            .filter((item) => item.value !== null && item.value !== undefined)
            .map((item) => {
              const total = series[item.seriesIndex]?.totals[item.dataIndex];
              const suffix = total === null || total === undefined ? '' : ` (n = ${total})`;
              return `${item.marker}${item.seriesName}: ${item.value} %${suffix}`;
            });
          return `${category?.label}<br/>${lines.join('<br/>')}`;
        },
      },
      grid: { left: 8, right: 8, top: 12, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: categories.map((category) => category.label),
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { interval: 0, color: axisColor },
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: { formatter: '{value} %', color: axisColor },
        splitLine: { lineStyle: { color: lineColor } },
      },
      // Keine Wertlabels, sie überlappen bei schmalen Balken; die Werte stehen im Tooltip.
      series: series.map((entry) => ({
        name: entry.name,
        type: 'bar' as const,
        barMaxWidth: 18,
        itemStyle: {
          color: entry.color,
          borderRadius: [3, 3, 0, 0] as [number, number, number, number],
        },
        data: entry.data,
      })),
    };
  }
}
