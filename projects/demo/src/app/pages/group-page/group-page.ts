import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  CompetenceLevelsComparisonComponent,
  CompetenceLevelsDistributionComponent,
  CompositionSummaryComponent,
  EXAMPLE_VALUE_LABELS,
  GroupResultsTableComponent,
  parseGroupKey,
  SolutionRatesComponent,
  SolutionRatesHeatmapComponent,
  SolutionRatesRankingComponent,
} from '@indibit/tba3-elements';
import { TbaApiService } from '../../core/tba-api.service';

/** Bericht für eine Klasse in einem Fach. Den Fachfilter setzt der Bericht, nicht das Element. */
@Component({
  selector: 'app-group-page',
  imports: [
    CompetenceLevelsDistributionComponent,
    CompositionSummaryComponent,
    GroupResultsTableComponent,
    SolutionRatesComponent,
    SolutionRatesRankingComponent,
    SolutionRatesHeatmapComponent,
    CompetenceLevelsComparisonComponent,
  ],
  templateUrl: './group-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupPageComponent {
  private readonly api = inject(TbaApiService);
  private readonly router = inject(Router);

  protected readonly labels = EXAMPLE_VALUE_LABELS;

  protected readonly groupId = 'group-8a';
  protected readonly subject = 'Deutsch';

  private readonly distributionResponse = this.api.competenceLevels('groups', 'group-8a', {
    type: 'group',
  });
  protected readonly distribution = computed(() =>
    this.distributionResponse().filter(
      (group) => group.id === this.groupId && group.subject?.name === this.subject,
    ),
  );

  protected readonly composition = this.api.aggregations('groups', 'group-8a', {
    type: 'group',
    aggregation:
      'students-by-participation,students-by-gender,students-by-languageAtHome,students-by-ses',
  });

  protected readonly tableLevels = this.api.competenceLevels('groups', 'group-8a', {
    type: 'group,student',
  });

  protected readonly tableRates = this.api.aggregations('groups', 'group-8a', {
    type: 'student',
    aggregation: 'domain',
  });

  protected readonly solutionRates = this.api.aggregations('groups', 'group-8a', {
    type: 'group,state',
    comparison: 'state-average',
    aggregation: 'competence',
  });

  protected readonly comparison = this.api.competenceLevels('groups', 'group-8a', {
    type: 'group,school,state',
    comparison: 'school-average,state-average',
  });

  protected readonly heatmap = this.api.aggregations('groups', 'group-8a', {
    type: 'group,student,school,state',
    comparison: 'school-average,state-average',
    aggregation: 'competence',
  });

  protected readonly stateComparison = ['state:state-average'];

  protected openPerson(personKey: string): void {
    void this.router.navigate(['/person', parseGroupKey(personKey).id]);
  }

  protected readonly heatmapColumn = signal<string>('');
  protected readonly heatmapStudents = signal<readonly string[]>([]);

  protected onHeatmapColumn(value: string): void {
    this.heatmapColumn.set(value);
  }

  protected onHeatmapStudents(ids: string[]): void {
    this.heatmapStudents.set(ids);
  }
}
