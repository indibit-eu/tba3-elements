import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  SCALE_LEVELS,
  scaleRangeText,
  sortThresholds,
  type ScaleLevel,
  type ScaleThresholds,
} from '../../model';
import { Tba3ScalePillComponent } from '../scale-pill/scale-pill';

interface ScaleLegendItem {
  level: ScaleLevel;
  text: string;
}

/** Legende der vierstufigen absoluten Skala in der Pillenform der Zellen. */
@Component({
  selector: 'tba3-scale-legend',
  standalone: true,
  imports: [Tba3ScalePillComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scale-legend.html',
})
export class Tba3ScaleLegendComponent {
  /** Die drei Grenzen der Skala, in beliebiger Reihenfolge. */
  readonly thresholds = input.required<ScaleThresholds>();
  readonly ariaLabel = input('Skala');

  protected readonly items = computed<ScaleLegendItem[]>(() => {
    const sorted = sortThresholds(this.thresholds());
    return SCALE_LEVELS.map((level) => ({
      level,
      text: scaleRangeText(level, sorted),
    }));
  });
}
