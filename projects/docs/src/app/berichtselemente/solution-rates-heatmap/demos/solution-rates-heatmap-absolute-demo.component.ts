import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FIXTURE_SOLUTION_RATES_HEATMAP,
  type HeatmapScale,
  SolutionRatesHeatmapComponent,
} from '@indibit/tba3-elements';

@Component({
  selector: 'solution-rates-heatmap-absolute-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SolutionRatesHeatmapComponent],
  template: `<tba3-solution-rates-heatmap [aggregations]="data" [scale]="scale" />`,
})
export class SolutionRatesHeatmapAbsoluteDemoComponent {
  protected readonly data = FIXTURE_SOLUTION_RATES_HEATMAP;
  protected readonly scale: HeatmapScale = { mode: 'absolute', thresholds: [40, 55, 70] };
}
