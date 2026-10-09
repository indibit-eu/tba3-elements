import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Raster für Karten, das nach der Breite des Elements statt des Fensters umbricht. Bootstraps
 * `col-md-*` richtet sich nach dem Fenster und quetscht die Karten in schmalen Spalten.
 */
@Component({
  selector: 'tba3-card-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  styleUrl: './card-grid.scss',
  host: { '[style.--tba3-card-min]': 'minWidth()' },
})
export class Tba3CardGridComponent {
  /** Mindestbreite einer Karte als CSS-Länge; darunter rückt die Karte in die nächste Zeile. */
  readonly minWidth = input('16rem');
}
