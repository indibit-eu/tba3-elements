import { computed, linkedSignal, type Signal, type WritableSignal } from '@angular/core';
import { booklets, type ValueGroupLike } from '../../model';

/** Testhefte einer Quelle samt aktivem Heft. */
export interface BookletState {
  readonly booklets: Signal<(string | undefined)[]>;
  readonly hasSwitch: Signal<boolean>;
  readonly active: WritableSignal<string | undefined>;
  set(booklet: string | undefined): void;
}

/** Baut den Testheft-Zustand aus den Value-Groups einer Quelle. */
export function createBookletState(source: () => readonly ValueGroupLike[]): BookletState {
  const list = computed(() => booklets(source()));
  const hasSwitch = computed(() => list().length > 1);
  // Neuer Input setzt auf das erste Heft zurück, eine Nutzerauswahl überschreibt es.
  const active = linkedSignal<string | undefined>(() => list()[0]);
  return {
    booklets: list,
    hasSwitch,
    active,
    set: (booklet) => active.set(booklet),
  };
}
