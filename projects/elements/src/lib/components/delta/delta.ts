import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { deviationColor, deviationTint, type Deviation } from '../../model';

/** Pille mit einer Prozentpunkt-Differenz, eingefärbt erst ab der Schwelle. */
@Component({
  selector: 'tba3-delta',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './delta.html',
})
export class Tba3DeltaComponent {
  readonly delta = input<Deviation | undefined>(undefined);

  /** Prozentpunkte, ab denen die Pille eingefärbt wird; 0 färbt jede Abweichung. */
  readonly threshold = input(5);

  private readonly belowThreshold = computed(() => {
    const value = this.delta();
    return value ? Math.abs(value.diff) < this.threshold() : false;
  });

  protected readonly color = computed(() => {
    const value = this.delta();
    if (!value) return '';
    return deviationColor(this.belowThreshold() ? 'neutral' : value.direction);
  });

  protected readonly background = computed(() => {
    const value = this.delta();
    if (!value) return '';
    return deviationTint(this.belowThreshold() ? 'neutral' : value.direction);
  });

  // Der Pfeil folgt dem Vorzeichen, nicht der bewerteten Richtung.
  protected readonly iconClass = computed(() => {
    const value = this.delta();
    if (!value) return '';
    if (value.diff > 0) return 'fa-solid fa-fw fa-arrow-up';
    if (value.diff < 0) return 'fa-solid fa-fw fa-arrow-down';
    return 'fa-solid fa-fw fa-circle-dot';
  });
}
