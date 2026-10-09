import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  EXAMPLE_VALUE_LABELS,
  FIXTURE_GROUPS_OVERVIEW,
  FIXTURE_GROUPS_OVERVIEW_AGGREGATIONS,
  GroupsOverviewComponent,
} from '@indibit/tba3-elements';

@Component({
  selector: 'groups-overview-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GroupsOverviewComponent],
  template: `<tba3-groups-overview
    [competenceLevels]="data"
    [aggregations]="aggregations"
    [valueLabels]="labels"
  />`,
})
export class GroupsOverviewDemoComponent {
  protected readonly data = FIXTURE_GROUPS_OVERVIEW;
  protected readonly aggregations = FIXTURE_GROUPS_OVERVIEW_AGGREGATIONS;
  protected readonly labels = EXAMPLE_VALUE_LABELS;
}
