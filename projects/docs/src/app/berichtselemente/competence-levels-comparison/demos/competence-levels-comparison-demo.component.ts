import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  CompetenceLevelsComparisonComponent,
  FIXTURE_COMPETENCE_LEVELS_COMPARISON,
} from '@indibit/tba3-elements';

@Component({
  selector: 'competence-levels-comparison-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CompetenceLevelsComparisonComponent],
  template: `<tba3-competence-levels-comparison
    [competenceLevels]="data"
    [comparisons]="['state:state-average']"
  />`,
})
export class CompetenceLevelsComparisonDemoComponent {
  protected readonly data = FIXTURE_COMPETENCE_LEVELS_COMPARISON;
}
