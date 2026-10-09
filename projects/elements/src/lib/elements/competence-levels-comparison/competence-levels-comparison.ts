import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { echarts } from '../../components/echarts';
import { Tba3ComparisonPickerComponent } from '../../components/comparison-picker/comparison-picker';
import { Tba3ControlPanelComponent } from '../../components/control-panel/control-panel';
import {
  Tba3ComparisonsSlot,
  Tba3ViewSlot,
} from '../../components/control-panel/control-panel-slots';
import { Tba3LevelBadgeComponent } from '../../components/level-badge/level-badge';
import type { CompetenceLevelsValueGroup } from '../../model';
import {
  CLASSIFICATIONS,
  type GroupedValueGroups,
  blockLabelParts,
  classificationColor,
  classificationDistribution,
  classificationVariable,
  compareBlocks,
  contrastColor,
  deviation,
  hasClassifications,
  hasMultipleSets,
  normalizeClassification,
  percent,
  splitByRole,
  themeColor,
  totalOf,
} from '../../model';

interface Segment {
  label: string;
  classification: string | undefined;
  color: string;
  labelColor: string;
  higherIsWorse: boolean;
}

interface Bar {
  name: string;
  total: number;
  percentages: number[];
}

interface DifferenceRow {
  label: string;
  cells: string[];
}

interface DomainBlock {
  key: string;
  domain: string;
  labelParts: string[];
  scope: string;
  segments: Segment[];
  bars: Bar[];
  byLevel: boolean;
  stackedChart: EChartsOption;
  differenceChart: EChartsOption | null;
  differenceRows: DifferenceRow[];
}

const WORST_CLASSIFICATION = CLASSIFICATIONS[0];

function levelPercentages(group: CompetenceLevelsValueGroup): number[] {
  const total = totalOf(group);
  return group.competenceLevels.map((level) =>
    total > 0 ? percent(level.descriptiveStatistics.frequency / total) : 0,
  );
}

function sequenceKey(group: CompetenceLevelsValueGroup): string {
  return group.competenceLevels.map((level) => level.nameShort).join('|');
}

/**
 * Vergleicht die Kompetenzstufenverteilung einer Gruppe mit Vergleichsgruppen, je Domäne als
 * gestapeltes Säulendiagramm oder als Differenz in Prozentpunkten.
 */
@Component({
  selector: 'tba3-competence-levels-comparison',
  standalone: true,
  imports: [
    NgxEchartsDirective,
    Tba3ControlPanelComponent,
    Tba3ComparisonsSlot,
    Tba3ViewSlot,
    Tba3ComparisonPickerComponent,
    Tba3LevelBadgeComponent,
  ],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './competence-levels-comparison.html',
  styleUrl: './competence-levels-comparison.scss',
  host: { style: '--tba3-chart-height: 400px' },
})
export class CompetenceLevelsComparisonComponent {
  /** Value-Groups eines `competence-levels`-Endpunkts, die erste ist die Hauptgruppe. */
  readonly competenceLevels = input<CompetenceLevelsValueGroup[]>([]);

  /** Anfangs eingeblendete Vergleichsgruppen als `typ:id`. */
  readonly comparisons = input<string[]>([]);

  /** Abweichung in Prozentpunkten, ab der die Differenzansicht wertet. */
  readonly deviationThreshold = input<number>(5);

  readonly differenceView = signal(false);

  private readonly roles = computed(() => splitByRole(this.competenceLevels()));

  readonly availableComparisons = computed(() => this.roles().comparisons);

  // linkedSignal: ein neuer Input setzt die Auswahl zurück, der Picker überschreibt sie.
  readonly selectedKeys = linkedSignal<string[]>(() => {
    const wanted = this.comparisons();
    if (wanted.length === 0) return [];
    return this.availableComparisons()
      .filter((group) => wanted.includes(group.key))
      .map((group) => group.key);
  });

  private readonly shownComparisons = computed(() => {
    const selected = this.selectedKeys();
    return this.availableComparisons().filter((group) => selected.includes(group.key));
  });

  readonly shownComparisonsExist = computed(() => this.shownComparisons().length > 0);

  readonly effectiveDifferenceView = computed(
    () => this.differenceView() && this.shownComparisonsExist(),
  );

  readonly blocks = computed<DomainBlock[]>(() => {
    const focus = this.roles().focus;
    if (!focus) return [];
    const shown = this.shownComparisons();
    const threshold = this.deviationThreshold();

    const representatives: CompetenceLevelsValueGroup[] = [];
    const seen = new Set<string>();
    for (const group of focus.groups) {
      const domain = group.domain?.name;
      if (domain === undefined || seen.has(domain)) continue;
      seen.add(domain);
      representatives.push(group);
    }
    representatives.sort(compareBlocks);

    const blocks: DomainBlock[] = [];
    for (const representative of representatives) {
      const domain = representative.domain?.name;
      if (domain === undefined) continue;
      const labelParts = blockLabelParts(representatives, representative);
      const block = this.buildBlock(domain, labelParts, focus, shown, threshold);
      if (block) blocks.push(block);
    }
    return blocks;
  });

  showDistribution(): void {
    this.differenceView.set(false);
  }

  showDifference(): void {
    this.differenceView.set(true);
  }

  private buildBlock(
    domain: string,
    labelParts: string[],
    focus: GroupedValueGroups<CompetenceLevelsValueGroup>,
    shown: GroupedValueGroups<CompetenceLevelsValueGroup>[],
    threshold: number,
  ): DomainBlock | null {
    const focusValueGroups = focus.groups.filter((group) => group.domain?.name === domain);
    if (focusValueGroups.length === 0) return null;

    const buckets = [{ group: focus, valueGroups: focusValueGroups }];
    for (const comparison of shown) {
      const valueGroups = comparison.groups.filter((group) => group.domain?.name === domain);
      if (valueGroups.length > 0) buckets.push({ group: comparison, valueGroups });
    }

    // Stufen sind nur vergleichbar, wenn jede Säule genau ein Set mit derselben Stufenfolge trägt.
    const singleSetEach = !hasMultipleSets(buckets.flatMap((bucket) => bucket.valueGroups));
    const sequences = buckets.map((bucket) =>
      bucket.valueGroups.length === 1 ? sequenceKey(bucket.valueGroups[0]) : null,
    );
    const sameSequence = sequences.every((sequence) => sequence === sequences[0]);
    const byLevel = singleSetEach && sameSequence;

    const segments = byLevel
      ? focusValueGroups[0].competenceLevels.map<Segment>((level) => ({
          label: level.nameShort,
          classification: level.classification,
          color: classificationColor(level.classification),
          labelColor: contrastColor(classificationVariable(level.classification)),
          higherIsWorse: normalizeClassification(level.classification) === WORST_CLASSIFICATION,
        }))
      : CLASSIFICATIONS.map<Segment>((classification) => ({
          label: classification,
          classification,
          color: classificationColor(classification),
          labelColor: contrastColor(classificationVariable(classification)),
          higherIsWorse: classification === WORST_CLASSIFICATION,
        }));

    if (segments.length === 0) return null;
    if (!byLevel && !hasClassifications(classificationDistribution(focusValueGroups)[0]))
      return null;

    const bars = buckets.map<Bar>((bucket) => {
      if (byLevel) {
        return {
          name: bucket.group.name,
          total: totalOf(bucket.valueGroups[0]),
          percentages: levelPercentages(bucket.valueGroups[0]),
        };
      }
      const distribution = classificationDistribution(bucket.valueGroups)[0];
      return {
        name: bucket.group.name,
        total: distribution.total,
        percentages: CLASSIFICATIONS.map((classification) =>
          percent(distribution.shares[classification]),
        ),
      };
    });

    const hasComparison = bars.length > 1;

    return {
      key: `${focus.key}|${domain}`,
      domain,
      labelParts,
      scope: labelParts.length > 0 ? labelParts.join(' · ') : domain,
      segments,
      bars,
      byLevel,
      stackedChart: this.stackedChart(segments, bars),
      differenceChart: hasComparison ? this.differenceChart(segments, bars, threshold) : null,
      differenceRows: this.differenceRows(segments, bars),
    };
  }

  private stackedChart(segments: Segment[], bars: Bar[]): EChartsOption {
    const axisColor = themeColor('--bs-secondary-color');
    const gridColor = themeColor('--bs-border-color');
    const borderColor = themeColor('--bs-body-bg');

    const series = segments.map((segment, segmentIndex) => ({
      name: segment.label,
      type: 'bar' as const,
      stack: 'total',
      barWidth: '40%',
      itemStyle: { color: segment.color, borderColor, borderWidth: 1 },
      // Unter 4 % überlagern sich die Labels.
      label: {
        show: true,
        position: 'inside' as const,
        fontSize: 12,
        fontWeight: 'bold' as const,
        color: segment.labelColor,
        formatter: (params: unknown) => {
          const value = (params as { value: number }).value;
          return value < 4 ? '' : `${value} %`;
        },
      },
      data: bars.map((bar) => bar.percentages[segmentIndex]),
    }));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const items = params as { seriesName: string; value: number; dataIndex: number }[];
          const bar = bars[items[0]?.dataIndex ?? 0];
          const lines = items
            .filter((item) => item.value > 0)
            .map((item) => `${item.seriesName}: ${item.value} %`);
          return `${bar?.name} (n = ${bar?.total})<br/>${lines.join('<br/>')}`;
        },
      },
      grid: { left: 8, right: 8, top: 10, bottom: 40, containLabel: true },
      xAxis: {
        type: 'category',
        data: bars.map((bar) => bar.name),
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: {
          interval: 0,
          color: axisColor,
          formatter: (value: string, index: number) =>
            `{name|${value}}\n{count|n = ${bars[index]?.total}}`,
          rich: {
            name: { fontWeight: 'bold', fontSize: 12, lineHeight: 18 },
            count: { fontSize: 10, color: axisColor, lineHeight: 14 },
          },
        },
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: { formatter: '{value} %', color: axisColor },
        splitLine: { lineStyle: { color: gridColor } },
      },
      series,
    };
  }

  private differenceChart(segments: Segment[], bars: Bar[], threshold: number): EChartsOption {
    const axisColor = themeColor('--bs-secondary-color');
    const zeroLineColor = themeColor('--bs-secondary-color');
    const gridColor = themeColor('--bs-border-color');

    const focus = bars[0];
    const comparisons = bars.slice(1);
    const categories = comparisons.map((bar) => `${focus.name} gegenüber ${bar.name}`);

    const series = segments.map((segment, segmentIndex) => ({
      name: segment.label,
      type: 'bar' as const,
      itemStyle: { color: segment.color },
      data: comparisons.map((bar) => {
        const dev = deviation(
          focus.percentages[segmentIndex],
          bar.percentages[segmentIndex],
          !segment.higherIsWorse,
        );
        const direction = Math.abs(dev.diff) < threshold ? 'neutral' : dev.direction;
        const glyph = dev.diff > 0 ? '▲ ' : dev.diff < 0 ? '▼ ' : '';
        return {
          value: dev.diff,
          label: {
            color: themeColor(`--tba3-deviation-${direction}`),
            formatter: `${glyph}${dev.label}`,
          },
        };
      }),
      label: { show: true, position: 'outside' as const, fontSize: 11 },
      labelLayout: { hideOverlap: true },
      // Nur an der ersten Serie, sonst zeichnet ECharts die Nulllinie mehrfach.
      markLine:
        segmentIndex === 0
          ? {
              silent: true,
              symbol: 'none',
              lineStyle: { color: zeroLineColor },
              label: { show: false },
              data: [{ yAxis: 0 }],
            }
          : undefined,
    }));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const items = params as { seriesName: string; value: number; name: string }[];
          const lines = items.map(
            (item) => `${item.seriesName}: ${deviation(item.value, 0, true).label}`,
          );
          return `${items[0]?.name}<br/>${lines.join('<br/>')}`;
        },
      },
      grid: { left: 8, right: 8, top: 20, bottom: 40, containLabel: true },
      xAxis: {
        type: 'category',
        data: categories,
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: {
          interval: 0,
          color: axisColor,
          fontSize: 11,
          width: 140,
          overflow: 'break',
          lineHeight: 14,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: '{value} Pp', color: axisColor },
        splitLine: { lineStyle: { color: gridColor } },
      },
      series,
    };
  }

  private differenceRows(segments: Segment[], bars: Bar[]): DifferenceRow[] {
    const focus = bars[0];
    return bars.slice(1).map((bar) => ({
      label: `${focus.name} gegenüber ${bar.name}`,
      cells: segments.map(
        (segment, index) =>
          deviation(focus.percentages[index], bar.percentages[index], !segment.higherIsWorse).label,
      ),
    }));
  }
}
