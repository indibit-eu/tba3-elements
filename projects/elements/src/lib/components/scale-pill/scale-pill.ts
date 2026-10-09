import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { scaleBackground, scaleColor, scaleIndicator, type ScaleLevel } from '../../model';

/** Pille einer Stufe der absoluten Skala; der Indikator kodiert die Stufe zusätzlich zur Farbe. */
@Component({
  selector: 'tba3-scale-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scale-pill.html',
})
export class Tba3ScalePillComponent {
  readonly level = input.required<ScaleLevel>();
  readonly text = input.required<string>();
  /** Hebt die Pille fett hervor, etwa für die Hauptgruppe. */
  readonly emphasis = input(false);
  /** Leer heißt kein Attribut. */
  readonly ariaLabel = input('');

  protected readonly indicator = computed(() => scaleIndicator(this.level()));
  protected readonly color = computed(() => scaleColor(this.level()));
  protected readonly background = computed(() => scaleBackground(this.level()));
}
