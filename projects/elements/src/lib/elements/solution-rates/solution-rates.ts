import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { Tba3BookletSwitchComponent } from '../../components/booklet-switch/booklet-switch';
import { createBookletState } from '../../components/booklet-switch/booklet-state';
import { Tba3ComparisonPickerComponent } from '../../components/comparison-picker/comparison-picker';
import { Tba3ControlPanelComponent } from '../../components/control-panel/control-panel';
import {
  Tba3ComparisonsSlot,
  Tba3FilterSlot,
} from '../../components/control-panel/control-panel-slots';
import { Tba3AggregationValueComponent } from '../../components/aggregation-value/aggregation-value';
import { Tba3DeltaComponent } from '../../components/delta/delta';
import type { AggregationBlock, AggregationsValueGroup, Deviation, ValueLabels } from '../../model';
import {
  type GroupedValueGroups,
  aggregationBlocks,
  aggregationValue,
  blockLabelParts,
  compareBlocks,
  entryKey,
  forBooklet,
  percent,
  splitByRole,
  labeledDeviation,
} from '../../model';

interface RateBar {
  name: string;
  percent: number;
  main: boolean;
  title: string | undefined;
  delta: Deviation | undefined;
}

interface RateValue {
  key: string;
  code: string | undefined;
  name: string;
  link: string | undefined;
  bars: RateBar[];
}

interface Section {
  key: string;
  labelParts: string[];
  values: RateValue[];
  hasComparisons: boolean;
}

/**
 * Zeigt die Lösungsquoten einer Gruppe je Teilkompetenz oder Aufgabe als Balken, auf Wunsch mit
 * Vergleichsgruppen und deren Abweichung in Prozentpunkten.
 */
@Component({
  selector: 'tba3-solution-rates',
  standalone: true,
  imports: [
    Tba3ControlPanelComponent,
    Tba3FilterSlot,
    Tba3ComparisonsSlot,
    Tba3BookletSwitchComponent,
    Tba3ComparisonPickerComponent,
    Tba3AggregationValueComponent,
    Tba3DeltaComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './solution-rates.html',
})
export class SolutionRatesComponent {
  /** Value-Groups eines `aggregations`-Endpunkts, die erste ist die Hauptgruppe. */
  readonly aggregations = input<AggregationsValueGroup[]>([]);

  /** Anfangs eingeblendete Vergleichsgruppen als `typ:id`. */
  readonly comparisons = input<string[]>([]);

  /** Abweichung in Prozentpunkten, ab der die Δ-Pille eines Vergleichs wertet. */
  readonly deviationThreshold = input(5);

  /** Link je Aggregationswert, Schlüssel `typ.wert`, Wert die URL. */
  readonly links = input<Readonly<Record<string, string>> | undefined>(undefined);

  /** Klartexte für Testhefte, Aggregationswerte ohne `description` und Aggregationsarten. */
  readonly valueLabels = input<ValueLabels | undefined>(undefined);

  private readonly roles = computed(() => splitByRole(this.aggregations()));

  readonly availableComparisons = computed(() => this.roles().comparisons);

  private readonly bookletState = createBookletState(() => this.roles().focus?.groups ?? []);

  readonly bookletList = this.bookletState.booklets;

  readonly hasBookletSwitch = this.bookletState.hasSwitch;

  readonly activeBooklet = this.bookletState.active;

  // linkedSignal: ein neuer Input setzt die Auswahl zurück, der Picker überschreibt sie.
  readonly selectedKeys = linkedSignal<string[]>(() => {
    const wanted = this.comparisons();
    if (wanted.length === 0) return [];
    return this.availableComparisons()
      .filter((group) => wanted.includes(group.key))
      .map((group) => group.key);
  });

  // Lösungsquoten sind nur innerhalb eines Testhefts vergleichbar.
  private readonly shownComparisons = computed(() => {
    const selected = this.selectedKeys();
    const booklet = this.activeBooklet();
    return this.availableComparisons().filter(
      (group) => selected.includes(group.key) && forBooklet(group.groups, booklet).length > 0,
    );
  });

  readonly hasControls = computed(
    () => this.hasBookletSwitch() || this.availableComparisons().length > 0,
  );

  readonly sections = computed<Section[]>(() => {
    const focus = this.roles().focus;
    if (!focus) return [];

    const booklet = this.activeBooklet();
    const focusGroups = forBooklet(focus.groups, booklet);
    if (focusGroups.length === 0) return [];

    const labels = this.valueLabels();
    const links = this.links();

    const comparisonBlocks = this.shownComparisons().map((comparison) => ({
      name: comparison.name,
      blocks: aggregationBlocks(forBooklet(comparison.groups, booklet), labels),
    }));

    const focusBlocks = aggregationBlocks(focusGroups, labels);
    if (focusBlocks.length === 0) return [];

    const orderedBlocks = [...focusBlocks].sort((a, b) => compareBlocks(a.group, b.group));
    const singleBlock = orderedBlocks.length === 1;

    return orderedBlocks.map((block) =>
      this.buildSection(block, focusGroups, focus, comparisonBlocks, singleBlock, labels, links),
    );
  });

  setBooklet(booklet: string | undefined): void {
    this.bookletState.set(booklet);
  }

  private buildSection(
    block: AggregationBlock,
    focusGroups: AggregationsValueGroup[],
    focus: GroupedValueGroups<AggregationsValueGroup>,
    comparisonBlocks: { name: string; blocks: AggregationBlock[] }[],
    singleBlock: boolean,
    labels: ValueLabels | undefined,
    links: Readonly<Record<string, string>> | undefined,
  ): Section {
    const matched = comparisonBlocks.map((comparison) => ({
      name: comparison.name,
      block: comparison.blocks.find((candidate) => candidate.key === block.key),
    }));
    const hasComparisons = matched.some((comparison) => comparison.block !== undefined);

    const values = block.entries.map<RateValue>((entry) => {
      const stats = entry.descriptiveStatistics;
      const focusPercent = percent(stats.mean);
      const key = entryKey(entry);

      const mainBar: RateBar = {
        name: focus.name,
        percent: focusPercent,
        main: true,
        title: trackTitle(stats.frequency, stats.total),
        delta: undefined,
      };

      const comparisonBars: RateBar[] = [];
      for (const comparison of matched) {
        const compEntry = comparison.block?.entries.find(
          (candidate) => entryKey(candidate) === key,
        );
        if (!compEntry) continue;
        const compStats = compEntry.descriptiveStatistics;
        const compPercent = percent(compStats.mean);
        comparisonBars.push({
          name: comparison.name,
          percent: compPercent,
          main: false,
          title: trackTitle(compStats.frequency, compStats.total),
          delta: labeledDeviation(focusPercent, compPercent, true, focus.name, comparison.name),
        });
      }

      const value = aggregationValue(entry, labels);
      return {
        key,
        code: value.code,
        name: value.name,
        link: links?.[key],
        bars: [mainBar, ...comparisonBars],
      };
    });

    return {
      key: `${focus.key}|${block.key}`,
      labelParts: this.blockHeading(block, focusGroups, singleBlock),
      values,
      hasComparisons,
    };
  }

  private blockHeading(
    block: AggregationBlock,
    focusGroups: AggregationsValueGroup[],
    singleBlock: boolean,
  ): string[] {
    if (singleBlock) return [];
    return block.domain !== undefined ? blockLabelParts(focusGroups, block.group) : [block.label];
  }
}

function trackTitle(frequency: number | null, total: number | null): string | undefined {
  if (frequency === null || total === null) return undefined;
  return `${frequency} von ${total} richtig gelöst`;
}
