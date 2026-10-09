import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { resolveLabel } from '../../model';
import type { ValueLabels } from '../../model';

/** Segmentierter Testheft-Umschalter; rendert nichts bei weniger als zwei Heften. */
@Component({
  selector: 'tba3-booklet-switch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'group' },
  templateUrl: './booklet-switch.html',
})
export class Tba3BookletSwitchComponent {
  /** Wählbare Testhefte; `undefined` steht für „Ohne Testheft“. */
  readonly booklets = input<readonly (string | undefined)[]>([]);

  readonly active = input<string | undefined>(undefined);

  readonly valueLabels = input<ValueLabels | undefined>(undefined);

  readonly activeChange = output<string | undefined>();

  label(booklet: string | undefined): string {
    return booklet === undefined
      ? 'Ohne Testheft'
      : resolveLabel(this.valueLabels(), 'booklet', booklet);
  }

  select(booklet: string | undefined): void {
    this.activeChange.emit(booklet);
  }
}
