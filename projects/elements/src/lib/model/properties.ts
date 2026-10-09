import type { ValueGroupLike } from './value-groups';

/** Lösungsquoten sind nur innerhalb eines Testhefts vergleichbar. */
export const BOOKLET_PROPERTY = 'booklet';

/** Stufen verschiedener Sets (etwa HSA und MSA) sind nicht vergleichbar. */
export const COMPETENCE_LEVEL_SET_PROPERTY = 'competenceLevelSet';

export function propertyOf(group: ValueGroupLike, key: string): string | undefined {
  return group.properties?.find((entry) => entry.key === key)?.value;
}

export function covariateOf(group: ValueGroupLike, type: string): string | undefined {
  return group.covariates?.find((entry) => entry.type === type)?.value;
}

export function competenceLevelSetOf(group: ValueGroupLike): string | undefined {
  return propertyOf(group, COMPETENCE_LEVEL_SET_PROPERTY);
}
