import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FIXTURE_SOLUTION_RATES, SolutionRatesRankingComponent } from '@indibit/tba3-elements';

@Component({
  selector: 'solution-rates-ranking-absolute-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SolutionRatesRankingComponent],
  template: `<tba3-solution-rates-ranking [aggregations]="data" [scale]="{ mode: 'absolute' }" />`,
})
export class SolutionRatesRankingAbsoluteDemoComponent {
  protected readonly data = FIXTURE_SOLUTION_RATES;
}
