import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FIXTURE_SOLUTION_RATES, SolutionRatesComponent } from '@indibit/tba3-elements';

@Component({
  selector: 'solution-rates-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SolutionRatesComponent],
  template: `<tba3-solution-rates [aggregations]="data" [comparisons]="['state:state-average']" />`,
})
export class SolutionRatesDemoComponent {
  protected readonly data = FIXTURE_SOLUTION_RATES;
}
