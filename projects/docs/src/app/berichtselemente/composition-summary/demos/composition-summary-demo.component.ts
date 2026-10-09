import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  CompositionSummaryComponent,
  EXAMPLE_VALUE_LABELS,
  FIXTURE_COMPOSITION_SUMMARY,
} from '@indibit/tba3-elements';

@Component({
  selector: 'composition-summary-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CompositionSummaryComponent],
  template: `<tba3-composition-summary [aggregations]="data" [valueLabels]="labels" />`,
})
export class CompositionSummaryDemoComponent {
  protected readonly data = FIXTURE_COMPOSITION_SUMMARY;
  protected readonly labels = EXAMPLE_VALUE_LABELS;
}
