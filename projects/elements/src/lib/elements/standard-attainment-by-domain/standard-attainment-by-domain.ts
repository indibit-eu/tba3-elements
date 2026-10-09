import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  type DonutSegment,
  Tba3DonutChartComponent,
} from '../../components/donut-chart/donut-chart';
import type {
  AggregationsValueGroup,
  ClassificationDistribution,
  CompetenceLevelsValueGroup,
} from '../../model';
import {
  classificationBands,
  classificationDistribution,
  compareBlocks,
  groupByIdAndDomain,
  groupBySubject,
  groupKey,
  hasClassifications,
  minimumClassificationDistribution,
  percent,
  splitByRole,
  subjectNames,
  themeColor,
} from '../../model';

interface Donut {
  label: string;
  title: string;
  centerLabel: string;
  total: number;
  segments: DonutSegment[];
}

interface Subject {
  name: string;
  showHeading: boolean;
  donuts: Donut[];
}

/**
 * Zeigt je Fach und Domäne den Anteil, der den Mindeststandard erreicht, als Donut mit drei
 * Segmenten, auf Wunsch mit einer Karte „Fach gesamt" vorneweg.
 */
@Component({
  selector: 'tba3-standard-attainment-by-domain',
  standalone: true,
  imports: [Tba3DonutChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './standard-attainment-by-domain.html',
  styleUrl: './standard-attainment-by-domain.scss',
})
export class StandardAttainmentByDomainComponent {
  /** Value-Groups eines `competence-levels`-Endpunkts, die erste ist die Hauptgruppe. */
  readonly competenceLevels = input<CompetenceLevelsValueGroup[]>([]);

  /** `minimumClassification`-Aggregationen für die Karte „Fach gesamt" je Fach. */
  readonly aggregations = input<AggregationsValueGroup[]>([]);

  readonly subjects = computed<Subject[]>(() => {
    const levels = this.competenceLevels();
    if (levels.length === 0) return [];

    const { focus } = splitByRole(levels);
    if (!focus) return [];

    const showHeading = subjectNames(focus.groups).length > 1;
    const subjectTotals = this.subjectTotals(focus.groups[0]);

    return groupBySubject(focus.groups)
      .sort((a, b) => compareBlocks(a.groups[0], b.groups[0]))
      .map(({ subject, groups }) => ({
        name: subject ?? '',
        showHeading: showHeading && !!subject,
        donuts: this.donutsOf(groups, subjectTotals.get(subject)),
      }))
      .filter((subject) => subject.donuts.length > 0);
  });

  private subjectTotals(
    focusGroup: CompetenceLevelsValueGroup,
  ): Map<string | undefined, ClassificationDistribution> {
    // Über `typ:id`, damit etwa Land 7 und Schulamt 7 getrennt bleiben.
    const focusKey = groupKey(focusGroup);
    const focusAggregations = this.aggregations().filter((group) => groupKey(group) === focusKey);
    const bySubject = new Map<string | undefined, ClassificationDistribution>();
    for (const distribution of minimumClassificationDistribution(focusAggregations)) {
      bySubject.set(distribution.subject, distribution);
    }
    return bySubject;
  }

  private donutsOf(
    subjectGroups: CompetenceLevelsValueGroup[],
    total: ClassificationDistribution | undefined,
  ): Donut[] {
    const donuts: Donut[] = [];

    if (total && hasClassifications(total)) {
      donuts.push(this.buildDonut('Fach gesamt', total));
    }

    // Je Domäne rechnen, nie über alle Domänen eines Fachs: das zählte Personen doppelt.
    const domainDonuts = groupByIdAndDomain(
      subjectGroups.filter((group) => group.domain !== undefined),
    )
      .map((bucket) => ({ bucket, distribution: classificationDistribution(bucket.groups)[0] }))
      .filter(({ distribution }) => hasClassifications(distribution))
      .sort((a, b) => compareBlocks(a.bucket.groups[0], b.bucket.groups[0]))
      .map(({ bucket, distribution }) =>
        this.buildDonut(bucket.groups[0].domain?.name ?? '', distribution),
      );

    donuts.push(...domainDonuts);
    return donuts;
  }

  private buildDonut(label: string, distribution: ClassificationDistribution): Donut {
    const percentReached = percent(distribution.minimumReached);
    const segments: DonutSegment[] = classificationBands(distribution).map((band) => ({
      label: band.label,
      value: band.count,
      color: themeColor(band.variable),
      ...(band.marker && { marker: band.marker }),
    }));
    return {
      label,
      title: `${label}: Mindeststandard erreicht ${percentReached} %`,
      centerLabel: `${percentReached} %`,
      total: distribution.total,
      segments,
    };
  }
}
