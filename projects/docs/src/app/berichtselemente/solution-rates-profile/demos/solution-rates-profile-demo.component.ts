import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FIXTURE_SOLUTION_RATES_PROFILE,
  SolutionRatesProfileComponent,
} from '@indibit/tba3-elements';

@Component({
  selector: 'solution-rates-profile-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SolutionRatesProfileComponent],
  template: `<tba3-solution-rates-profile [aggregations]="data" />`,
})
export class SolutionRatesProfileDemoComponent {
  protected readonly data = FIXTURE_SOLUTION_RATES_PROFILE;
}
