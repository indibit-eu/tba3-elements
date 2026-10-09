import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  CompetenceLevelsComparisonComponent,
  CompositionSummaryComponent,
  GroupsOverviewComponent,
  parseGroupKey,
  type ProfileColumn,
  SolutionRatesComponent,
  SolutionRatesProfileComponent,
  StandardAttainmentByDomainComponent,
  StandardAttainmentSummaryComponent,
  SubgroupsTableComponent,
  CovariateGradientComponent,
  EXAMPLE_VALUE_LABELS,
} from '@indibit/tba3-elements';
import { TbaApiService } from '../../core/tba-api.service';
import { SCHOOL_HANDLUNGSFELDER } from '../../core/demo-content';

@Component({
  selector: 'app-school-page',
  imports: [
    CompetenceLevelsComparisonComponent,
    CompositionSummaryComponent,
    GroupsOverviewComponent,
    SolutionRatesComponent,
    SolutionRatesProfileComponent,
    StandardAttainmentByDomainComponent,
    StandardAttainmentSummaryComponent,
    SubgroupsTableComponent,
    CovariateGradientComponent,
  ],
  templateUrl: './school-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolPageComponent {
  private readonly api = inject(TbaApiService);
  private readonly router = inject(Router);

  protected readonly labels = EXAMPLE_VALUE_LABELS;
  protected readonly handlungsfelder = SCHOOL_HANDLUNGSFELDER;

  protected readonly composition = this.api.aggregations('schools', 'school-birkenmoor', {
    type: 'school',
    aggregation:
      'students-by-participation,students-by-gender,students-by-languageAtHome,students-by-ses,groups-by-participation,minimumClassification',
  });

  protected readonly attainment = this.api.aggregations('schools', 'school-birkenmoor', {
    type: 'school,state',
    comparison: 'state-average,school-faircomparison,year-2025',
    aggregation: 'minimumClassification',
  });

  protected readonly byDomain = this.api.competenceLevels('schools', 'school-birkenmoor', {
    type: 'school',
    comparison: 'school-birkenmoor',
  });

  protected readonly byDomainTotals = this.api.aggregations('schools', 'school-birkenmoor', {
    type: 'school',
    aggregation: 'minimumClassification',
  });

  protected readonly subgroups = this.api.aggregations('schools', 'school-birkenmoor', {
    type: 'school,group,state',
    comparison: 'state-average',
    aggregation:
      'minimumClassification,students-by-participation,students-by-gender,groups-by-participation',
  });

  protected readonly groupsLevels = this.api.competenceLevels('schools', 'school-birkenmoor', {
    type: 'school,group',
    comparison: 'school-birkenmoor',
  });

  protected readonly groupsAggregations = this.api.aggregations('schools', 'school-birkenmoor', {
    type: 'group',
    aggregation: 'students-by-gender,students-by-participation',
  });

  protected readonly comparison = this.api.competenceLevels('schools', 'school-birkenmoor', {
    type: 'school,state',
    comparison: 'state-average,school-faircomparison',
  });

  protected readonly solutionRates = this.api.aggregations('schools', 'school-birkenmoor', {
    type: 'school,state',
    comparison: 'state-average',
    aggregation: 'competence',
  });

  protected readonly profile = this.api.aggregations('schools', 'school-birkenmoor', {
    type: 'school,group,state',
    comparison: 'state-average',
    aggregation: 'competence',
  });

  protected readonly gradient = this.api.aggregations('schools', 'school-birkenmoor', {
    type: 'school,state',
    comparison: 'state-average,school-faircomparison',
    aggregation: 'ses',
  });

  protected readonly comparisonIds = ['state:state-average', 'school:school-faircomparison'];

  protected readonly stateComparison = ['state:state-average'];

  protected readonly profileColumns: readonly ProfileColumn[] = [
    { key: 'school:school-birkenmoor', role: 'main' },
    { key: 'group:group-8a', role: 'main' },
    { key: 'group:group-8b', role: 'main' },
    { key: 'group:group-8c', role: 'main' },
    { key: 'state:state-average', role: 'comparison' },
  ];

  // Nur die Klasse 8a hat eine eigene Seite.
  protected openGroup(groupKey: string): void {
    if (parseGroupKey(groupKey).id === 'group-8a') {
      void this.router.navigate(['/lerngruppe']);
    }
  }
}
