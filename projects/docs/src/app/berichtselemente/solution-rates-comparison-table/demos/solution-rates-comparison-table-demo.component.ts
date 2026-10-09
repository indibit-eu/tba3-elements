import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FIXTURE_SOLUTION_RATES_COMPARISON_TABLE,
  SolutionRatesComparisonTableComponent,
} from '@indibit/tba3-elements';

@Component({
  selector: 'solution-rates-comparison-table-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SolutionRatesComparisonTableComponent],
  template: `<tba3-solution-rates-comparison-table
    [aggregations]="data"
    [deltas]="['state:state-average', 'authority:year-2025']"
  />`,
})
export class SolutionRatesComparisonTableDemoComponent {
  protected readonly data = FIXTURE_SOLUTION_RATES_COMPARISON_TABLE;
}
