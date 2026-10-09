import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Tba3CardGridComponent } from '../../components/card-grid/card-grid';
import {
  Tba3StatCardComponent,
  type StatCardComparison,
} from '../../components/stat-card/stat-card';
import type { AggregationsValueGroup, ClassificationDistribution } from '../../model';
import {
  blockLabelParts,
  hasClassifications,
  hasMinimumClassification,
  minimumClassificationDistribution,
  percent,
  splitByRole,
  STANDARD_METRICS,
} from '../../model';

interface Card {
  title: string;
  subtitle: string;
  value: number | undefined;
  comparisons: StatCardComparison[];
  higherIsBetter: boolean;
}

interface SubjectBlock {
  key: string;
  labelParts: string[];
  cards: Card[];
}

/**
 * Zeigt je Fach drei Kennzahlkarten zur Standarderreichung (Mindeststandard erreicht, unter
 * Mindeststandard, oberer Leistungsbereich) mit der Differenz zu den Vergleichsgruppen.
 */
@Component({
  selector: 'tba3-standard-attainment-summary',
  standalone: true,
  imports: [Tba3CardGridComponent, Tba3StatCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './standard-attainment-summary.html',
})
export class StandardAttainmentSummaryComponent {
  /** Value-Groups eines `aggregations`-Endpunkts, die erste ist die Hauptgruppe. */
  readonly aggregations = input<AggregationsValueGroup[]>([]);

  /** Abweichung in Prozentpunkten, ab der eine Differenz farbig wertet. */
  readonly deviationThreshold = input(5);

  readonly blocks = computed<SubjectBlock[]>(() => {
    const groups = this.aggregations();
    if (groups.length === 0) return [];

    // Eine vorangestellte Value-Group anderer Aggregationsart darf nicht zur Hauptgruppe werden.
    const relevant = groups.filter(hasMinimumClassification);
    const { focus, comparisons } = splitByRole(relevant);
    if (!focus) return [];

    const focusDistributions = minimumClassificationDistribution(focus.groups);

    const comparisonsBySubject = comparisons.map((comparison) => {
      const bySubject = new Map<string | undefined, ClassificationDistribution>();
      for (const distribution of minimumClassificationDistribution(comparison.groups)) {
        bySubject.set(distribution.subject, distribution);
      }
      return bySubject;
    });

    return focusDistributions.map<SubjectBlock>((focusDistribution) => {
      const subject = focusDistribution.subject;
      const hasValues = hasClassifications(focusDistribution);

      // Ein Vergleich ohne Classifications im Fach fehlt, statt als 0-%-Zeile zu erscheinen.
      const comparisonDistributions = hasValues
        ? comparisonsBySubject
            .map((bySubject) => bySubject.get(subject))
            .filter(
              (distribution): distribution is ClassificationDistribution =>
                distribution !== undefined && hasClassifications(distribution),
            )
        : [];

      const cards = STANDARD_METRICS.map<Card>((definition) => ({
        title: definition.label,
        subtitle: focus.name,
        higherIsBetter: definition.higherIsBetter,
        value: hasValues ? percent(definition.select(focusDistribution)) : undefined,
        comparisons: comparisonDistributions.map<StatCardComparison>((distribution) => ({
          label: distribution.name,
          value: percent(definition.select(distribution)),
        })),
      }));

      const representative = focus.groups.find((group) => group.subject?.name === subject);
      const labelParts = representative ? blockLabelParts(focus.groups, representative) : [];

      return { key: subject ?? '', labelParts, cards };
    });
  });
}
