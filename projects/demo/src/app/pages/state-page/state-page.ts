import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  CompetenceLevelsComparisonComponent,
  CompositionSummaryComponent,
  SolutionRatesComponent,
  SolutionRatesComparisonTableComponent,
  StandardAttainmentByDomainComponent,
  StandardAttainmentSummaryComponent,
  SubgroupsTableComponent,
  EXAMPLE_VALUE_LABELS,
} from '@indibit/tba3-elements';
import { TbaApiService } from '../../core/tba-api.service';

@Component({
  selector: 'app-state-page',
  imports: [
    CompetenceLevelsComparisonComponent,
    CompositionSummaryComponent,
    SolutionRatesComponent,
    SolutionRatesComparisonTableComponent,
    StandardAttainmentByDomainComponent,
    StandardAttainmentSummaryComponent,
    SubgroupsTableComponent,
  ],
  templateUrl: './state-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatePageComponent {
  private readonly api = inject(TbaApiService);

  protected readonly labels = EXAMPLE_VALUE_LABELS;

  protected readonly authorityIds = [
    'authority:sa-nordmark',
    'authority:sa-seeland',
    'authority:sa-hochtal',
    'authority:sa-westerau',
  ];

  protected readonly composition = this.api.aggregations('states', 'beispielland', {
    type: 'state',
    aggregation:
      'students-by-participation,students-by-gender,students-by-languageAtHome,students-by-ses,schools-by-participation,authorities-by-participation,minimumClassification',
  });

  protected readonly overviewAggregations = this.api.aggregations('states', 'beispielland', {
    type: 'state,authority',
    aggregation:
      'minimumClassification,students-by-participation,students-by-gender,students-by-languageAtHome,schools-by-participation',
  });

  protected readonly attainment = this.api.aggregations('states', 'beispielland', {
    type: 'state',
    aggregation: 'minimumClassification',
  });

  protected readonly byDomain = this.api.competenceLevels('states', 'beispielland', {
    type: 'state',
  });

  protected readonly byDomainTotals = this.api.aggregations('states', 'beispielland', {
    type: 'state',
    aggregation: 'minimumClassification',
  });

  protected readonly comparison = this.api.competenceLevels('states', 'beispielland', {
    type: 'state,authority',
  });

  protected readonly solutionRates = this.api.aggregations('states', 'beispielland', {
    type: 'state,authority',
    aggregation: 'competence',
  });

  protected readonly comparisonTable = this.api.aggregations('states', 'beispielland', {
    type: 'state',
    comparison: 'year-2025',
    aggregation: 'competence',
  });

  protected readonly comparisonDeltas = ['state:year-2025'];
}
