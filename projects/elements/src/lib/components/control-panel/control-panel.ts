import { ChangeDetectionStrategy, Component, contentChild, effect, input } from '@angular/core';
import { Tba3ComparisonsSlot, Tba3FilterSlot, Tba3ViewSlot } from './control-panel-slots';

let panelInstances = 0;

/** Bedienfeld mit den Zeilen Filter, Vergleichswerte und Ansicht, je nach Projektion. */
@Component({
  selector: 'tba3-control-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './control-panel.html',
  styleUrl: './control-panel.scss',
})
export class Tba3ControlPanelComponent {
  // Mehrere Bedienfelder auf einer Seite brauchen eindeutige Label-Ids.
  private readonly idPrefix = `tba3-ctrl-${panelInstances++}`;

  protected readonly filterLabelId = `${this.idPrefix}-filter`;
  protected readonly comparisonsLabelId = `${this.idPrefix}-comparisons`;
  protected readonly viewLabelId = `${this.idPrefix}-view`;

  readonly filterLabel = input('Filter');
  readonly comparisonsLabel = input('Vergleichswerte');
  readonly viewLabel = input('Ansicht');

  protected readonly hasFilter = contentChild(Tba3FilterSlot);
  protected readonly hasComparisons = contentChild(Tba3ComparisonsSlot);
  protected readonly hasView = contentChild(Tba3ViewSlot);

  constructor() {
    effect(() => {
      this.hasFilter()?.labelledBy.set(this.filterLabelId);
      this.hasComparisons()?.labelledBy.set(this.comparisonsLabelId);
      this.hasView()?.labelledBy.set(this.viewLabelId);
    });
  }
}
