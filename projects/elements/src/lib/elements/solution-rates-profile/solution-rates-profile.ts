import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { Tba3BookletSwitchComponent } from '../../components/booklet-switch/booklet-switch';
import { createBookletState } from '../../components/booklet-switch/booklet-state';
import { Tba3ControlPanelComponent } from '../../components/control-panel/control-panel';
import { Tba3FilterSlot, Tba3ViewSlot } from '../../components/control-panel/control-panel-slots';
import { Tba3AggregationValueComponent } from '../../components/aggregation-value/aggregation-value';
import { Tba3ScaleLegendComponent } from '../../components/scale-legend/scale-legend';
import { Tba3ScalePillComponent } from '../../components/scale-pill/scale-pill';
import { Tba3SortHeaderComponent } from '../../components/sort-header/sort-header';
import type {
  AggregationBlock,
  AggregationEntry,
  AggregationsValueGroup,
  DeviationDirection,
  GroupedValueGroups,
  ScaleLevel,
  ScaleThresholds,
  SolutionRatesScale,
  SortCriterion,
  SortDirection,
  ValueLabels,
} from '../../model';
import {
  aggregationBlocks,
  aggregationValue,
  ariaSort as ariaSortOf,
  blockLabelParts,
  compareBlocks,
  deviation,
  deviationColor,
  deviationTint,
  entryKey,
  forBooklet,
  groupById,
  percent,
  scaleLevel,
  scaleRangeLabel,
  sortByCriteria,
  sortPriority,
  sortThresholds,
  splitByRole,
  toggleSort,
} from '../../model';

/** Anordnung der Tabelle: in Blöcke gegliedert oder flach über alle Blöcke. */
export type ProfileView = 'byDomain' | 'flat';

// Kein Spaltenindex, damit der Schlüssel nicht mit den Wertspalten kollidiert.
const LABEL_COLUMN = 'label';

// Rückfallgrenzen der absoluten Skala; in der relativen Ansicht ungenutzt.
const DEFAULT_THRESHOLDS: ScaleThresholds = [40, 55, 70];

/** Eine Gruppe der Antwort als Haupt- oder Vergleichsspalte des Teilkompetenzen-Profils. */
export interface ProfileColumn {
  /** Gruppenschlüssel `typ:id`, etwa `group:group-8a`. */
  key: string;
  /** Die erste Vergleichsspalte ist der Bezug der relativen Ansicht. */
  role: 'main' | 'comparison';
}

interface ResolvedColumn {
  index: number;
  key: string;
  name: string;
  role: 'main' | 'comparison';
  group: GroupedValueGroups<AggregationsValueGroup> | undefined;
}

interface ProfileColumnView {
  index: number;
  key: string;
  name: string;
  role: 'main' | 'comparison';
  header: string;
  firstComparison: boolean;
}

interface ProfileCellAbsolute {
  level: ScaleLevel;
  emphasis: boolean;
  ariaLabel: string;
}

interface ProfileCellRelative {
  colored: boolean;
  color: string;
  tint: string;
  icon: string;
  ariaLabel: string;
}

interface ProfileCell {
  text: string;
  sortValue: number | undefined;
  emptyAriaLabel: string;
  absolute: ProfileCellAbsolute | undefined;
  relative: ProfileCellRelative | undefined;
}

interface ProfileRow {
  type: string;
  value: string;
  key: string;
  trackId: string;
  domain: string | undefined;
  label: string;
  code: string | undefined;
  cells: ProfileCell[];
}

interface ProfileBlock {
  key: string;
  domain: string | undefined;
  headingParts: string[];
  caption: string;
  rows: ProfileRow[];
}

/** Startsortierung einer Spalte. */
export interface ProfileSort {
  /** Index der Wertspalte, ab 0. */
  column: number;
  direction: SortDirection;
}

/**
 * Zeigt die Lösungsquoten je Teilkompetenz einer Hauptgruppe neben Teil- und Vergleichsgruppen,
 * relativ zu einem Bezug oder auf einer absoluten Skala.
 */
@Component({
  selector: 'tba3-solution-rates-profile',
  standalone: true,
  imports: [
    Tba3BookletSwitchComponent,
    Tba3ControlPanelComponent,
    Tba3FilterSlot,
    Tba3ViewSlot,
    Tba3AggregationValueComponent,
    Tba3ScaleLegendComponent,
    Tba3ScalePillComponent,
    Tba3SortHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './solution-rates-profile.html',
})
export class SolutionRatesProfileComponent {
  /** Value-Groups eines `aggregations`-Endpunkts, die erste ist die Hauptgruppe. */
  readonly aggregations = input<AggregationsValueGroup[]>([]);

  /** Spalten mit Rolle; ohne Angabe Hauptgruppe, Teilgruppen und Vergleiche der Antwort. */
  readonly columns = input<readonly ProfileColumn[] | undefined>(undefined);

  /** Bezugssystem, vom Host gewählt: relativ zum Bezug oder absolute Skala. Standard relativ, ab 5 Pp. */
  readonly scale = input<SolutionRatesScale>({ mode: 'relative', threshold: 5 });

  /** Anfängliche Anordnung, umschaltbar. */
  readonly view = input<ProfileView>('byDomain');

  /** Anfängliche Sortierung; ohne Angabe bleibt die Reihenfolge der Antwort. */
  readonly defaultSort = input<ProfileSort | undefined>(undefined);

  /** Anzeigetexte für Testhefte, Blocknamen und Zeilen ohne `description`. */
  readonly valueLabels = input<ValueLabels | undefined>(undefined);

  /** Meldet den Schlüssel `type.value` der angeklickten Zeile. */
  readonly rowSelected = output<string>();

  private readonly roles = computed(() => splitByRole(this.aggregations()));

  private readonly allGroups = computed(() => groupById(this.aggregations()));

  /** Grenzen der absoluten Skala; nur in der absoluten Ansicht ausgewertet. */
  readonly absoluteThresholds = computed<ScaleThresholds>(() => {
    const scale = this.scale();
    return scale.mode === 'absolute' ? sortThresholds(scale.thresholds) : DEFAULT_THRESHOLDS;
  });

  private readonly relativeThreshold = computed(() => {
    const scale = this.scale();
    return scale.mode === 'relative' ? scale.threshold : 0;
  });

  private readonly bookletState = createBookletState(() => this.roles().focus?.groups ?? []);

  readonly bookletList = this.bookletState.booklets;

  readonly hasBookletSwitch = this.bookletState.hasSwitch;

  readonly activeBooklet = this.bookletState.active;

  private readonly focusGroupsActive = computed(() => {
    const focus = this.roles().focus;
    if (!focus) return [];
    return forBooklet(focus.groups, this.activeBooklet());
  });

  private readonly focusBlocks = computed<AggregationBlock[]>(() => {
    const focusGroups = this.focusGroupsActive();
    if (focusGroups.length === 0) return [];
    return [...aggregationBlocks(focusGroups, this.valueLabels())].sort((a, b) =>
      compareBlocks(a.group, b.group),
    );
  });

  readonly hasViewSwitch = computed(() => this.focusBlocks().length > 1);

  readonly groupedViewLabel = computed(() => {
    const blocks = this.focusBlocks();
    const byDomain = blocks.length > 0 && blocks.every((block) => block.domain !== undefined);
    return byDomain ? 'Nach Domäne' : 'Nach Kompetenztyp';
  });

  readonly activeView = linkedSignal<ProfileView>(() => this.view());

  readonly isFlat = computed(() => this.activeView() === 'flat');

  readonly isRelative = computed(() => this.scale().mode === 'relative');

  private readonly sortCriteria = linkedSignal<SortCriterion<string>[]>(() => {
    const initial = this.defaultSort();
    return initial ? [{ key: String(initial.column), direction: initial.direction }] : [];
  });

  readonly referenceName = computed(() => {
    const columns = this.resolvedColumns();
    return columns[this.referenceIndexOf(columns)]?.name ?? '';
  });

  readonly relativeLegend = computed(() => {
    const threshold = this.relativeThreshold();
    const build = (direction: DeviationDirection, icon: string, text: string) => ({
      direction,
      icon,
      text,
      color: deviationColor(direction),
      tint: deviationTint(direction),
    });
    if (threshold <= 0) {
      return [
        build('better', 'fa-arrow-up', 'darüber'),
        build('neutral', 'fa-circle-dot', 'gleich'),
        build('worse', 'fa-arrow-down', 'darunter'),
      ];
    }
    return [
      build('better', 'fa-arrow-up', `≥ ${threshold} Pp darüber`),
      build('neutral', 'fa-circle-dot', `< ${threshold} Pp Abstand`),
      build('worse', 'fa-arrow-down', `≥ ${threshold} Pp darunter`),
    ];
  });

  private readonly resolvedColumns = computed<ResolvedColumn[]>(() => {
    const configured = this.columns();
    if (configured && configured.length > 0) {
      const all = this.allGroups();
      return configured.map((column, index) => {
        const group = all.find((entry) => entry.key === column.key);
        return {
          index,
          key: group?.key ?? column.key,
          name: group?.name ?? column.key,
          role: column.role,
          group,
        };
      });
    }

    // Nur Gruppen mit Werten im aktiven Heft, sonst entstehen reine „–"-Spalten.
    const booklet = this.activeBooklet();
    const hasValues = (group: GroupedValueGroups<AggregationsValueGroup>) =>
      forBooklet(group.groups, booklet).some((valueGroup) => valueGroup.aggregations.length > 0);

    const roles = this.roles();
    const defs: ResolvedColumn[] = [];
    let index = 0;
    const push = (
      group: GroupedValueGroups<AggregationsValueGroup>,
      role: 'main' | 'comparison',
    ) => {
      if (!hasValues(group)) return;
      defs.push({ index: index++, key: group.key, name: group.name, role, group });
    };
    if (roles.focus) push(roles.focus, 'main');
    for (const part of roles.parts) push(part, 'main');
    for (const comparison of roles.comparisons) push(comparison, 'comparison');
    return defs;
  });

  readonly columnViews = computed<ProfileColumnView[]>(() => {
    const firstComparisonIndex = this.resolvedColumns().findIndex(
      (column) => column.role === 'comparison',
    );
    return this.resolvedColumns().map((column) => ({
      index: column.index,
      key: column.key,
      name: column.name,
      role: column.role,
      header: column.name,
      firstComparison: column.index === firstComparisonIndex,
    }));
  });

  /** Relative Ansicht ohne Vergleichsspalte: es fehlt der Bezug für die Abweichung. */
  readonly missingReference = computed(
    () =>
      this.isRelative() && !this.resolvedColumns().some((column) => column.role === 'comparison'),
  );

  readonly blocks = computed<ProfileBlock[]>(() => {
    const focusBlocks = this.focusBlocks();
    if (focusBlocks.length === 0) return [];

    const booklet = this.activeBooklet();
    const focusGroups = this.focusGroupsActive();
    const columns = this.resolvedColumns();
    const criteria = this.sortCriteria();
    const labels = this.valueLabels();
    const singleBlock = focusBlocks.length === 1;

    const columnBlocks = columns.map((column) =>
      column.group ? aggregationBlocks(forBooklet(column.group.groups, booklet), labels) : [],
    );

    const perBlock = focusBlocks.map((block) => ({
      block,
      rows: block.entries.map((entry) =>
        this.buildRow(block, entry, columns, columnBlocks, labels),
      ),
    }));

    if (this.isFlat()) {
      const rows = this.sortRows(
        perBlock.flatMap((entry) => entry.rows),
        criteria,
      );
      if (rows.length === 0) return [];
      return [
        {
          key: 'flat',
          domain: undefined,
          headingParts: [],
          caption: 'Lösungsquoten je Teilkompetenz über alle Blöcke, sortierbar.',
          rows,
        },
      ];
    }

    return perBlock
      .filter((entry) => entry.rows.length > 0)
      .map((entry) => ({
        key: entry.block.key,
        domain: entry.block.domain,
        headingParts: this.blockHeading(entry.block, focusGroups, singleBlock),
        caption: this.blockCaption(entry.block, singleBlock),
        rows: this.sortRows(entry.rows, criteria),
      }));
  });

  private blockHeading(
    block: AggregationBlock,
    focusGroups: AggregationsValueGroup[],
    singleBlock: boolean,
  ): string[] {
    if (singleBlock) return [];
    return block.domain !== undefined ? blockLabelParts(focusGroups, block.group) : [block.label];
  }

  private blockCaption(block: AggregationBlock, singleBlock: boolean): string {
    const segment = block.domain ?? (singleBlock ? undefined : block.label);
    return segment
      ? `Lösungsquoten je Teilkompetenz, ${segment}, sortierbar.`
      : 'Lösungsquoten je Teilkompetenz, sortierbar.';
  }

  readonly hasRows = computed(() => this.blocks().some((block) => block.rows.length > 0));

  setBooklet(booklet: string | undefined): void {
    this.bookletState.set(booklet);
  }

  setView(view: ProfileView): void {
    this.activeView.set(view);
  }

  readonly labelColumn = LABEL_COLUMN;

  sort(column: number | string): void {
    this.sortCriteria.set(toggleSort(this.sortCriteria(), String(column)));
  }

  sortPriority(column: number | string): number | undefined {
    return sortPriority(this.sortCriteria(), String(column));
  }

  sortDirection(column: number | string): SortDirection | undefined {
    return this.sortCriteria().find((criterion) => criterion.key === String(column))?.direction;
  }

  ariaSort(column: number | string): 'ascending' | 'descending' | 'none' {
    return ariaSortOf(this.sortDirection(column));
  }

  private sortRows(rows: ProfileRow[], criteria: SortCriterion<string>[]): ProfileRow[] {
    return sortByCriteria(rows, criteria, (row, key) =>
      key === LABEL_COLUMN ? (row.code ?? row.label) : row.cells[Number(key)]?.sortValue,
    );
  }

  private buildRow(
    block: AggregationBlock,
    entry: AggregationEntry,
    columns: readonly ResolvedColumn[],
    columnBlocks: readonly AggregationBlock[][],
    labels: ValueLabels | undefined,
  ): ProfileRow {
    const firstMainIndex = columns.findIndex((column) => column.role === 'main');
    const referenceIndex = this.referenceIndexOf(columns);
    const referenceName = columns[referenceIndex]?.name ?? '';
    const key = entryKey(entry);

    const percents = columns.map((_column, position) =>
      this.cellPercent(columnBlocks[position], block.key, key),
    );
    const referencePercent = percents[referenceIndex] ?? null;

    const cells = columns.map((column, position) =>
      this.buildCell(
        column,
        percents[position],
        position === firstMainIndex,
        position === referenceIndex,
        referencePercent,
        referenceName,
      ),
    );

    const resolved = aggregationValue(entry, labels);
    return {
      type: entry.type,
      value: entry.value,
      key,
      // Mit Blockschlüssel, weil derselbe Code in zwei Kompetenztypen vorkommen kann.
      trackId: `${block.key}|${key}`,
      domain: block.domain,
      label: resolved.name,
      code: resolved.code,
      cells,
    };
  }

  // Bezug ist die erste Vergleichsspalte, ohne Vergleich die Hauptgruppe.
  private referenceIndexOf(columns: readonly ResolvedColumn[]): number {
    const comparison = columns.findIndex((column) => column.role === 'comparison');
    return comparison !== -1 ? comparison : 0;
  }

  private buildCell(
    column: ResolvedColumn,
    value: number | null,
    emphasis: boolean,
    isReference: boolean,
    referencePercent: number | null,
    referenceName: string,
  ): ProfileCell {
    if (value === null) return emptyCell(column.name);
    if (this.isRelative()) {
      return {
        text: `${value} %`,
        sortValue: value,
        emptyAriaLabel: '',
        absolute: undefined,
        relative: this.buildRelative(value, isReference, referencePercent, referenceName),
      };
    }
    const level = this.levelOf(value);
    return {
      text: `${value} %`,
      sortValue: value,
      emptyAriaLabel: '',
      absolute: {
        level,
        emphasis,
        ariaLabel: `${column.name}: ${value} %, ${scaleRangeLabel(level, this.absoluteThresholds())}`,
      },
      relative: undefined,
    };
  }

  private buildRelative(
    value: number,
    isReference: boolean,
    referencePercent: number | null,
    referenceName: string,
  ): ProfileCellRelative {
    if (isReference || referencePercent === null) {
      return {
        colored: false,
        color: '',
        tint: '',
        icon: '',
        ariaLabel: isReference ? `${value} %, Bezugswert` : `${value} %, Bezug ohne Wert`,
      };
    }
    const dev = deviation(value, referencePercent, true);
    const belowThreshold = Math.abs(dev.diff) < this.relativeThreshold();
    const direction = belowThreshold ? 'neutral' : dev.direction;
    const icon = dev.diff > 0 ? 'fa-arrow-up' : dev.diff < 0 ? 'fa-arrow-down' : 'fa-circle-dot';
    return {
      colored: true,
      color: deviationColor(direction),
      tint: deviationTint(direction),
      icon,
      ariaLabel: `${value} %, ${this.relativeDetail(dev.diff, referenceName)}`,
    };
  }

  private relativeDetail(diff: number, referenceName: string): string {
    if (diff === 0) return `gleich ${referenceName}`;
    const magnitude = Math.abs(diff);
    const direction = diff > 0 ? 'über' : 'unter';
    return `${magnitude} Prozentpunkte ${direction} ${referenceName}`;
  }

  private levelOf(value: number): ScaleLevel {
    return scaleLevel(value, this.absoluteThresholds());
  }

  private cellPercent(
    columnBlocks: readonly AggregationBlock[],
    blockKey: string,
    key: string,
  ): number | null {
    const block = columnBlocks.find((candidate) => candidate.key === blockKey);
    const entry = block?.entries.find((candidate) => entryKey(candidate) === key);
    return entry ? percent(entry.descriptiveStatistics.mean) : null;
  }
}

function emptyCell(columnName: string): ProfileCell {
  return {
    text: '–',
    sortValue: undefined,
    emptyAriaLabel: `${columnName}: ohne Wert`,
    absolute: undefined,
    relative: undefined,
  };
}
