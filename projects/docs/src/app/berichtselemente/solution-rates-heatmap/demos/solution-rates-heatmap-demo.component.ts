import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FIXTURE_SOLUTION_RATES_HEATMAP,
  SolutionRatesHeatmapComponent,
} from '@indibit/tba3-elements';

@Component({
  selector: 'solution-rates-heatmap-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SolutionRatesHeatmapComponent],
  template: `<tba3-solution-rates-heatmap [aggregations]="data" />`,
})
export class SolutionRatesHeatmapDemoComponent {
  protected readonly data = FIXTURE_SOLUTION_RATES_HEATMAP;
}
