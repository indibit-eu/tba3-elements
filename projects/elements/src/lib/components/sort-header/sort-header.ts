import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { sortIcon, type SortDirection } from '../../model';

/** Sortierbutton eines Tabellenkopfs mit Label, Sortier-Icon und Prioritätspille. */
@Component({
  selector: 'tba3-sort-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sort-header.html',
})
export class Tba3SortHeaderComponent {
  readonly label = input('');

  readonly direction = input<SortDirection | undefined>(undefined);

  /** Rang der Spalte in der Sortierung ab 1; ohne Wert keine Pille. */
  readonly priority = input<number | undefined>(undefined);

  readonly toggle = output<void>();

  protected readonly iconClass = computed(() => sortIcon(this.direction()));
}
