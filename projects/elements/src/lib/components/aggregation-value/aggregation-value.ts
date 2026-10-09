import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/** Aggregationswert (Kennung, Name, Domäne) als umbrechender Fließtext, optional klickbar. */
@Component({
  selector: 'tba3-aggregation-value',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './aggregation-value.html',
})
export class Tba3AggregationValueComponent {
  /** Kennung wie Bista-Nummer oder Merkmalskürzel. */
  readonly code = input<string | undefined>(undefined);

  readonly name = input.required<string>();

  /** Nur setzen, wenn die Domäne nicht schon außerhalb steht. */
  readonly domain = input<string | undefined>(undefined);

  /** Macht die Kennung, ohne Kennung den Namen, zum Button. */
  readonly clickable = input(false);

  readonly selected = output<void>();

  protected readonly ariaLabel = computed(() => {
    const code = this.code();
    const label = code ? `${code} ${this.name()}` : this.name();
    return `Details zu ${label} öffnen`;
  });
}
