import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Tba3AggregationValueComponent } from '../../components/aggregation-value/aggregation-value';
import {
  type DonutSegment,
  Tba3DonutChartComponent,
} from '../../components/donut-chart/donut-chart';
import type { AggregationEntry, AggregationsValueGroup, ValueLabels } from '../../model';
import {
  characteristicSegments,
  characteristicTotal,
  characteristicTypes,
  compositionEntries,
  groupBySubject,
  hasClassifications,
  minimumClassificationDistribution,
  nonMinimumClassificationEntries,
  participationDonutParts,
  PARTICIPATION_AGGREGATION,
  participationShare,
  percent,
  registeredUnitCount,
  resolveLabel,
  SES_AGGREGATION,
  splitByRole,
  UNIT_AGGREGATIONS,
  unitLabel,
} from '../../model';

interface RegistrationRow {
  icon: string;
  count: number;
  label: string;
}

interface DonutCell {
  title: string;
  centerLabel?: string;
  segments: DonutSegment[];
  median?: { code: string; name: string };
}

interface SubjectMinimum {
  name: string;
  percent: number;
}

/**
 * Zeigt die Zusammensetzung einer Gruppe als Kartenreihe: Anmeldungen, Teilnahmequote, je Merkmal
 * einen Donut und den Anteil „Mindeststandard erreicht“ je Fach.
 */
@Component({
  selector: 'tba3-composition-summary',
  standalone: true,
  imports: [Tba3DonutChartComponent, Tba3AggregationValueComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './composition-summary.html',
  styleUrl: './composition-summary.scss',
})
export class CompositionSummaryComponent {
  /** Value-Groups eines `aggregations`-Endpunkts, die erste ist die Hauptgruppe. */
  readonly aggregations = input<AggregationsValueGroup[]>([]);

  /** Anzeigetexte für Kartentitel, Ausprägungen und gezählte Einheiten. */
  readonly valueLabels = input<ValueLabels | undefined>(undefined);

  /** Fach, auf das Fachbalken und Zusammensetzung eingegrenzt werden. */
  readonly subject = input<string | undefined>(undefined);

  // Leere Value-Groups dürfen nicht Hauptgruppe werden.
  private readonly roles = computed(() => {
    const relevant = this.aggregations().filter((group) => (group.aggregations?.length ?? 0) > 0);
    return splitByRole(relevant);
  });

  // Genau ein Fach-Bucket, damit Fächer nicht aufaddiert werden.
  private readonly aggregationsByType = computed<Map<string, AggregationEntry[]>>(() => {
    const { focus } = this.roles();
    const byType = new Map<string, AggregationEntry[]>();
    if (!focus) return byType;
    const buckets = groupBySubject(focus.groups);
    const wanted = this.subject();
    const bucket =
      wanted !== undefined
        ? buckets.find((entry) => entry.subject === wanted)
        : (buckets.find((entry) => entry.subject === undefined) ?? buckets[0]);
    if (!bucket) return byType;
    for (const group of bucket.groups) {
      const entries = compositionEntries(nonMinimumClassificationEntries(group));
      for (const aggregation of entries) {
        const list = byType.get(aggregation.type);
        if (list) {
          list.push(aggregation);
        } else {
          byType.set(aggregation.type, [aggregation]);
        }
      }
    }
    return byType;
  });

  readonly registrations = computed<RegistrationRow[]>(() => {
    const byType = this.aggregationsByType();
    const labels = this.valueLabels();
    const rows: RegistrationRow[] = [];
    for (const unit of UNIT_AGGREGATIONS) {
      const total = registeredUnitCount(byType.get(unit.type) ?? [], unit.type);
      if (total !== undefined)
        rows.push({
          icon: unit.icon,
          count: total,
          label: unitLabel(labels, unit.unit, unit.fallback),
        });
    }
    const students = this.registeredStudents(byType);
    if (students !== undefined)
      rows.push({
        icon: 'fa-user-graduate',
        count: students,
        label: unitLabel(labels, 'students', 'Schüler:innen'),
      });
    return rows;
  });

  readonly participationDonut = computed<DonutCell | undefined>(() => {
    const share = participationShare(
      this.aggregationsByType().get(PARTICIPATION_AGGREGATION) ?? [],
    );
    if (!share) return undefined;
    const parts = participationDonutParts(share);
    return { title: 'Teilnahmequote', ...parts };
  });

  readonly characteristicDonuts = computed<DonutCell[]>(() => {
    const byType = this.aggregationsByType();
    const orderedTypes = characteristicTypes([...byType.keys()]);

    const labels = this.valueLabels();
    const donuts: DonutCell[] = [];
    for (const type of orderedTypes) {
      const entries = byType.get(type) ?? [];
      const segments = characteristicSegments(entries, type, labels);
      if (segments.length === 0) continue;
      const median = type === SES_AGGREGATION ? this.sesMedian(entries, labels) : undefined;
      donuts.push({
        title: resolveLabel(labels, 'aggregation', type),
        segments,
        // Leerer String, sonst zeigt der Donut die Summe im Zentrum.
        centerLabel: median?.code ?? '',
        median,
      });
    }
    return donuts;
  });

  readonly donuts = computed<DonutCell[]>(() => {
    const participation = this.participationDonut();
    const characteristics = this.characteristicDonuts();
    return participation ? [participation, ...characteristics] : characteristics;
  });

  readonly subjectMinimums = computed<SubjectMinimum[]>(() => {
    const { focus } = this.roles();
    if (!focus) return [];
    const wanted = this.subject();
    return minimumClassificationDistribution(focus.groups)
      .filter(
        (distribution) =>
          hasClassifications(distribution) &&
          (wanted === undefined || distribution.subject === wanted),
      )
      .map((distribution) => ({
        name: distribution.subject ?? '',
        percent: percent(distribution.minimumReached),
      }));
  });

  readonly hasContent = computed<boolean>(
    () =>
      this.registrations().length > 0 ||
      this.characteristicDonuts().length > 0 ||
      this.subjectMinimums().length > 0,
  );

  private registeredStudents(byType: Map<string, AggregationEntry[]>): number | undefined {
    const share = participationShare(byType.get(PARTICIPATION_AGGREGATION) ?? []);
    return share ? share.registered : characteristicTotal(byType);
  }

  private sesMedian(
    entries: readonly AggregationEntry[],
    labels: ValueLabels | undefined,
  ): { code: string; name: string } | undefined {
    const ranked = entries.filter((entry) => entry.value.toLowerCase() !== 'unknown');
    const sorted = [...ranked].sort((a, b) => a.value.localeCompare(b.value));
    const total = sorted.reduce((sum, entry) => sum + entry.descriptiveStatistics.frequency, 0);
    if (total === 0) return undefined;
    const position = Math.ceil(total / 2) - 1;
    let cumulative = 0;
    for (const entry of sorted) {
      cumulative += entry.descriptiveStatistics.frequency;
      if (cumulative > position) {
        return {
          code: entry.value,
          name: resolveLabel(labels, 'ses', entry.value, { description: entry.description }),
        };
      }
    }
    return undefined;
  }
}
