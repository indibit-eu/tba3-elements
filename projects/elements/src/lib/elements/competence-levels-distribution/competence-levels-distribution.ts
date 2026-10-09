import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { echarts } from '../../components/echarts';
import { Tba3LegendComponent, type Tba3LegendItem } from '../../components/legend/legend';
import type { CompetenceLevelsValueGroup, GroupedValueGroups } from '../../model';
import {
  CLASSIFICATIONS,
  blockLabelParts,
  classificationAxisLabel,
  classificationColor,
  classificationDistribution,
  classificationVariable,
  compareBlocks,
  contrastColor,
  groupByIdAndDomain,
  hasClassifications,
  normalizeClassification,
  percent,
  themeColor,
} from '../../model';

interface Bar {
  label: string;
  sublabel?: string;
  name: string;
  classification: string;
  value: number;
  color: string;
  labelColor: string;
}

interface Metrics {
  optimalCount: number;
  minimumReachedPercent: number;
  belowCount: number;
}

interface Block {
  key: string;
  labelParts: string[];
  mode: 'level' | 'classification';
  bars: Bar[];
  legend: Tba3LegendItem[];
  chartOptions: EChartsOption | null;
  metrics: Metrics | null;
  total: number;
  ariaLabel: string;
  tableCaption: string;
}

/**
 * Zeigt je Gruppe und Domäne die Verteilung über die Kompetenzstufen als Säulendiagramm mit
 * absoluten Zahlen, daneben Optimalstandard, erreichten Mindeststandard und unter Mindeststandard.
 */
@Component({
  selector: 'tba3-competence-levels-distribution',
  standalone: true,
  imports: [NgxEchartsDirective, Tba3LegendComponent],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './competence-levels-distribution.html',
  styleUrl: './competence-levels-distribution.scss',
})
export class CompetenceLevelsDistributionComponent {
  /** Value-Groups eines `competence-levels`-Endpunkts, je Gruppe und Domäne ein Block. */
  readonly competenceLevels = input<CompetenceLevelsValueGroup[]>([]);

  readonly blocks = computed<Block[]>(() => {
    const all = this.competenceLevels();
    if (all.length === 0) return [];

    return groupByIdAndDomain(all)
      .sort((a, b) => compareBlocks(a.groups[0], b.groups[0]))
      .map((entry) => this.buildBlock(entry, all));
  });

  private buildBlock(
    entry: GroupedValueGroups<CompetenceLevelsValueGroup>,
    all: CompetenceLevelsValueGroup[],
  ): Block {
    const groups = entry.groups;
    const first = groups[0];
    const labelParts = blockLabelParts(all, first);
    const label =
      labelParts.length > 0
        ? labelParts.join(' · ')
        : (first.domain?.name ?? first.subject?.name ?? first.name);
    // `entry.key` enthält den Typ, damit Schule und Kurs mit gleicher `id` getrennt bleiben.
    const key = `${entry.key}|${first.domain?.name ?? ''}`;

    const levelCount = groups.reduce((sum, group) => sum + group.competenceLevels.length, 0);
    if (levelCount === 0) {
      return {
        key,
        labelParts,
        mode: 'level',
        bars: [],
        legend: [],
        chartOptions: null,
        metrics: null,
        total: 0,
        ariaLabel: label,
        tableCaption: '',
      };
    }

    const distribution = classificationDistribution(groups)[0];
    const showsClassifications = hasClassifications(distribution);
    // Stufen verschiedener Sets sind nicht vergleichbar, darum dann die Classifications.
    const multipleSets = groups.length > 1;
    const mode: 'level' | 'classification' = multipleSets ? 'classification' : 'level';

    const bars = multipleSets
      ? this.classificationBars(distribution.counts)
      : this.levelBars(first, showsClassifications);

    const metrics: Metrics | null = showsClassifications
      ? {
          optimalCount: distribution.counts['Optimalstandard'],
          minimumReachedPercent: percent(distribution.minimumReached),
          belowCount: distribution.counts['unter Mindeststandard'],
        }
      : null;

    return {
      key,
      labelParts,
      mode,
      bars,
      legend: mode === 'level' ? this.legendItems(bars) : [],
      chartOptions: this.chartOptions(bars, mode),
      metrics,
      total: distribution.total,
      ariaLabel: `${label}: Verteilung über die Kompetenzstufen, n = ${distribution.total}`,
      tableCaption: `Teilnehmende je Kompetenzstufe, ${label}, n = ${distribution.total}`,
    };
  }

  private levelBars(group: CompetenceLevelsValueGroup, showsClassifications: boolean): Bar[] {
    return group.competenceLevels.map((level) => {
      const classification = normalizeClassification(level.classification);
      return {
        label: level.nameShort,
        sublabel:
          showsClassifications && classification === 'Mindeststandard'
            ? 'Mindeststandard'
            : undefined,
        name: level.nameShort,
        classification: classification ?? 'unknown',
        value: level.descriptiveStatistics.frequency,
        color: classificationColor(classification),
        labelColor: contrastColor(classificationVariable(classification)),
      };
    });
  }

  private classificationBars(counts: Readonly<Record<string, number>>): Bar[] {
    return CLASSIFICATIONS.map((classification) => ({
      label: classificationAxisLabel(classification),
      name: classification,
      classification,
      value: counts[classification],
      color: classificationColor(classification),
      labelColor: contrastColor(classificationVariable(classification)),
    }));
  }

  private legendItems(bars: Bar[]): Tba3LegendItem[] {
    const present = new Set(bars.map((bar) => bar.classification));
    return CLASSIFICATIONS.filter((classification) => present.has(classification)).map(
      (classification) => ({
        text: classification,
        color: classificationColor(classification),
      }),
    );
  }

  private chartOptions(bars: Bar[], mode: 'level' | 'classification'): EChartsOption {
    const axisColor = themeColor('--bs-secondary-color');
    const lineColor = themeColor('--bs-border-color');
    const categories = bars.map((bar) =>
      bar.sublabel ? `${bar.label}\n${bar.sublabel}` : bar.label,
    );
    // Die Classification-Namen sind umbrochen und brauchen mehr Platz.
    const isClassification = mode === 'classification';

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const point = (params as { dataIndex: number; value: number }[])[0];
          const name = bars[point.dataIndex].name;
          const prefix = mode === 'level' ? 'Stufe ' : '';
          return `${prefix}${name}: ${point.value} Teilnehmende`;
        },
      },
      grid: {
        left: 10,
        right: 10,
        top: 10,
        bottom: isClassification ? 60 : 45,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLine: { show: true, lineStyle: { color: lineColor } },
        axisTick: { show: false },
        axisLabel: {
          interval: 0,
          fontSize: 12,
          color: axisColor,
          fontWeight: 'bold',
          ...(isClassification ? { lineHeight: 14 } : {}),
        },
      },
      yAxis: { type: 'value', show: false },
      series: [
        {
          type: 'bar',
          barWidth: '50%',
          data: bars.map((bar) => ({
            value: bar.value,
            itemStyle: { color: bar.color, borderRadius: [4, 4, 0, 0] },
            label: {
              show: bar.value > 0,
              position: 'inside',
              formatter: '{c}',
              fontSize: 12,
              fontWeight: 'bold',
              color: bar.labelColor,
            },
          })),
        },
      ],
    };
  }
}
