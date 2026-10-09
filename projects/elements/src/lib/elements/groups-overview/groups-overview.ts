import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { Tba3ControlPanelComponent } from '../../components/control-panel/control-panel';
import { Tba3ViewSlot } from '../../components/control-panel/control-panel-slots';
import {
  type DonutSegment,
  Tba3DonutChartComponent,
} from '../../components/donut-chart/donut-chart';
import {
  type MiniBar,
  Tba3MiniBarChartComponent,
} from '../../components/mini-bar-chart/mini-bar-chart';
import type {
  AggregationEntry,
  AggregationsValueGroup,
  CompetenceLevelsValueGroup,
  ValueLabels,
} from '../../model';
import {
  characteristicSegments,
  CLASSIFICATIONS,
  classificationAxisLabel,
  classificationColor,
  classificationDistribution,
  classificationVariable,
  compositionEntries,
  contrastColor,
  GENDER_AGGREGATION,
  groupByIdAndDomain,
  groupBySubject,
  groupKey,
  participationDonutParts,
  participationShare,
  PARTICIPATION_AGGREGATION,
  resolveLabel,
  splitByRole,
} from '../../model';

interface DonutCard {
  title: string;
  centerLabel?: string;
  segments: DonutSegment[];
}

interface DomainChart {
  title: string;
  bars: MiniBar[];
}

// Feste Domänenspalten halten die Donuts in allen Zeilen an derselben Stelle.
const DOMAIN_SLOTS = 2;

interface Row {
  label: string;
  emitId?: string;
  genderDonut?: DonutCard;
  participationDonut?: DonutCard;
  charts: DomainChart[];
  domainSlots: (DomainChart | null)[];
}

type RawRow = Omit<Row, 'domainSlots'>;

interface Section {
  heading: string;
  emitId?: string;
  hasGender: boolean;
  hasParticipation: boolean;
  rows: Row[];
}

interface Cell {
  groupId: string;
  groupName: string;
  subject: string;
  genderDonut?: DonutCard;
  participationDonut?: DonutCard;
  charts: DomainChart[];
}

/**
 * Zeigt die Lerngruppen einer Schule mit ihrer Kompetenzstufenverteilung je Fach und Domäne,
 * gegliedert nach Lerngruppe oder nach Fach, optional mit Donuts zu Geschlecht und Teilnahme.
 */
@Component({
  selector: 'tba3-groups-overview',
  standalone: true,
  imports: [
    Tba3ControlPanelComponent,
    Tba3ViewSlot,
    Tba3DonutChartComponent,
    Tba3MiniBarChartComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './groups-overview.html',
  styleUrl: './groups-overview.scss',
})
export class GroupsOverviewComponent {
  /** Value-Groups eines `competence-levels`-Endpunkts, die erste ist die Schule. */
  readonly competenceLevels = input<CompetenceLevelsValueGroup[]>([]);

  /** Value-Groups eines `aggregations`-Endpunkts je Lerngruppe und Fach für die Donuts. */
  readonly aggregations = input<AggregationsValueGroup[]>([]);

  /** Anfängliche Gliederung nach Lerngruppe oder nach Fach. */
  readonly groupBy = input<'group' | 'subject'>('group');

  /** Anzeigetexte für Merkmalsausprägungen und die Bildunterschriften der Donuts. */
  readonly valueLabels = input<ValueLabels | undefined>(undefined);

  /** Gewählte Lerngruppe als `typ:id`. */
  readonly groupSelected = output<string>();

  private readonly cells = computed<Cell[]>(() => {
    const { parts } = splitByRole(this.competenceLevels());
    const labels = this.valueLabels();
    const cells: Cell[] = [];
    for (const part of parts) {
      const groupId = part.key;
      const groupName = part.name;
      for (const subjectGroup of groupBySubject(part.groups)) {
        const subject = subjectGroup.subject ?? '';
        const aggregations = this.aggregationsForCell(part.key, subject);
        const domainBuckets = groupByIdAndDomain(subjectGroup.groups);
        cells.push({
          groupId,
          groupName,
          subject,
          genderDonut: this.genderDonut(aggregations, labels),
          participationDonut: this.participationDonut(aggregations),
          charts: domainBuckets.map((bucket) => this.domainChart(bucket.groups)),
        });
      }
    }
    return cells;
  });

  readonly activeGroupBy = linkedSignal(() => this.groupBy());

  setGroupBy(value: 'group' | 'subject'): void {
    this.activeGroupBy.set(value);
  }

  readonly genderLabel = computed(() =>
    resolveLabel(this.valueLabels(), 'aggregation', GENDER_AGGREGATION),
  );

  readonly participationLabel = computed(() =>
    resolveLabel(this.valueLabels(), 'aggregation', PARTICIPATION_AGGREGATION),
  );

  readonly sections = computed<Section[]>(() => {
    const cells = this.cells();
    return this.activeGroupBy() === 'subject'
      ? this.sectionsBySubject(cells)
      : this.sectionsByGroup(cells);
  });

  private sectionsByGroup(cells: Cell[]): Section[] {
    const groups = new Map<string, { heading: string; emitId?: string; rows: RawRow[] }>();
    for (const cell of cells) {
      let group = groups.get(cell.groupId);
      if (!group) {
        group = { heading: cell.groupName, emitId: cell.groupId, rows: [] };
        groups.set(cell.groupId, group);
      }
      // Teilnahme gilt je Fach, darum stehen die Donuts in jeder Fachzeile.
      group.rows.push({
        label: cell.subject,
        genderDonut: cell.genderDonut,
        participationDonut: cell.participationDonut,
        charts: cell.charts,
      });
    }
    return [...groups.values()].map((group) => this.finalizeSection(group));
  }

  private sectionsBySubject(cells: Cell[]): Section[] {
    const groups = new Map<string, { heading: string; rows: RawRow[] }>();
    for (const cell of cells) {
      let group = groups.get(cell.subject);
      if (!group) {
        group = { heading: cell.subject, rows: [] };
        groups.set(cell.subject, group);
      }
      group.rows.push({
        label: cell.groupName,
        emitId: cell.groupId,
        genderDonut: cell.genderDonut,
        participationDonut: cell.participationDonut,
        charts: cell.charts,
      });
    }
    return [...groups.values()].map((group) => this.finalizeSection(group));
  }

  private finalizeSection(group: { heading: string; emitId?: string; rows: RawRow[] }): Section {
    const rows: Row[] = group.rows.map((row) => ({
      ...row,
      domainSlots: Array.from({ length: DOMAIN_SLOTS }, (_, index) => row.charts[index] ?? null),
    }));
    return {
      heading: group.heading,
      emitId: group.emitId,
      hasGender: rows.some((row) => row.genderDonut),
      hasParticipation: rows.some((row) => row.participationDonut),
      rows,
    };
  }

  private domainChart(groups: CompetenceLevelsValueGroup[]): DomainChart {
    const title = groups[0]?.domain?.name ?? groups[0]?.subject?.name ?? groups[0]?.name ?? '';
    if (groups.length > 1) {
      const counts = classificationDistribution(groups)[0].counts;
      return {
        title,
        // Volle Classification-Namen überlappen auf der schmalen Achse, darum umbrochen.
        bars: CLASSIFICATIONS.map((classification) => ({
          label: classification,
          axisLabel: classificationAxisLabel(classification),
          value: counts[classification],
          color: classificationColor(classification),
          labelColor: contrastColor(classificationVariable(classification)),
        })),
      };
    }
    return {
      title,
      bars: (groups[0]?.competenceLevels ?? []).map((level) => ({
        label: level.nameShort,
        value: level.descriptiveStatistics.frequency,
        color: classificationColor(level.classification),
        labelColor: contrastColor(classificationVariable(level.classification)),
      })),
    };
  }

  private aggregationsForCell(key: string, subject: string): AggregationEntry[] {
    const forGroup = this.aggregations().filter((group) => groupKey(group) === key);
    const bySubject = groupBySubject(forGroup);
    // Ohne fachbezogene Value-Group gilt die der Lerngruppe ohne `subject`.
    const match =
      bySubject.find((bucket) => bucket.subject === subject) ??
      bySubject.find((bucket) => bucket.subject === undefined);
    return compositionEntries((match?.groups ?? []).flatMap((group) => group.aggregations));
  }

  private genderDonut(
    aggregations: readonly AggregationEntry[],
    labels: ValueLabels | undefined,
  ): DonutCard | undefined {
    const segments = characteristicSegments(aggregations, GENDER_AGGREGATION, labels);
    if (segments.length === 0) return undefined;
    return { title: resolveLabel(labels, 'aggregation', GENDER_AGGREGATION), segments };
  }

  private participationDonut(aggregations: readonly AggregationEntry[]): DonutCard | undefined {
    const share = participationShare(aggregations);
    if (!share) return undefined;
    return { title: 'Teilnahmequote', ...participationDonutParts(share) };
  }
}
