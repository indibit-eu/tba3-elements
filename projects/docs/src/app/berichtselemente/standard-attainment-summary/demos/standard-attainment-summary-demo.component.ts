import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FIXTURE_STANDARD_ATTAINMENT_SUMMARY,
  StandardAttainmentSummaryComponent,
} from '@indibit/tba3-elements';

@Component({
  selector: 'standard-attainment-summary-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StandardAttainmentSummaryComponent],
  template: `<tba3-standard-attainment-summary [aggregations]="data" />`,
})
export class StandardAttainmentSummaryDemoComponent {
  protected readonly data = FIXTURE_STANDARD_ATTAINMENT_SUMMARY;
}
