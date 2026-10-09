import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  EXAMPLE_VALUE_LABELS,
  FIXTURE_GROUP_RESULTS_TABLE,
  FIXTURE_GROUP_RESULTS_TABLE_AGGREGATIONS,
  GroupResultsTableComponent,
} from '@indibit/tba3-elements';

@Component({
  selector: 'group-results-table-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GroupResultsTableComponent],
  template: `<tba3-group-results-table
    [competenceLevels]="data"
    [aggregations]="aggregations"
    [valueLabels]="labels"
  />`,
})
export class GroupResultsTableDemoComponent {
  protected readonly data = FIXTURE_GROUP_RESULTS_TABLE;
  protected readonly aggregations = FIXTURE_GROUP_RESULTS_TABLE_AGGREGATIONS;
  protected readonly labels = EXAMPLE_VALUE_LABELS;
}
