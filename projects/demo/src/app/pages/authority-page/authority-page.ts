import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
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
import { AUTHORITY_HANDLUNGSFELDER } from '../../core/demo-content';

@Component({
  selector: 'app-authority-page',
  imports: [
    CompetenceLevelsComparisonComponent,
    CompositionSummaryComponent,
    SolutionRatesComponent,
    SolutionRatesComparisonTableComponent,
    StandardAttainmentByDomainComponent,
    StandardAttainmentSummaryComponent,
    SubgroupsTableComponent,
  ],
  templateUrl: './authority-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorityPageComponent {
  private readonly api = inject(TbaApiService);

  protected readonly labels = EXAMPLE_VALUE_LABELS;
  protected readonly handlungsfelder = AUTHORITY_HANDLUNGSFELDER;

  private readonly filter = 'authority:sa-nordmark';

  protected readonly composition = this.api.aggregations('states', 'beispielland', {
    filter: this.filter,
    type: 'authority',
    aggregation:
      'students-by-participation,students-by-gender,students-by-languageAtHome,students-by-ses,schools-by-participation,minimumClassification',
  });

  private readonly overviewAggregationTypes =
    'minimumClassification,students-by-participation,students-by-gender,students-by-languageAtHome,schools-by-participation,groups-by-participation';

  private readonly authorityAggregations = this.api.aggregations('states', 'beispielland', {
    filter: this.filter,
    type: 'authority,school',
    aggregation: this.overviewAggregationTypes,
  });

  // Die gefilterte Antwort trägt zum Land nur Lösungsquoten, die Kopfzahlen kommen ungefiltert.
  private readonly stateAggregations = this.api.aggregations('states', 'beispielland', {
    type: 'state',
    aggregation: this.overviewAggregationTypes,
  });

  protected readonly overviewAggregations = computed(() => [
    ...this.authorityAggregations(),
    ...this.stateAggregations(),
  ]);

  protected readonly attainment = this.api.aggregations('states', 'beispielland', {
    filter: this.filter,
    type: 'authority,state',
    comparison: 'beispielland',
    aggregation: 'minimumClassification',
  });

  protected readonly byDomain = this.api.competenceLevels('states', 'beispielland', {
    filter: this.filter,
    type: 'authority',
    comparison: 'sa-nordmark',
  });

  protected readonly byDomainTotals = this.api.aggregations('states', 'beispielland', {
    filter: this.filter,
    type: 'authority',
    aggregation: 'minimumClassification',
  });

  protected readonly comparison = this.api.competenceLevels('states', 'beispielland', {
    filter: this.filter,
    type: 'authority,state',
    comparison: 'beispielland',
  });

  protected readonly solutionRates = this.api.aggregations('states', 'beispielland', {
    filter: this.filter,
    type: 'authority,state',
    comparison: 'beispielland',
    aggregation: 'competence',
  });

  protected readonly comparisonTable = this.api.aggregations('states', 'beispielland', {
    filter: this.filter,
    type: 'authority,state',
    comparison: 'beispielland,year-2025',
    aggregation: 'competence',
  });

  protected readonly stateComparison = ['state:beispielland'];

  protected readonly comparisonDeltas = ['state:beispielland', 'authority:year-2025'];
}
