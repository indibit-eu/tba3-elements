import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  EXAMPLE_VALUE_LABELS,
  FIXTURE_SUBGROUPS_TABLE_AUTHORITY,
  SubgroupsTableComponent,
} from '@indibit/tba3-elements';

@Component({
  selector: 'subgroups-table-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SubgroupsTableComponent],
  template: `<tba3-subgroups-table [aggregations]="aggregations" [valueLabels]="labels" />`,
})
export class SubgroupsTableDemoComponent {
  protected readonly aggregations = FIXTURE_SUBGROUPS_TABLE_AUTHORITY;
  protected readonly labels = EXAMPLE_VALUE_LABELS;
}
