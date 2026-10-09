import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Tba3PillFilterComponent, type PillFilterOption } from '../pill-filter/pill-filter';
import type { GroupedValueGroups, ValueGroupLike } from '../../model';

/** Chip-Zeile zum Ein- und Ausblenden von Vergleichsgruppen, sortiert nach `type`. */
@Component({
  selector: 'tba3-comparison-picker',
  standalone: true,
  imports: [Tba3PillFilterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'group' },
  templateUrl: './comparison-picker.html',
})
export class Tba3ComparisonPickerComponent {
  readonly groups = input<GroupedValueGroups<ValueGroupLike>[]>([]);
  readonly selected = input<readonly string[]>([]);
  readonly selectedChange = output<string[]>();

  // Gruppen gleichen Typs stehen beisammen, in Reihenfolge ihres ersten Auftretens.
  readonly pillOptions = computed<PillFilterOption[]>(() => {
    const byType = new Map<string, PillFilterOption[]>();
    for (const group of this.groups()) {
      const type = group.type ?? '';
      if (!byType.has(type)) byType.set(type, []);
      byType.get(type)!.push({ value: group.key, label: group.name });
    }
    return [...byType.values()].flat();
  });

  toggle(key: string): void {
    const current = this.selected();
    const next = current.includes(key)
      ? current.filter((entry) => entry !== key)
      : [...current, key];
    this.selectedChange.emit(next);
  }
}
