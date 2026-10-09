import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FIXTURE_SOLUTION_RATES, SolutionRatesRankingComponent } from '@indibit/tba3-elements';

@Component({
  selector: 'solution-rates-ranking-relative-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SolutionRatesRankingComponent],
  template: `<tba3-solution-rates-ranking
    [aggregations]="data"
    comparison="state:state-average"
  />`,
})
export class SolutionRatesRankingRelativeDemoComponent {
  protected readonly data = FIXTURE_SOLUTION_RATES;
}
