import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { createBookletState } from './booklet-state';
import type { ValueGroupLike } from '../../model';

function group(booklet?: string): ValueGroupLike {
  return booklet === undefined
    ? { id: 'g' }
    : { id: 'g', properties: [{ key: 'booklet', value: booklet }] };
}

describe('createBookletState', () => {
  it('listet die Testhefte in Antwortreihenfolge und meldet den Umschalter ab zwei Heften', () => {
    const state = createBookletState(() => [group('A'), group('B'), group('A')]);
    expect(state.booklets()).toEqual(['A', 'B']);
    expect(state.hasSwitch()).toBe(true);
    expect(state.active()).toBe('A');
  });

  it('meldet keinen Umschalter bei einem Heft und leert sich ohne Value-Groups', () => {
    expect(createBookletState(() => [group('A')]).hasSwitch()).toBe(false);
    const empty = createBookletState(() => []);
    expect(empty.booklets()).toEqual([]);
    expect(empty.active()).toBeUndefined();
  });

  it('setzt das aktive Heft über set', () => {
    const state = createBookletState(() => [group('A'), group('B')]);
    state.set('B');
    expect(state.active()).toBe('B');
  });

  it('setzt das aktive Heft bei einer neuen Quelle auf das erste Heft zurück (linkedSignal)', () => {
    const source = signal<ValueGroupLike[]>([group('A'), group('B')]);
    const state = createBookletState(() => source());
    state.set('B');
    expect(state.active()).toBe('B');
    source.set([group('C'), group('D')]);
    expect(state.booklets()).toEqual(['C', 'D']);
    expect(state.active()).toBe('C');
  });
});
