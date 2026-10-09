import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Option der Mehrfachauswahl; ohne `color` entfällt das Farbfeld. */
export interface PillFilterOption {
  value: string;
  label: string;
  color?: string;
}

/** Mehrfachauswahl aus Pill-Chips mit optionalem Farbfeld. */
@Component({
  selector: 'tba3-pill-filter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'group' },
  templateUrl: './pill-filter.html',
})
export class Tba3PillFilterComponent {
  readonly options = input<PillFilterOption[]>([]);
  readonly selected = input<readonly string[]>([]);

  readonly selectedChange = output<string[]>();

  isSelected(value: string): boolean {
    return this.selected().includes(value);
  }

  toggle(value: string): void {
    const current = this.selected();
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value];
    this.selectedChange.emit(next);
  }
}
