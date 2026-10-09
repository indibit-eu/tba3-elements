import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  Output,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { Tba3ControlPanelComponent } from '../../components/control-panel/control-panel';
import {
  Tba3ComparisonsSlot,
  Tba3FilterSlot,
  Tba3ViewSlot,
} from '../../components/control-panel/control-panel-slots';
import { Tba3LegendComponent, type Tba3LegendItem } from '../../components/legend/legend';
import {
  Tba3PillFilterComponent,
  type PillFilterOption,
} from '../../components/pill-filter/pill-filter';
import type {
  AggregationsValueGroup,
  GroupedValueGroups,
  ScaleLevel,
  ScaleThresholds,
  ValueLabels,
} from '../../model';
import {
  aggregationTypeOf,
  aggregationValue,
  deviation,
  entriesOfType,
  percent,
  scaleLevel,
  sortThresholds,
  splitByRole,
} from '../../model';

/** Welche Zellen neben der Farbe eine Zahl zeigen: keine, Vergleich und Klassenmittel, alle. */
export type HeatmapCellValues = 'none' | 'reference' | 'all';

/** Stufe einer Zelle auf der vierstufigen Skala. */
export type HeatmapLevel = ScaleLevel;

/** Eine Spalte (Teilkompetenz) mit ihrer Klassenmittel-Zelle. */
export interface HeatmapColumn {
  value: string;
  code: string | undefined;
  name: string;
  link: string | undefined;
  classMeanPercent: number;
  referencePercent: number | undefined;
  meanValue: number | undefined;
  level: HeatmapLevel | undefined;
  meanText: string;
  meanValueText: string | undefined;
}

/** Eine Zelle einer Personenzeile. */
export interface HeatmapCell {
  key: string;
  value: number | undefined;
  level: HeatmapLevel | undefined;
  text: string;
  valueText: string | undefined;
}

/** Eine Personenzeile. */
export interface HeatmapRow {
  key: string;
  name: string;
  mean: number | undefined;
  cells: HeatmapCell[];
}

/** Eine Zelle der Vergleichszeile. */
export interface HeatmapReferenceCell {
  key: string;
  value: number | undefined;
  text: string;
}

/** Die Vergleichszeile mit den absoluten Werten der gewählten Vergleichsgruppe. */
export interface HeatmapReferenceRow {
  name: string;
  cells: HeatmapReferenceCell[];
}

/** Eine Option des Umschalters „Vergleich“. */
export interface HeatmapComparisonOption {
  key: string;
  name: string;
}

function levelColor(level: HeatmapLevel): string {
  return `var(--tba3-heat-${level})`;
}

function absoluteRangeText(level: HeatmapLevel, [t1, t2, t3]: ScaleThresholds): string {
  switch (level) {
    case 'low':
      return `unter ${t1} %`;
    case 'mid-low':
      return `${t1} bis ${t2} %`;
    case 'mid':
      return `${t2} bis ${t3} %`;
    case 'high':
      return `ab ${t3} %`;
  }
}

function deltaText(diff: number): string {
  if (diff === 0) return 'gleich der Vergleichsgruppe';
  const magnitude = Math.abs(diff);
  const direction = diff > 0 ? 'über' : 'unter';
  return `${magnitude} Prozentpunkte ${direction} der Vergleichsgruppe`;
}

let instances = 0;

/**
 * Zeigt die Lösungsquoten aller Personen einer Gruppe je Teilkompetenz als Heatmap, standardmäßig
 * als Differenz zu einer wählbaren Vergleichsgruppe.
 */
@Component({
  selector: 'tba3-solution-rates-heatmap',
  standalone: true,
  imports: [
    Tba3ControlPanelComponent,
    Tba3ComparisonsSlot,
    Tba3FilterSlot,
    Tba3ViewSlot,
    Tba3LegendComponent,
    Tba3PillFilterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './solution-rates-heatmap.html',
  styleUrl: './solution-rates-heatmap.scss',
})
export class SolutionRatesHeatmapComponent {
  /** Value-Groups eines `aggregations`-Endpunkts, die erste ist die Hauptgruppe. */
  readonly aggregations = input<AggregationsValueGroup[]>([]);

  /** Drei aufsteigende Prozentgrenzen der absoluten Ansicht. */
  readonly absoluteThresholds = input<ScaleThresholds>([40, 55, 70]);

  /** Drei aufsteigende Grenzen in Prozentpunkten für die Differenz zur Vergleichsgruppe. */
  readonly relativeThresholds = input<ScaleThresholds>([-10, -5, 5]);

  /** Welche Zellen anfangs neben der Farbe eine Zahl zeigen. */
  readonly cellValues = input<HeatmapCellValues>('reference');

  /** Anzeigetexte für Spalten ohne `description`. */
  readonly valueLabels = input<ValueLabels | undefined>(undefined);

  /** Verweis je Teilkompetenz für den Spaltenkopf, Schlüssel `typ.wert`. */
  readonly links = input<Readonly<Record<string, string>> | undefined>(undefined);

  // EventEmitter statt output(), weil nur `.observed` zeigt, ob der Host zuhört.
  /** Meldet den geklickten Spaltenkopf als `value` der Teilkompetenz; klickbar nur mit Listener. */
  @Output() readonly columnSelected = new EventEmitter<string>();

  /** Meldet die ausgewählten Personen als `typ:id`; die Checkboxen erscheinen nur mit Listener. */
  @Output() readonly studentsSelected = new EventEmitter<string[]>();

  protected readonly idPrefix = `tba3-heatmap-${instances++}`;

  private readonly roles = computed(() => splitByRole(this.aggregations()));

  private readonly aggregationType = computed(() => aggregationTypeOf(this.roles().focus));

  private readonly students = computed(() => this.roles().parts);

  private readonly sortedAbsoluteThresholds = computed<ScaleThresholds>(() =>
    sortThresholds(this.absoluteThresholds()),
  );

  private readonly sortedRelativeThresholds = computed<ScaleThresholds>(() =>
    sortThresholds(this.relativeThresholds()),
  );

  private readonly comparisonGroups = computed<GroupedValueGroups<AggregationsValueGroup>[]>(
    () => this.roles().comparisons,
  );

  readonly comparisonOptions = computed<HeatmapComparisonOption[]>(() =>
    this.comparisonGroups().map((group) => ({ key: group.key, name: group.name })),
  );

  readonly hasComparisonSwitch = computed(() => this.comparisonGroups().length > 0);

  private readonly selectedComparisonKey = linkedSignal<string | undefined>(
    () => this.comparisonGroups()[0]?.key,
  );

  private readonly activeComparisonGroup = computed(() =>
    this.comparisonGroups().find((group) => group.key === this.selectedComparisonKey()),
  );

  readonly isAbsolute = computed(() => this.activeComparisonGroup() === undefined);

  readonly activeCellValues = linkedSignal<HeatmapCellValues>(() => this.cellValues());

  readonly showReferenceValues = computed(() => this.activeCellValues() !== 'none');

  readonly showAllValues = computed(() => this.activeCellValues() === 'all');

  private readonly selectedLevels = signal<HeatmapLevel[]>([]);

  readonly selectedLevelValues = computed<string[]>(() => this.selectedLevels());

  private readonly selectedStudents = linkedSignal<string[]>(() => {
    this.aggregations();
    return [];
  });

  private readonly allColumns = computed<HeatmapColumn[]>(() => {
    const focus = this.roles().focus;
    const aggregationType = this.aggregationType();
    if (!focus || !aggregationType) return [];

    const labels = this.valueLabels();
    const links = this.links();
    const absoluteThresholds = this.sortedAbsoluteThresholds();
    const relativeThresholds = this.sortedRelativeThresholds();
    const group = this.activeComparisonGroup();
    const groupEntries = group ? entriesOfType(group.groups, aggregationType) : [];

    const seen = new Set<string>();
    const columns: HeatmapColumn[] = [];
    for (const entry of entriesOfType(focus.groups, aggregationType)) {
      if (seen.has(entry.value)) continue;
      seen.add(entry.value);
      const resolved = aggregationValue(entry, labels);
      const classMeanPercent = percent(entry.descriptiveStatistics.mean);
      const referenceEntry = groupEntries.find((candidate) => candidate.value === entry.value);
      const referencePercent = referenceEntry
        ? percent(referenceEntry.descriptiveStatistics.mean)
        : undefined;

      let meanValue: number | undefined;
      let level: HeatmapLevel | undefined;
      let meanText: string;
      if (group) {
        meanValue =
          referencePercent !== undefined ? classMeanPercent - referencePercent : undefined;
        level = meanValue !== undefined ? scaleLevel(meanValue, relativeThresholds) : undefined;
        meanText =
          meanValue !== undefined
            ? `${resolved.name}: Klassenmittel ${classMeanPercent} %, ${deltaText(meanValue)}`
            : `${resolved.name}: Klassenmittel ${classMeanPercent} %, ohne Vergleichswert`;
      } else {
        meanValue = classMeanPercent;
        level = scaleLevel(classMeanPercent, absoluteThresholds);
        meanText = `${resolved.name}: Klassenmittel ${classMeanPercent} %, ${absoluteRangeText(level, absoluteThresholds)}`;
      }

      columns.push({
        value: entry.value,
        code: resolved.code,
        name: resolved.name,
        link: links?.[`${aggregationType}.${entry.value}`],
        classMeanPercent,
        referencePercent,
        meanValue,
        level,
        meanText,
        meanValueText:
          meanValue === undefined ? undefined : group ? pp(meanValue) : `${meanValue} %`,
      });
    }
    return columns.sort((a, b) => {
      if (a.meanValue === undefined && b.meanValue === undefined) return 0;
      if (a.meanValue === undefined) return 1;
      if (b.meanValue === undefined) return -1;
      return a.meanValue - b.meanValue;
    });
  });

  readonly filterOptions = computed<PillFilterOption[]>(() => {
    if (this.isAbsolute()) {
      const [t1, t2, t3] = this.sortedAbsoluteThresholds();
      return [
        { value: 'low', label: `< ${t1} %`, color: levelColor('low') },
        { value: 'mid-low', label: `${t1}–${t2} %`, color: levelColor('mid-low') },
        { value: 'mid', label: `${t2}–${t3} %`, color: levelColor('mid') },
        { value: 'high', label: `≥ ${t3} %`, color: levelColor('high') },
      ];
    }
    const [t1, t2, t3] = this.sortedRelativeThresholds();
    return [
      { value: 'low', label: `< ${pp(t1)}`, color: levelColor('low') },
      { value: 'mid-low', label: `${pp(t1)} bis ${pp(t2)}`, color: levelColor('mid-low') },
      { value: 'mid', label: `${pp(t2)} bis ${pp(t3)}`, color: levelColor('mid') },
      { value: 'high', label: `> ${pp(t3)}`, color: levelColor('high') },
    ];
  });

  readonly columns = computed<HeatmapColumn[]>(() => {
    const selected = this.selectedLevels();
    if (selected.length === 0) return this.allColumns();
    return this.allColumns().filter(
      (column) => column.level !== undefined && selected.includes(column.level),
    );
  });

  readonly rows = computed<HeatmapRow[]>(() => {
    const aggregationType = this.aggregationType();
    if (!aggregationType) return [];
    // Der Filter engt nur die Spalten ein, Personen bleiben auch ohne sichtbare Spalte.
    const columns = this.columns();
    const absoluteThresholds = this.sortedAbsoluteThresholds();
    const relativeThresholds = this.sortedRelativeThresholds();
    const isAbsolute = this.isAbsolute();

    const rows = this.students().map((student) => {
      const entries = entriesOfType(student.groups, aggregationType);
      const cells = columns.map((column): HeatmapCell => {
        const entry = entries.find((candidate) => candidate.value === column.value);
        if (!entry) {
          return {
            key: column.value,
            value: undefined,
            level: undefined,
            valueText: undefined,
            text: `${column.name}: ohne Wert`,
          };
        }
        const percentValue = percent(entry.descriptiveStatistics.mean);
        if (isAbsolute) {
          const level = scaleLevel(percentValue, absoluteThresholds);
          return {
            key: column.value,
            value: percentValue,
            level,
            valueText: `${percentValue} %`,
            text: `${column.name}: ${percentValue} %, ${absoluteRangeText(level, absoluteThresholds)}`,
          };
        }
        if (column.referencePercent === undefined) {
          return {
            key: column.value,
            value: undefined,
            level: undefined,
            valueText: undefined,
            text: `${column.name}: ${percentValue} %, ohne Vergleichswert`,
          };
        }
        const delta = percentValue - column.referencePercent;
        const level = scaleLevel(delta, relativeThresholds);
        return {
          key: column.value,
          value: delta,
          level,
          valueText: pp(delta),
          text: `${column.name}: ${percentValue} %, ${deltaText(delta)}`,
        };
      });
      const defined = cells
        .map((cell) => cell.value)
        .filter((value): value is number => value !== undefined);
      const mean =
        defined.length > 0
          ? Math.round(defined.reduce((sum, value) => sum + value, 0) / defined.length)
          : undefined;
      return { key: student.key, name: student.name, mean, cells };
    });

    return rows.sort((a, b) => {
      if (a.mean === undefined && b.mean === undefined) return 0;
      if (a.mean === undefined) return 1;
      if (b.mean === undefined) return -1;
      return a.mean - b.mean;
    });
  });

  readonly referenceRow = computed<HeatmapReferenceRow | undefined>(() => {
    const group = this.activeComparisonGroup();
    if (!group) return undefined;
    const cells = this.columns().map((column): HeatmapReferenceCell => ({
      key: column.value,
      value: column.referencePercent,
      text:
        column.referencePercent !== undefined
          ? `${group.name}, ${column.name}: ${column.referencePercent} %`
          : `${group.name}, ${column.name}: ohne Wert`,
    }));
    return { name: group.name, cells };
  });

  readonly hasData = computed(() => this.allColumns().length > 0 && this.students().length > 0);

  hasColumnSelection(): boolean {
    return this.columnSelected.observed;
  }

  hasStudentSelection(): boolean {
    return this.studentsSelected.observed;
  }

  columnAriaLabel(column: HeatmapColumn): string {
    const label = column.code ? `${column.code} ${column.name}` : column.name;
    return `Details zu ${label} öffnen`;
  }

  toggleLevel(level: HeatmapLevel): void {
    const current = this.selectedLevels();
    this.selectedLevels.set(
      current.includes(level) ? current.filter((entry) => entry !== level) : [...current, level],
    );
  }

  onFilterChange(values: string[]): void {
    this.selectedLevels.set(values as HeatmapLevel[]);
  }

  isStudentSelected(key: string): boolean {
    return this.selectedStudents().includes(key);
  }

  toggleStudent(key: string): void {
    const current = this.selectedStudents();
    const next = current.includes(key)
      ? current.filter((entry) => entry !== key)
      : [...current, key];
    this.selectedStudents.set(next);
    this.studentsSelected.emit(next);
  }

  setCellValues(value: HeatmapCellValues): void {
    this.activeCellValues.set(value);
  }

  setComparison(key: string | undefined): void {
    this.selectedComparisonKey.set(key);
  }

  isComparisonSelected(key: string | undefined): boolean {
    return this.selectedComparisonKey() === key;
  }

  background(level: HeatmapLevel | undefined): string | null {
    return level ? levelColor(level) : null;
  }

  readonly legend = computed<Tba3LegendItem[]>(() => {
    if (this.isAbsolute()) {
      const [t1, t2, t3] = this.sortedAbsoluteThresholds();
      return [
        { color: levelColor('low'), text: `< ${t1} %` },
        { color: levelColor('mid-low'), text: `${t1}–${t2} %` },
        { color: levelColor('mid'), text: `${t2}–${t3} %` },
        { color: levelColor('high'), text: `≥ ${t3} %` },
      ];
    }
    const [t1, t2, t3] = this.sortedRelativeThresholds();
    return [
      { color: levelColor('low'), text: `< ${pp(t1)}` },
      { color: levelColor('mid-low'), text: `${pp(t1)} bis ${pp(t2)}` },
      { color: levelColor('mid'), text: `${pp(t2)} bis ${pp(t3)}` },
      { color: levelColor('high'), text: `> ${pp(t3)}` },
    ];
  });
}

function pp(value: number): string {
  return deviation(value, 0, true).label;
}
