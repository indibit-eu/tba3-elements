import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import {
  EXAMPLE_VALUE_LABELS,
  SolutionRatesComponent,
  StudentCompetenceLevelsComponent,
} from '@indibit/tba3-elements';
import { TbaApiService } from '../../core/tba-api.service';
import { GERMAN_LEVEL_CATALOG } from '../../core/demo-content';

interface PersonOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-person-page',
  imports: [StudentCompetenceLevelsComponent, SolutionRatesComponent],
  templateUrl: './person-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonPageComponent {
  private readonly api = inject(TbaApiService);

  protected readonly labels = EXAMPLE_VALUE_LABELS;
  protected readonly levelCatalog = GERMAN_LEVEL_CATALOG;

  readonly studentId = input<string>();

  private readonly students = this.api.competenceLevels('groups', 'group-8a', { type: 'student' });

  protected readonly options = computed<PersonOption[]>(() => {
    const seen = new Map<string, PersonOption>();
    for (const group of this.students()) {
      const id = group.id ?? group.name ?? '';
      if (id && !seen.has(id)) {
        seen.set(id, { id, name: group.name ?? id });
      }
    }
    return [...seen.values()];
  });

  protected readonly selected = linkedSignal<string | undefined>(
    () => this.studentId() ?? this.options()[0]?.id,
  );

  private readonly selected$ = toObservable(this.selected);

  protected readonly levels = toSignal(
    this.selected$.pipe(
      switchMap((id) =>
        id
          ? this.api.competenceLevels$('groups', 'group-8a', { filter: id, type: 'student' })
          : of([]),
      ),
    ),
    { initialValue: [] },
  );

  // Bloße Ids für den Query-Parameter `comparison`, Schlüssel `typ:id` für das Element.
  protected readonly rateComparisonIds = ['group-8a', 'school-average', 'state-average'];
  protected readonly rateComparisons = [
    'group:group-8a',
    'school:school-average',
    'state:state-average',
  ];

  protected readonly rates = toSignal(
    this.selected$.pipe(
      switchMap((id) =>
        id
          ? this.api.aggregations$('groups', 'group-8a', {
              filter: id,
              type: 'student,group,school,state',
              comparison: this.rateComparisonIds.join(','),
              aggregation: 'competence',
            })
          : of([]),
      ),
    ),
    { initialValue: [] },
  );

  protected select(id: string): void {
    this.selected.set(id);
  }
}
