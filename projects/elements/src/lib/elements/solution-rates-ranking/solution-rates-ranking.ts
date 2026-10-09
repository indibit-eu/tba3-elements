import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { Tba3BookletSwitchComponent } from '../../components/booklet-switch/booklet-switch';
import { createBookletState } from '../../components/booklet-switch/booklet-state';
import { Tba3ControlPanelComponent } from '../../components/control-panel/control-panel';
import {
  Tba3ComparisonsSlot,
  Tba3FilterSlot,
} from '../../components/control-panel/control-panel-slots';
import { Tba3AggregationValueComponent } from '../../components/aggregation-value/aggregation-value';
import { Tba3DeltaComponent } from '../../components/delta/delta';
import type { AggregationsValueGroup, Deviation, ValueLabels } from '../../model';
import {
  aggregationBlocks,
  aggregationValue,
  entryKey,
  forBooklet,
  labeledDeviation,
  percent,
  splitByRole,
} from '../../model';

interface RankItem {
  key: string;
  code: string | undefined;
  name: string;
  block: string | undefined;
  focusPercent: number;
  comparisonPercent: number | null;
  deviation: Deviation | null;
}

interface RankCard {
  title: string;
  subtitle: string | undefined;
  items: RankItem[];
}

interface Ranking {
  cards: RankCard[];
  hasComparison: boolean;
  showBlock: boolean;
}

interface ComparisonOption {
  key: string;
  name: string;
}

const EMPTY_RANKING: Ranking = {
  cards: [],
  hasComparison: false,
  showBlock: false,
};

/**
 * Zeigt die höchsten und niedrigsten Lösungsquoten einer Gruppe als zwei Karten, mit Vergleichsgruppe
 * die Werte mit der größten Abweichung nach oben und unten.
 */
@Component({
  selector: 'tba3-solution-rates-ranking',
  standalone: true,
  imports: [
    Tba3BookletSwitchComponent,
    Tba3ControlPanelComponent,
    Tba3FilterSlot,
    Tba3ComparisonsSlot,
    Tba3AggregationValueComponent,
    Tba3DeltaComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './solution-rates-ranking.html',
})
export class SolutionRatesRankingComponent {
  /** Value-Groups eines `aggregations`-Endpunkts, die erste ist die Hauptgruppe. */
  readonly aggregations = input<AggregationsValueGroup[]>([]);

  /** Anfangs gewählte Vergleichsgruppe als `typ:id`. */
  readonly comparison = input<string | undefined>(undefined);

  /** Anzahl der Einträge je Karte. */
  readonly count = input<number>(3);

  /** Abweichung in Prozentpunkten, ab der die Δ-Pille eingefärbt wird. */
  readonly deviationThreshold = input(5);

  /** Anzeigetexte für Testhefte, Werte ohne `description` und Kompetenztypen. */
  readonly valueLabels = input<ValueLabels | undefined>(undefined);

  private readonly roles = computed(() => splitByRole(this.aggregations()));

  private readonly bookletState = createBookletState(() => this.roles().focus?.groups ?? []);

  readonly bookletList = this.bookletState.booklets;

  readonly hasBookletSwitch = this.bookletState.hasSwitch;

  readonly activeBooklet = this.bookletState.active;

  readonly availableComparisons = computed(() => {
    const booklet = this.activeBooklet();
    return this.roles().comparisons.filter((group) => forBooklet(group.groups, booklet).length > 0);
  });

  readonly comparisonOptions = computed<ComparisonOption[]>(() =>
    this.availableComparisons().map((group) => ({ key: group.key, name: group.name })),
  );

  // Input oder Heftwechsel setzen die Auswahl zurück, die Zeile „Vergleichswerte" überschreibt sie.
  readonly selectedComparisonKey = linkedSignal<string | undefined>(() => {
    const wanted = this.comparison();
    if (!wanted) return undefined;
    const match = this.availableComparisons().find((group) => group.key === wanted);
    return match?.key;
  });

  private readonly selectedComparison = computed(() => {
    const key = this.selectedComparisonKey();
    if (!key) return undefined;
    return this.availableComparisons().find((group) => group.key === key);
  });

  readonly hasComparison = computed(() => this.selectedComparison() !== undefined);

  readonly hasControls = computed(
    () => this.hasBookletSwitch() || this.comparisonOptions().length > 0,
  );

  readonly ranking = computed<Ranking>(() => {
    const focus = this.roles().focus;
    if (!focus) return EMPTY_RANKING;

    const booklet = this.activeBooklet();
    const labels = this.valueLabels();
    const focusBlocks = aggregationBlocks(forBooklet(focus.groups, booklet), labels);
    if (focusBlocks.length === 0) return EMPTY_RANKING;

    const comparison = this.selectedComparison();
    const comparisonBlocks = comparison
      ? aggregationBlocks(forBooklet(comparison.groups, booklet), labels)
      : [];

    const items: RankItem[] = [];
    for (const block of focusBlocks) {
      const comparisonBlock = comparisonBlocks.find((candidate) => candidate.key === block.key);
      for (const entry of block.entries) {
        const focusPercent = percent(entry.descriptiveStatistics.mean);
        const value = aggregationValue(entry, labels);
        const entryId = entryKey(entry);
        // Mit Blockschlüssel, damit derselbe Code in zwei Blöcken nicht kollidiert.
        const key = `${block.key}|${entryId}`;
        if (comparison) {
          const match = comparisonBlock?.entries.find(
            (candidate) => entryKey(candidate) === entryId,
          );
          if (!match) continue;
          const comparisonPercent = percent(match.descriptiveStatistics.mean);
          items.push({
            key,
            code: value.code,
            name: value.name,
            block: block.label,
            focusPercent,
            comparisonPercent,
            deviation: labeledDeviation(
              focusPercent,
              comparisonPercent,
              true, // höhere Lösungsquote ist besser
              focus.name,
              comparison.name,
            ),
          });
        } else {
          items.push({
            key,
            code: value.code,
            name: value.name,
            block: block.label,
            focusPercent,
            comparisonPercent: null,
            deviation: null,
          });
        }
      }
    }

    if (items.length === 0) return EMPTY_RANKING;

    const hasComparison = comparison !== undefined;
    const count = Math.max(0, this.count());
    const rankValue = (item: RankItem): number =>
      hasComparison ? item.focusPercent - (item.comparisonPercent as number) : item.focusPercent;

    const byStrength = [...items].sort((a, b) => rankValue(b) - rankValue(a));
    const byWeakness = [...items].sort((a, b) => rankValue(a) - rankValue(b));

    const strengthItems = byStrength.slice(0, count);
    // Reichen die Werte nicht für beide Karten, steht ein Wert nur in der Stärken-Karte.
    const used = new Set(strengthItems);
    const weaknessItems = byWeakness.filter((item) => !used.has(item)).slice(0, count);

    const subtitle = comparison ? `gegenüber ${comparison.name}` : undefined;
    return {
      cards: [
        {
          title: hasComparison ? 'Stärken' : 'Höchste Lösungsquoten',
          subtitle,
          items: strengthItems,
        },
        {
          title: hasComparison ? 'Schwächen' : 'Niedrigste Lösungsquoten',
          subtitle,
          items: weaknessItems,
        },
      ],
      hasComparison,
      showBlock: focusBlocks.length > 1,
    };
  });

  readonly hasContent = computed(() => this.ranking().cards.some((card) => card.items.length > 0));

  setBooklet(booklet: string | undefined): void {
    this.bookletState.set(booklet);
  }

  selectComparison(key: string | undefined): void {
    this.selectedComparisonKey.set(key);
  }
}
