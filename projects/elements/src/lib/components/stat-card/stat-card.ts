import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { labeledDeviation, type Deviation } from '../../model';
import { Tba3DeltaComponent } from '../delta/delta';

export interface StatCardComparison {
  label: string;
  value: number;
}

interface StatCardRow {
  label: string;
  value: number;
  delta: Deviation;
}

/** Kennzahlkarte mit dem Prozentwert der Hauptgruppe und je einer Δ-Zeile pro Vergleichsgruppe. */
@Component({
  selector: 'tba3-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Tba3DeltaComponent],
  templateUrl: './stat-card.html',
  // Volle Spaltenhöhe, damit Karten einer Reihe gleich hoch sind.
  host: { class: 'd-block h-100' },
})
export class Tba3StatCardComponent {
  readonly title = input('');
  /** Name der Hauptgruppe; leer blendet ihn aus. */
  readonly subtitle = input('');
  /** Prozentwert der Hauptgruppe; `undefined` zeigt „–“ ohne Vergleiche. */
  readonly value = input<number | undefined>(undefined);
  readonly comparisons = input<StatCardComparison[]>([]);
  /** Bei „Unter Mindeststandard“ `false`, weil dort ein negatives Δ günstig ist. */
  readonly higherIsBetter = input(true);
  readonly deviationThreshold = input(5);

  // Die Differenz entsteht auf den bereits gerundeten Prozentwerten.
  readonly rows = computed<StatCardRow[]>(() => {
    const value = this.value();
    if (value === undefined) return [];
    const higherIsBetter = this.higherIsBetter();
    const focusName = this.subtitle();
    return this.comparisons().map((comparison) => ({
      label: comparison.label,
      value: comparison.value,
      delta: labeledDeviation(value, comparison.value, higherIsBetter, focusName, comparison.label),
    }));
  });
}
