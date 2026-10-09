import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  EXAMPLE_LEVEL_CATALOG,
  EXAMPLE_VALUE_LABELS,
  FIXTURE_STUDENT_COMPETENCE_LEVELS,
  StudentCompetenceLevelsComponent,
} from '@indibit/tba3-elements';

@Component({
  selector: 'student-competence-levels-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StudentCompetenceLevelsComponent],
  template: `<tba3-student-competence-levels
    [competenceLevels]="data"
    [levelCatalog]="catalog"
    [valueLabels]="valueLabels"
  />`,
})
export class StudentCompetenceLevelsDemoComponent {
  protected readonly data = FIXTURE_STUDENT_COMPETENCE_LEVELS;
  protected readonly catalog = EXAMPLE_LEVEL_CATALOG;
  protected readonly valueLabels = EXAMPLE_VALUE_LABELS;
}
