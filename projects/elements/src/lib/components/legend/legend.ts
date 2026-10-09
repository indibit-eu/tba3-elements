import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Rein visueller Icon-Marker vor dem Legendentext. */
export interface Tba3LegendMarker {
  icon: string;
  color?: string;
  title?: string;
}

/** Legendeneintrag; ohne `color` entfällt das Farbfeld. */
export interface Tba3LegendItem {
  color?: string;
  text: string;
  value?: string | number;
  marker?: Tba3LegendMarker;
}

/** Einheitliche Inline-Legende, immer `aria-hidden`: Diagramme zeigen die Werte als Tabelle. */
@Component({
  selector: 'tba3-legend',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './legend.html',
})
export class Tba3LegendComponent {
  readonly items = input<Tba3LegendItem[]>([]);
}
