import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { Tba3BookletSwitchComponent } from '../../components/booklet-switch/booklet-switch';
import { createBookletState } from '../../components/booklet-switch/booklet-state';
import { Tba3CardGridComponent } from '../../components/card-grid/card-grid';
import { Tba3ControlPanelComponent } from '../../components/control-panel/control-panel';
import {
  Tba3ComparisonsSlot,
  Tba3FilterSlot,
} from '../../components/control-panel/control-panel-slots';
import { Tba3AggregationValueComponent } from '../../components/aggregation-value/aggregation-value';
import { Tba3DeltaComponent } from '../../components/delta/delta';
import type { AggregationsValueGroup, Deviation, RelativeScale, ValueLabels } from '../../model';
import {
  aggregationBlocks,
  aggregationValue,
  entryKey,
  forBooklet,
  labeledDeviation,
  percent,
  splitByRole,
} from '../../model';

/**
 * Bezugssystem des Rankings: relativ nach Abweichung zu einer Vergleichsgruppe, absolut nach der
 * Lösungsquote selbst. Absolut färbt das Ranking nichts ein und braucht daher keine Schwellen.
 */
export type RankingScale = RelativeScale | { readonly mode: 'absolute' };

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
  showBlock: boolean;
  // Relativ und Hauptgruppe vorhanden, aber ohne Vergleichsgruppe: Hinweis statt Karten.
  missingComparison: boolean;
}

interface ComparisonOption {
  key: string;
  name: string;
}

const EMPTY_RANKING: Ranking = {
  cards: [],
  showBlock: false,
  missingComparison: false,
};

/**
 * Zeigt die stärksten und schwächsten Lösungsquoten einer Gruppe als zwei Karten. Das Bezugssystem
 * bestimmt `scale`: relativ rankt nach der Abweichung zu einer Vergleichsgruppe, absolut nach der
 * Lösungsquote selbst.
 */
@Component({
  selector: 'tba3-solution-rates-ranking',
  standalone: true,
  imports: [
    Tba3BookletSwitchComponent,
    Tba3CardGridComponent,
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

  /** Bezugssystem: relativ nach Abweichung zu einer Vergleichsgruppe, absolut nach Lösungsquote. */
  readonly scale = input<RankingScale>({ mode: 'relative', threshold: 5 });

  /** Anfangs gewählte Vergleichsgruppe für den relativen Modus als `typ:id`, sonst die erste. */
  readonly comparison = input<string | undefined>(undefined);

  /** Anzahl der Einträge je Karte. */
  readonly count = input<number>(3);

  /** Anzeigetexte für Testhefte, Werte ohne `description` und Kompetenztypen. */
  readonly valueLabels = input<ValueLabels | undefined>(undefined);

  private readonly isRelative = computed(() => this.scale().mode === 'relative');

  // Prozentpunkte, ab denen die Δ-Pille einfärbt; absolut gibt es keine Pillen.
  readonly threshold = computed(() => {
    const scale = this.scale();
    return scale.mode === 'relative' ? scale.threshold : 0;
  });

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

  // Wie beim Testheft-Umschalter: nur bei echter Wahl, also ab zwei Vergleichsgruppen.
  readonly showComparisonSelector = computed(
    () => this.isRelative() && this.availableComparisons().length > 1,
  );

  // Input oder Heftwechsel setzen die Auswahl zurück, die Zeile „Vergleichswerte" überschreibt sie.
  readonly selectedComparisonKey = linkedSignal<string | undefined>(() => {
    const available = this.availableComparisons();
    if (available.length === 0) return undefined;
    const wanted = this.comparison();
    const match = wanted ? available.find((group) => group.key === wanted) : undefined;
    return (match ?? available[0]).key;
  });

  private readonly selectedComparison = computed(() => {
    const key = this.selectedComparisonKey();
    if (!key) return undefined;
    return this.availableComparisons().find((group) => group.key === key);
  });

  readonly hasComparison = computed(() => this.selectedComparison() !== undefined);

  readonly hasControls = computed(() => this.hasBookletSwitch() || this.showComparisonSelector());

  readonly ranking = computed<Ranking>(() => {
    const focus = this.roles().focus;
    if (!focus) return EMPTY_RANKING;

    const booklet = this.activeBooklet();
    const labels = this.valueLabels();
    const focusBlocks = aggregationBlocks(forBooklet(focus.groups, booklet), labels);
    if (focusBlocks.length === 0) return EMPTY_RANKING;

    const relative = this.isRelative();
    const comparison = relative ? this.selectedComparison() : undefined;

    // Relativ ohne Vergleichsgruppe (auch nach Heftwechsel): kein Fehler, nur der Hinweis.
    if (relative && !comparison) {
      return { cards: [], showBlock: false, missingComparison: true };
    }

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

    const count = Math.max(0, this.count());
    const rankValue = (item: RankItem): number =>
      comparison ? item.focusPercent - (item.comparisonPercent as number) : item.focusPercent;

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
          title: comparison ? 'Stärken' : 'Höchste Lösungsquoten',
          subtitle,
          items: strengthItems,
        },
        {
          title: comparison ? 'Schwächen' : 'Niedrigste Lösungsquoten',
          subtitle,
          items: weaknessItems,
        },
      ],
      showBlock: focusBlocks.length > 1,
      missingComparison: false,
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
