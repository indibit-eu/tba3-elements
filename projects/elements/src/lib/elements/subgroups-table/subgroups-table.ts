import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  input,
  linkedSignal,
  Output,
  signal,
} from '@angular/core';
import { Tba3ControlPanelComponent } from '../../components/control-panel/control-panel';
import {
  Tba3ComparisonsSlot,
  Tba3FilterSlot,
} from '../../components/control-panel/control-panel-slots';
import { Tba3DeltaComponent } from '../../components/delta/delta';
import { Tba3LegendComponent, type Tba3LegendItem } from '../../components/legend/legend';
import { Tba3ScaleLegendComponent } from '../../components/scale-legend/scale-legend';
import { Tba3ScalePillComponent } from '../../components/scale-pill/scale-pill';
import { Tba3SortHeaderComponent } from '../../components/sort-header/sort-header';
import type {
  AggregationEntry,
  AggregationsValueGroup,
  ClassificationDistribution,
  Deviation,
  ScaleLevel,
  ScaleThresholds,
  SortCriterion,
  SortDirection,
  SortValue,
  StandardMetric,
  StandardMetricKey,
  ValueLabels,
} from '../../model';
import {
  ariaSort as ariaSortOf,
  categoryVariable,
  characteristicOf,
  characteristicTotal,
  CLASSIFICATION_BANDS,
  classificationBands,
  compositionEntries,
  GENDER_AGGREGATION,
  groupById,
  hasClassifications,
  labeledDeviation,
  LANGUAGE_AT_HOME_AGGREGATION,
  minimumClassificationDistribution,
  nonMinimumClassificationEntries,
  PARTICIPATION_AGGREGATION,
  participationShare,
  percent,
  registeredUnitCount,
  resolveLabel,
  scaleLevel,
  scaleRangeLabel,
  sortByCriteria,
  sortPriority,
  sortThresholds,
  splitByRole,
  standardMetric,
  toggleSort,
  typeRank,
  UNIT_AGGREGATIONS,
  unitLabel,
} from '../../model';

export type SubgroupsRowRole = 'comparison' | 'focus' | 'part';

export type SubgroupsMetric = 'minimumReached' | 'upperRange' | 'distribution';

export interface SubgroupsSegment {
  value: string;
  label: string;
  percent: number;
  width: number;
  color: string;
}

export interface SubgroupsCharacteristicCell {
  segments: SubgroupsSegment[];
  text: string;
}

export interface SubgroupsMetricCell {
  value: number | undefined;
  barColor: string;
  scale: { level: ScaleLevel; ariaLabel: string } | undefined;
  bands: SubgroupsSegment[] | undefined;
  bandsText: string;
  delta: Deviation | undefined;
}

export interface SubgroupsRowView {
  id: string;
  name: string;
  role: SubgroupsRowRole;
  selected: boolean;
  units: Readonly<Record<string, number>>;
  students: number | undefined;
  participated: number | undefined;
  participationRate: number | undefined;
  participationText: string;
  characteristics: Readonly<Record<string, SubgroupsCharacteristicCell>>;
  metric: SubgroupsMetricCell | undefined;
}

export interface SubgroupsUnitColumn {
  type: string;
  label: string;
  sortKey: SubgroupsSortColumn;
}

export interface SubgroupsCharacteristicColumn {
  type: string;
  label: string;
  legend: Tba3LegendItem[];
}

export interface SubgroupsComparisonOption {
  id: string;
  name: string;
}

export type SubgroupsSortColumn =
  'name' | 'students' | 'participated' | 'participation' | 'metric' | 'delta' | `unit:${string}`;

interface RoleGroup {
  key: string;
  name: string;
  role: SubgroupsRowRole;
}

interface RowData {
  group: RoleGroup;
  byType: Map<string, AggregationEntry[]>;
  distribution: ClassificationDistribution | undefined;
  students: number | undefined;
}

type BaseRow = Omit<SubgroupsRowView, 'metric' | 'selected'> & {
  distribution: ClassificationDistribution | undefined;
};

interface ValueSlot {
  index: number;
  label: string;
}

const METRIC_OPTIONS: readonly { key: SubgroupsMetric; label: string }[] = [
  { key: 'minimumReached', label: standardMetric('minimumReached').label },
  { key: 'upperRange', label: standardMetric('upperRange').label },
  { key: 'distribution', label: 'Verteilung' },
];

const UNIT_SORT_PREFIX = 'unit:';

// Weitere Merkmale wie SES zeigt die Tabelle bewusst nicht, auch wenn die Antwort sie trägt.
const CHARACTERISTIC_TYPES: readonly string[] = [GENDER_AGGREGATION, LANGUAGE_AT_HOME_AGGREGATION];

/**
 * Zeigt die Teilgruppen einer Ebene als sortierbare Tabelle mit Zusammensetzung und einer Kennzahl
 * zum Standard, darüber die übergeordneten Gruppen als feste Zeilen.
 */
@Component({
  selector: 'tba3-subgroups-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    Tba3ControlPanelComponent,
    Tba3FilterSlot,
    Tba3ComparisonsSlot,
    Tba3DeltaComponent,
    Tba3LegendComponent,
    Tba3ScaleLegendComponent,
    Tba3ScalePillComponent,
    Tba3SortHeaderComponent,
  ],
  templateUrl: './subgroups-table.html',
})
export class SubgroupsTableComponent {
  /** Value-Groups eines `aggregations`-Endpunkts, die erste ist die Hauptgruppe. */
  readonly aggregations = input<AggregationsValueGroup[]>([]);

  /** Anzeigetexte für Merkmale, Ausprägungen und Einheiten. */
  readonly valueLabels = input<ValueLabels | undefined>(undefined);

  /** Grenzen der Skala „Mindeststandard erreicht“ in Prozent. */
  readonly thresholds = input<ScaleThresholds>([60, 75, 85]);

  /** Grenzen der Skala „Oberer Leistungsbereich“ in Prozent, ohne Angabe keine Skala. */
  readonly upperRangeThresholds = input<ScaleThresholds | undefined>(undefined);

  /** Prozentpunkte, ab denen die Differenz wertet. */
  readonly deviationThreshold = input(5);

  /** Anfangs gewählte Kennzahl. */
  readonly metric = input<SubgroupsMetric>('minimumReached');

  /** Anfangs gewählte Vergleichszeile als `typ:id`. */
  readonly comparison = input<string | undefined>(undefined);

  // EventEmitter statt output(): nur `.observed` zeigt, ob jemand zuhört und der Name ein Button wird.
  /** Angeklickte Gruppe als `typ:id`. */
  @Output() readonly rowSelected = new EventEmitter<string>();

  readonly activeMetric = linkedSignal<SubgroupsMetric>(() => this.metric());

  readonly activeComparison = linkedSignal<string | undefined>(() => this.comparison());

  private readonly sortCriteria = signal<SortCriterion<SubgroupsSortColumn>[]>([]);

  readonly metricOptions = METRIC_OPTIONS;

  readonly isDistribution = computed(() => this.activeMetric() === 'distribution');

  private readonly metricDefinition = computed<StandardMetric | undefined>(() => {
    const metric = this.activeMetric();
    return metric === 'distribution' ? undefined : standardMetric(metric as StandardMetricKey);
  });

  readonly metricLabel = computed(() => this.metricDefinition()?.label ?? 'Verteilung');

  readonly activeThresholds = computed<ScaleThresholds | undefined>(() => {
    switch (this.activeMetric()) {
      case 'minimumReached':
        return sortThresholds(this.thresholds());
      case 'upperRange': {
        const thresholds = this.upperRangeThresholds();
        return thresholds ? sortThresholds(thresholds) : undefined;
      }
      default:
        return undefined;
    }
  });

  private readonly subjectDistributions = computed<ClassificationDistribution[]>(() =>
    minimumClassificationDistribution(this.aggregations()),
  );

  private readonly subject = computed(() => this.subjectDistributions()[0]?.subject);

  private readonly distributionByKey = computed<Map<string, ClassificationDistribution>>(() => {
    const subject = this.subject();
    const map = new Map<string, ClassificationDistribution>();
    for (const distribution of this.subjectDistributions()) {
      if (distribution.subject === subject && hasClassifications(distribution)) {
        map.set(distribution.key, distribution);
      }
    }
    return map;
  });

  private readonly roleGroups = computed<RoleGroup[]>(() => {
    // Leere Value-Groups vorher aussortieren, damit keine davon Hauptgruppe wird.
    const relevant = this.aggregations().filter((group) => group.aggregations.length > 0);
    const { focus, comparisons, parts } = splitByRole(relevant);
    if (!focus) return [];
    const pinned = [...comparisons].sort((a, b) => typeRank(b.type) - typeRank(a.type));
    return [
      ...pinned.map((group) => ({ key: group.key, name: group.name, role: 'comparison' as const })),
      { key: focus.key, name: focus.name, role: 'focus' as const },
      ...parts.map((group) => ({ key: group.key, name: group.name, role: 'part' as const })),
    ];
  });

  private readonly rowData = computed<RowData[]>(() => {
    const compositionByKey = new Map(
      groupById(this.aggregations()).map((group) => [group.key, this.compositionOf(group.groups)]),
    );
    const distributionByKey = this.distributionByKey();
    return this.roleGroups().map((group) => {
      const byType = compositionByKey.get(group.key) ?? new Map<string, AggregationEntry[]>();
      const distribution = distributionByKey.get(group.key);
      return {
        group,
        byType,
        distribution,
        students: distribution?.total ?? characteristicTotal(byType),
      };
    });
  });

  // Die Farbe hängt an der Ausprägung, nicht an der Position, damit Balken und Legende passen.
  private readonly valueSlots = computed<Map<string, Map<string, ValueSlot>>>(() => {
    const labels = this.valueLabels();
    const rows = this.rowData();
    const slots = new Map<string, Map<string, ValueSlot>>();
    for (const type of CHARACTERISTIC_TYPES) {
      const values = new Map<string, ValueSlot>();
      for (const row of rows) {
        for (const entry of row.byType.get(type) ?? []) {
          if (values.has(entry.value)) continue;
          values.set(entry.value, {
            index: values.size,
            label: resolveLabel(labels, characteristicOf(type), entry.value, {
              description: entry.description,
            }),
          });
        }
      }
      slots.set(type, values);
    }
    return slots;
  });

  readonly characteristicColumns = computed<SubgroupsCharacteristicColumn[]>(() => {
    const labels = this.valueLabels();
    const columns: SubgroupsCharacteristicColumn[] = [];
    for (const [type, values] of this.valueSlots()) {
      if (values.size < 2) continue;
      const label = resolveLabel(labels, 'aggregation', type);
      columns.push({
        type,
        label,
        legend: [
          { text: label },
          ...[...values.values()].map((slot) => ({
            color: `var(${categoryVariable(slot.index)})`,
            text: slot.label,
          })),
        ],
      });
    }
    return columns;
  });

  private readonly baseRows = computed<BaseRow[]>(() => {
    const columns = this.characteristicColumns();
    const slots = this.valueSlots();
    return this.rowData().map((data) => this.buildBaseRow(data, columns, slots));
  });

  readonly comparisonOptions = computed<SubgroupsComparisonOption[]>(() =>
    this.baseRows()
      .filter((row) => row.role !== 'part')
      .map((row) => ({ id: row.id, name: row.name })),
  );

  readonly selectedComparison = computed<BaseRow | undefined>(() => {
    if (this.isDistribution()) return undefined;
    const id = this.activeComparison();
    if (id === undefined) return undefined;
    return this.baseRows().find((row) => row.role !== 'part' && row.id === id);
  });

  private readonly comparisonValue = computed<number | undefined>(() => {
    const definition = this.metricDefinition();
    const distribution = this.selectedComparison()?.distribution;
    return definition && distribution ? percent(definition.select(distribution)) : undefined;
  });

  readonly showScale = computed(
    () =>
      this.hasDistribution() &&
      this.activeThresholds() !== undefined &&
      this.selectedComparison() === undefined,
  );

  readonly showDelta = computed(
    () => this.hasDistribution() && this.selectedComparison() !== undefined,
  );

  private readonly rows = computed<SubgroupsRowView[]>(() => {
    const selectedId = this.selectedComparison()?.id;
    return this.baseRows().map(({ distribution, ...row }) => ({
      ...row,
      selected: row.id === selectedId,
      metric: distribution ? this.metricCell(row, distribution) : undefined,
    }));
  });

  readonly pinnedRows = computed(() => this.rows().filter((row) => row.role !== 'part'));

  readonly partRows = computed(() =>
    sortByCriteria(
      this.rows().filter((row) => row.role === 'part'),
      this.sortCriteria(),
      (row, key) => this.sortValue(row, key),
    ),
  );

  readonly unitColumns = computed<SubgroupsUnitColumn[]>(() => {
    const labels = this.valueLabels();
    const rows = this.baseRows();
    const parts = rows.filter((row) => row.role === 'part');
    // Nach den Teilgruppen, sonst stünde im Landesbericht eine fast leere Spalte „Schulämter“.
    const source = parts.length > 0 ? parts : rows;
    return UNIT_AGGREGATIONS.filter((unit) =>
      source.some((row) => row.units[unit.type] !== undefined),
    ).map((unit) => ({
      type: unit.type,
      label: unitLabel(labels, unit.unit, unit.fallback),
      sortKey: `${UNIT_SORT_PREFIX}${unit.type}` as const,
    }));
  });

  readonly hasParticipation = computed(() =>
    this.baseRows().some((row) => row.participated !== undefined),
  );

  readonly hasStudents = computed(() => this.baseRows().some((row) => row.students !== undefined));

  readonly showStudents = computed(() => this.hasStudents() && !this.hasParticipation());

  readonly hasDistribution = computed(() =>
    this.baseRows().some((row) => row.distribution !== undefined),
  );

  readonly hasParts = computed(() => this.baseRows().some((row) => row.role === 'part'));

  readonly hasContent = computed(
    () =>
      this.baseRows().length > 0 &&
      (this.unitColumns().length > 0 ||
        this.hasParticipation() ||
        this.hasStudents() ||
        this.characteristicColumns().length > 0 ||
        this.hasDistribution()),
  );

  readonly showBands = computed(() => this.hasDistribution() && this.isDistribution());

  readonly hasLegend = computed(
    () => this.showScale() || this.showBands() || this.characteristicColumns().length > 0,
  );

  readonly bandLegend = computed<Tba3LegendItem[]>(() => [
    { text: 'Verteilung' },
    ...CLASSIFICATION_BANDS.map((band) => ({
      color: `var(${band.variable})`,
      text: band.label,
      marker: band.marker,
    })),
  ]);

  readonly columnCount = computed(
    () =>
      1 +
      this.unitColumns().length +
      (this.hasParticipation() ? 2 : 0) +
      (this.showStudents() ? 1 : 0) +
      this.characteristicColumns().length +
      (this.hasDistribution() ? 1 : 0) +
      (this.showDelta() ? 1 : 0),
  );

  readonly rowCount = computed(() => this.rows().length);

  readonly spread = computed<{ min: number; max: number; range: number } | undefined>(() => {
    if (this.isDistribution()) return undefined;
    const values = this.partRows()
      .map((row) => row.metric?.value)
      .filter((value): value is number => value !== undefined);
    if (values.length === 0) return undefined;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { min, max, range: max - min };
  });

  get clickable(): boolean {
    return this.rowSelected.observed;
  }

  setMetric(metric: SubgroupsMetric): void {
    this.activeMetric.set(metric);
  }

  setComparison(id: string | undefined): void {
    this.activeComparison.set(id);
  }

  sort(column: SubgroupsSortColumn): void {
    this.sortCriteria.set(toggleSort(this.sortCriteria(), column));
  }

  sortDirection(column: SubgroupsSortColumn): SortDirection | undefined {
    return this.sortCriteria().find((criterion) => criterion.key === column)?.direction;
  }

  ariaSort(column: SubgroupsSortColumn): 'ascending' | 'descending' | 'none' {
    return ariaSortOf(this.sortDirection(column));
  }

  sortPriority(column: SubgroupsSortColumn): number | undefined {
    return sortPriority(this.sortCriteria(), column);
  }

  private compositionOf(
    groups: readonly AggregationsValueGroup[],
  ): Map<string, AggregationEntry[]> {
    const byType = new Map<string, AggregationEntry[]>();
    for (const group of groups) {
      const entries = compositionEntries(nonMinimumClassificationEntries(group));
      // Trägt eine zweite Value-Group dieselbe Art, zählt nur die erste.
      const ownTypes = new Set<string>();
      for (const entry of entries) {
        if (byType.has(entry.type) && !ownTypes.has(entry.type)) continue;
        ownTypes.add(entry.type);
        const list = byType.get(entry.type);
        if (list) {
          list.push(entry);
        } else {
          byType.set(entry.type, [entry]);
        }
      }
    }
    return byType;
  }

  private buildBaseRow(
    data: RowData,
    columns: readonly SubgroupsCharacteristicColumn[],
    slots: ReadonlyMap<string, ReadonlyMap<string, ValueSlot>>,
  ): BaseRow {
    const { group, byType, distribution, students } = data;
    const units: Record<string, number> = {};
    for (const unit of UNIT_AGGREGATIONS) {
      const count = registeredUnitCount(byType.get(unit.type) ?? [], unit.type);
      if (count !== undefined) units[unit.type] = count;
    }
    const share = participationShare(byType.get(PARTICIPATION_AGGREGATION) ?? []);
    const characteristics: Record<string, SubgroupsCharacteristicCell> = {};
    for (const column of columns) {
      const cell = this.characteristicCell(byType.get(column.type) ?? [], slots.get(column.type));
      if (cell) characteristics[column.type] = cell;
    }
    return {
      id: group.key,
      name: group.name,
      role: group.role,
      units,
      students,
      participated: share?.participated,
      participationRate: share?.share,
      participationText: share ? `${percent(share.share)} %` : '–',
      characteristics,
      distribution,
    };
  }

  private characteristicCell(
    entries: readonly AggregationEntry[],
    slots: ReadonlyMap<string, ValueSlot> | undefined,
  ): SubgroupsCharacteristicCell | undefined {
    if (!slots || entries.length === 0) return undefined;
    const sum = entries.reduce((total, entry) => total + entry.descriptiveStatistics.frequency, 0);
    if (sum === 0) return undefined;
    const segments = entries.flatMap<SubgroupsSegment>((entry) => {
      const slot = slots.get(entry.value);
      if (!slot) return [];
      const share = entry.descriptiveStatistics.frequency / sum;
      return [
        {
          value: entry.value,
          label: slot.label,
          percent: percent(share),
          width: share * 100,
          color: `var(${categoryVariable(slot.index)})`,
        },
      ];
    });
    return {
      segments,
      text: segments.map((segment) => `${segment.label} ${segment.percent} %`).join(', '),
    };
  }

  private metricCell(
    row: Omit<BaseRow, 'distribution'>,
    distribution: ClassificationDistribution,
  ): SubgroupsMetricCell {
    const barColor = row.role === 'comparison' ? 'var(--tba3-bar-comparison)' : 'var(--tba3-bar)';
    const definition = this.metricDefinition();
    if (!definition) {
      const bands = classificationBands(distribution).map<SubgroupsSegment>((band) => ({
        value: band.key,
        label: band.label,
        percent: percent(band.share),
        width: band.share * 100,
        color: `var(${band.variable})`,
      }));
      return {
        value: undefined,
        barColor,
        scale: undefined,
        bands,
        bandsText: bands.map((band) => `${band.label} ${band.percent} %`).join(', '),
        delta: undefined,
      };
    }
    const value = percent(definition.select(distribution));
    const thresholds = this.activeThresholds();
    const comparison = this.selectedComparison();
    const comparisonValue = this.comparisonValue();
    const level = thresholds && !comparison ? scaleLevel(value, thresholds) : undefined;
    return {
      value,
      barColor,
      scale:
        level && thresholds
          ? { level, ariaLabel: `${value} %, ${scaleRangeLabel(level, thresholds)}` }
          : undefined,
      bands: undefined,
      bandsText: '',
      delta:
        comparison && comparison.id !== row.id && comparisonValue !== undefined
          ? labeledDeviation(
              value,
              comparisonValue,
              definition.higherIsBetter,
              row.name,
              comparison.name,
            )
          : undefined,
    };
  }

  private sortValue(row: SubgroupsRowView, key: SubgroupsSortColumn): SortValue {
    switch (key) {
      case 'name':
        return row.name;
      case 'students':
        return row.students;
      case 'participated':
        return row.participated;
      case 'participation':
        return row.participationRate;
      case 'metric':
        // In der Verteilung sortiert die Spalte nach dem ersten Band (unter Mindeststandard).
        return row.metric?.bands ? row.metric.bands[0]?.percent : row.metric?.value;
      case 'delta':
        return row.metric?.delta?.diff;
      default:
        return row.units[key.slice(UNIT_SORT_PREFIX.length)];
    }
  }
}
