import { computed, Directive, ElementRef, inject, signal } from '@angular/core';

/** Basis der Bedienfeld-Marker; verbindet den Host per `aria-labelledby` mit dem Zeilenlabel. */
@Directive({ host: { '[attr.aria-labelledby]': 'appliedLabelledBy()' } })
export abstract class Tba3ControlPanelSlot {
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;

  readonly labelledBy = signal<string | null>(null);

  // Auf einem einzelnen Knopf würde aria-labelledby den Knopftext als Namen ersetzen.
  protected readonly appliedLabelledBy = computed(() => {
    const id = this.labelledBy();
    if (id === null) {
      return null;
    }
    return this.host.getAttribute('role') === 'group' ? id : null;
  });
}

/** Marker der Filterzeile im Bedienfeld. */
@Directive({ selector: '[tba3Filter]', standalone: true })
export class Tba3FilterSlot extends Tba3ControlPanelSlot {}

/** Marker der Zeile Vergleichswerte im Bedienfeld. */
@Directive({ selector: '[tba3Comparisons]', standalone: true })
export class Tba3ComparisonsSlot extends Tba3ControlPanelSlot {}

/** Marker der Zeile Ansicht im Bedienfeld. */
@Directive({ selector: '[tba3View]', standalone: true })
export class Tba3ViewSlot extends Tba3ControlPanelSlot {}
