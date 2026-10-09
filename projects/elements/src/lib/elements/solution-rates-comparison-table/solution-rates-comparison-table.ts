import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { Tba3AggregationValueComponent } from '../../components/aggregation-value/aggregation-value';
import { Tba3BookletSwitchComponent } from '../../components/booklet-switch/booklet-switch';
import { createBookletState } from '../../components/booklet-switch/booklet-state';
import { Tba3ControlPanelComponent } from '../../components/control-panel/control-panel';
import { Tba3FilterSlot, Tba3ViewSlot } from '../../components/control-panel/control-panel-slots';
import { Tba3DeltaComponent } from '../../components/delta/delta';
import { Tba3SortHeaderComponent } from '../../components/sort-header/sort-header';
import type {
  AggregationBlock,
  AggregationEntry,
  AggregationsValueGroup,
  Deviation,
  GroupedValueGroups,
  SortCriterion,
  SortDirection,
  SortValue,
  ValueLabels,
} from '../../model';
import {
  aggregationBlocks,
  aggregationValue,
  ariaSort as ariaSortOf,
  blockLabelParts,
  compareBlocks,
  deviation,
  entryKey,
  forBooklet,
  percent,
  sortByCriteria,
  sortPriority,
  splitByRole,
  toggleSort,
} from '../../model';

/** Ansicht der Tabelle: je Block eine Tabelle oder eine flache Tabelle über alle Blöcke. */
export type ComparisonTableView = 'byDomain' | 'flat';

/** Startsortierung als Spaltenschlüssel und Richtung. */
export interface ComparisonTableSort {
  /** `competence`, `value:<typ:id>` oder `delta:<typ:id>`. */
  column: string;
  direction: SortDirection;
}

interface ValueColumnView {
  key: string;
  groupKey: string;
  name: string;
  isMain: boolean;
}

interface DeltaColumnView {
  key: string;
  name: string;
  header: string;
}

interface ValueCell {
  text: string;
  isMain: boolean;
  sortValue: number | undefined;
  emptyLabel: string | undefined;
}

interface DeltaCell {
  deviation: Deviation | undefined;
  sortValue: number | undefined;
  emptyLabel: string | undefined;
}

interface TableRow {
  rowKey: string;
  value: string;
  code: string | undefined;
  name: string;
  secondary: string | undefined;
  valueCells: ValueCell[];
  deltaCells: DeltaCell[];
}

interface TableBlock {
  key: string;
  label: string[];
  caption: string;
  rows: TableRow[];
}

const COMPETENCE_COLUMN = 'competence';

/**
 * Vergleicht die Lösungsquoten je Teilkompetenz einer Gruppe mit Vergleichsgruppen in einer
 * sortierbaren Tabelle, mit Abweichungen in Prozentpunkten.
 */
@Component({
  selector: 'tba3-solution-rates-comparison-table',
  standalone: true,
  imports: [
    Tba3ControlPanelComponent,
    Tba3FilterSlot,
    Tba3ViewSlot,
    Tba3BookletSwitchComponent,
    Tba3AggregationValueComponent,
    Tba3DeltaComponent,
    Tba3SortHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './solution-rates-comparison-table.html',
})
export class SolutionRatesComparisonTableComponent {
  /** Value-Groups eines `aggregations`-Endpunkts, die erste ist die Hauptgruppe. */
  readonly aggregations = input<AggregationsValueGroup[]>([]);

  /** Vergleichsgruppen als `typ:id`, die als Δ-Spalte erscheinen; leer heißt die erste. */
  readonly deltas = input<readonly string[]>([]);

  /** Abweichung in Prozentpunkten, ab der ein Δ farbig markiert wird. */
  readonly deviationThreshold = input<number>(5);

  /** Startansicht: je Block eine Tabelle oder eine flache Tabelle über alle Blöcke. */
  readonly view = input<ComparisonTableView>('byDomain');

  /** Startsortierung; ohne Angabe aufsteigend nach der ersten Δ-Spalte. */
  readonly defaultSort = input<ComparisonTableSort | undefined>(undefined);

  /** Anzeigetexte für Testhefte, Zeilen ohne `description` und Kompetenztypen. */
  readonly valueLabels = input<ValueLabels | undefined>(undefined);

  /** Meldet den Eintragsschlüssel `type.value` der angeklickten Zeile. */
  readonly rowSelected = output<string>();

  private readonly roles = computed(() => splitByRole(this.aggregations()));

  private readonly bookletState = createBookletState(() => this.roles().focus?.groups ?? []);

  readonly bookletList = this.bookletState.booklets;

  readonly hasBookletSwitch = this.bookletState.hasSwitch;

  readonly activeBooklet = this.bookletState.active;

  private readonly focusGroups = computed(() => {
    const focus = this.roles().focus;
    if (!focus) return [];
    return forBooklet(focus.groups, this.activeBooklet());
  });

  private readonly focusBlocks = computed(() =>
    aggregationBlocks(this.focusGroups(), this.valueLabels()),
  );

  readonly hasViewSwitch = computed(() => this.focusBlocks().length > 1);

  readonly groupedViewLabel = computed(() => {
    const blocks = this.focusBlocks();
    const byDomain = blocks.length > 0 && blocks.every((block) => block.domain !== undefined);
    return byDomain ? 'Nach Domäne' : 'Nach Kompetenztyp';
  });

  // linkedSignal: ein neuer `view`-Input setzt die Ansicht zurück, der Umschalter überschreibt sie.
  private readonly selectedView = linkedSignal<ComparisonTableView>(() => this.view());

  readonly activeView = computed<ComparisonTableView>(() =>
    this.hasViewSwitch() ? this.selectedView() : 'byDomain',
  );

  // Ein Vergleich ohne Werte im aktiven Heft ergäbe eine reine „–“-Spalte.
  private readonly shownComparisons = computed(() => {
    const booklet = this.activeBooklet();
    return this.roles().comparisons.filter((group) => forBooklet(group.groups, booklet).length > 0);
  });

  private readonly valueColumns = computed<ValueColumnView[]>(() => {
    const roles = this.roles();
    const columns: ValueColumnView[] = [];
    if (roles.focus) {
      columns.push({
        key: `value:${roles.focus.key}`,
        groupKey: roles.focus.key,
        name: roles.focus.name,
        isMain: true,
      });
    }
    for (const comparison of this.shownComparisons()) {
      columns.push({
        key: `value:${comparison.key}`,
        groupKey: comparison.key,
        name: comparison.name,
        isMain: false,
      });
    }
    return columns;
  });

  private readonly deltaColumns = computed<DeltaColumnView[]>(() => {
    const comparisons = this.shownComparisons();
    if (comparisons.length === 0) return [];

    const chosen = this.deltas();
    const selected: GroupedValueGroups<AggregationsValueGroup>[] =
      chosen.length === 0
        ? [comparisons[0]]
        : chosen
            .map((entry) => comparisons.find((group) => group.key === entry))
            .filter((group): group is GroupedValueGroups<AggregationsValueGroup> => !!group);

    const seen = new Set<string>();
    const columns: DeltaColumnView[] = [];
    for (const group of selected) {
      if (seen.has(group.key)) continue;
      seen.add(group.key);
      columns.push({ key: `delta:${group.key}`, name: group.name, header: `Δ ${group.name}` });
    }
    return columns;
  });

  readonly valueColumnViews = this.valueColumns;

  readonly deltaColumnViews = this.deltaColumns;

  private readonly focusColumnKey = computed(() => this.roles().focus?.key);

  private readonly sortCriteria = linkedSignal<SortCriterion<string>[]>(() => {
    const initial = this.defaultSort();
    if (initial) return [{ key: initial.column, direction: initial.direction }];
    const firstDelta = this.deltaColumns()[0];
    return firstDelta ? [{ key: firstDelta.key, direction: 'asc' as const }] : [];
  });

  readonly blocks = computed<TableBlock[]>(() => {
    const focus = this.roles().focus;
    const focusGroups = this.focusGroups();
    const focusBlocks = this.focusBlocks();
    if (!focus || focusBlocks.length === 0) return [];

    const valueColumns = this.valueColumns();
    const deltaColumns = this.deltaColumns();
    const labels = this.valueLabels();
    const booklet = this.activeBooklet();

    const columnBlocks = new Map<string, AggregationBlock[]>();
    columnBlocks.set(focus.key, focusBlocks);
    for (const comparison of this.shownComparisons()) {
      columnBlocks.set(
        comparison.key,
        aggregationBlocks(forBooklet(comparison.groups, booklet), labels),
      );
    }

    if (this.activeView() === 'flat') {
      const rows = focusBlocks.flatMap((block) =>
        block.entries.map((entry) =>
          this.buildRow(block, entry, block.label, valueColumns, deltaColumns, columnBlocks),
        ),
      );
      if (rows.length === 0) return [];
      return [
        { key: 'flat', label: [], caption: this.captionFor(undefined), rows: this.sortRows(rows) },
      ];
    }

    const singleBlock = focusBlocks.length === 1;
    const ordered = [...focusBlocks].sort((a, b) => compareBlocks(a.group, b.group));
    const blocks: TableBlock[] = [];
    for (const block of ordered) {
      const rows = block.entries.map((entry) =>
        this.buildRow(block, entry, undefined, valueColumns, deltaColumns, columnBlocks),
      );
      if (rows.length === 0) continue;
      blocks.push({
        key: block.key,
        label: this.blockHeading(block, focusGroups, singleBlock),
        caption: this.captionFor(block.label),
        rows: this.sortRows(rows),
      });
    }
    return blocks;
  });

  private blockHeading(
    block: AggregationBlock,
    focusGroups: readonly AggregationsValueGroup[],
    singleBlock: boolean,
  ): string[] {
    if (singleBlock) return [];
    return block.domain !== undefined ? blockLabelParts(focusGroups, block.group) : [block.label];
  }

  readonly hasRows = computed(() => this.blocks().length > 0);

  setBooklet(booklet: string | undefined): void {
    this.bookletState.set(booklet);
  }

  setView(view: ComparisonTableView): void {
    this.selectedView.set(view);
  }

  sort(column: string): void {
    this.sortCriteria.set(toggleSort(this.sortCriteria(), column));
  }

  sortPriority(column: string): number | undefined {
    return sortPriority(this.sortCriteria(), column);
  }

  sortDirection(column: string): SortDirection | undefined {
    return this.sortCriteria().find((criterion) => criterion.key === column)?.direction;
  }

  ariaSort(column: string): 'ascending' | 'descending' | 'none' {
    return ariaSortOf(this.sortDirection(column));
  }

  readonly competenceColumn = COMPETENCE_COLUMN;

  private buildRow(
    block: AggregationBlock,
    entry: AggregationEntry,
    secondary: string | undefined,
    valueColumns: readonly ValueColumnView[],
    deltaColumns: readonly DeltaColumnView[],
    columnBlocks: ReadonlyMap<string, AggregationBlock[]>,
  ): TableRow {
    const key = entryKey(entry);
    const percentByKey = new Map<string, number>();
    const valueCells = valueColumns.map((column) => {
      const value = this.cellPercent(columnBlocks.get(column.groupKey), block.key, key);
      if (value !== null) percentByKey.set(column.groupKey, value);
      return {
        text: value === null ? '–' : `${value} %`,
        isMain: column.isMain,
        sortValue: value ?? undefined,
        emptyLabel: value === null ? `${column.name}: ohne Wert` : undefined,
      };
    });

    const focusKey = this.focusColumnKey();
    const focusValue = focusKey !== undefined ? percentByKey.get(focusKey) : undefined;
    const deltaCells = deltaColumns.map((column) => {
      const comparisonKey = column.key.slice('delta:'.length);
      const comparisonValue = percentByKey.get(comparisonKey);
      if (focusValue === undefined || comparisonValue === undefined) {
        return {
          deviation: undefined,
          sortValue: undefined,
          emptyLabel: `${column.header}: ohne Wert`,
        };
      }
      const dev = deviation(focusValue, comparisonValue, true);
      return { deviation: dev, sortValue: dev.diff, emptyLabel: undefined };
    });

    const value = aggregationValue(entry, this.valueLabels());
    return {
      rowKey: key,
      value: entry.value,
      code: value.code,
      name: value.name,
      secondary,
      valueCells,
      deltaCells,
    };
  }

  private sortRows(rows: TableRow[]): TableRow[] {
    return sortByCriteria(rows, this.sortCriteria(), (row, key) => this.sortValue(row, key));
  }

  private sortValue(row: TableRow, key: string): SortValue {
    if (key === COMPETENCE_COLUMN) return row.value;
    if (key.startsWith('value:')) {
      const index = this.valueColumns().findIndex((column) => column.key === key);
      return index === -1 ? undefined : row.valueCells[index]?.sortValue;
    }
    if (key.startsWith('delta:')) {
      const index = this.deltaColumns().findIndex((column) => column.key === key);
      return index === -1 ? undefined : row.deltaCells[index]?.sortValue;
    }
    return undefined;
  }

  private captionFor(label: string | undefined): string {
    const focus = this.roles().focus?.name ?? '';
    const comparisons = this.shownComparisons().map((group) => group.name);
    const prefix = label
      ? `Lösungsquoten je Teilkompetenz, ${label}`
      : 'Lösungsquoten je Teilkompetenz';
    const against = comparisons.length ? ` gegenüber ${comparisons.join(', ')}` : '';
    return `${prefix}: ${focus}${against}, sortierbar.`;
  }

  // Block- und Eintragsschlüssel trennen denselben Code in zwei Aggregationsarten.
  private cellPercent(
    blocks: AggregationBlock[] | undefined,
    blockKey: string,
    key: string,
  ): number | null {
    const block = blocks?.find((candidate) => candidate.key === blockKey);
    const entry = block?.entries.find((candidate) => entryKey(candidate) === key);
    return entry ? percent(entry.descriptiveStatistics.mean) : null;
  }
}
