import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  EXAMPLE_PROFILE_COLUMNS_SCHOOL,
  FIXTURE_SOLUTION_RATES_PROFILE_SCHOOL,
  SolutionRatesProfileComponent,
} from '@indibit/tba3-elements';

@Component({
  selector: 'solution-rates-profile-absolute-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SolutionRatesProfileComponent],
  template: `<tba3-solution-rates-profile
    [aggregations]="data"
    [columns]="columns"
    [scale]="{ mode: 'absolute', thresholds: [40, 55, 70] }"
  />`,
})
export class SolutionRatesProfileAbsoluteDemoComponent {
  protected readonly data = FIXTURE_SOLUTION_RATES_PROFILE_SCHOOL;
  protected readonly columns = EXAMPLE_PROFILE_COLUMNS_SCHOOL;
}
