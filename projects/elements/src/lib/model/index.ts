// Sprechende Namen für die aus der Spec generierten Typen (`npm run generate:model`).
import type { components, paths } from './tba3-spec';

export type Tba3Schemas = components['schemas'];

export type Tba3Paths = paths;

export type CompetenceLevelsResponse =
  paths['/groups/{id}/competence-levels']['get']['responses']['200']['content']['application/json'];

export type AggregationsResponse =
  paths['/groups/{id}/aggregations']['get']['responses']['200']['content']['application/json'];

export type ItemsResponse =
  paths['/groups/{id}/items']['get']['responses']['200']['content']['application/json'];

export type CompetenceLevelsValueGroup = CompetenceLevelsResponse[number];

export type AggregationsValueGroup = AggregationsResponse[number];

export type ItemsValueGroup = ItemsResponse[number];

/** Die Spec lässt `type` frei; die Bibliothek erwartet diese Werte. */
export type ValueGroupType =
  'student' | 'group' | 'school' | 'comparisonSchool' | 'district' | 'authority' | 'state';

export * from './value-groups';
export * from './aggregations';
export * from './properties';
export * from './booklet';
export * from './labels';
export * from './classification';
export * from './deviation';
export * from './scale';
export * from './sorting';
export * from './theme';
export * from './level-catalog';
