import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  CompetenceLevelsDistributionComponent,
  FIXTURE_COMPETENCE_LEVELS_DISTRIBUTION,
} from '@indibit/tba3-elements';

@Component({
  selector: 'competence-levels-distribution-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CompetenceLevelsDistributionComponent],
  template: `<tba3-competence-levels-distribution [competenceLevels]="data" />`,
})
export class CompetenceLevelsDistributionDemoComponent {
  protected readonly data = FIXTURE_COMPETENCE_LEVELS_DISTRIBUTION;
}
