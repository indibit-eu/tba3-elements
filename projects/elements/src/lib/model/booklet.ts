import { BOOKLET_PROPERTY, covariateOf, propertyOf } from './properties';
import type { ValueGroupLike } from './value-groups';

/** Testheft aus den `properties`, sonst aus den Kovariaten. */
export function bookletOf(group: ValueGroupLike): string | undefined {
  return propertyOf(group, BOOKLET_PROPERTY) ?? covariateOf(group, BOOKLET_PROPERTY);
}

export function booklets(groups: readonly ValueGroupLike[]): (string | undefined)[] {
  return [...new Set(groups.map(bookletOf))];
}

export function forBooklet<T extends ValueGroupLike>(
  groups: readonly T[],
  booklet: string | undefined,
): T[] {
  return groups.filter((group) => bookletOf(group) === booklet);
}
