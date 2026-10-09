import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  CovariateGradientComponent,
  EXAMPLE_VALUE_LABELS,
  FIXTURE_COVARIATE_GRADIENT,
} from '@indibit/tba3-elements';

@Component({
  selector: 'covariate-gradient-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CovariateGradientComponent],
  template: `<tba3-covariate-gradient [aggregations]="data" [valueLabels]="labels" />`,
})
export class CovariateGradientDemoComponent {
  protected readonly data = FIXTURE_COVARIATE_GRADIENT;
  protected readonly labels = EXAMPLE_VALUE_LABELS;
}
