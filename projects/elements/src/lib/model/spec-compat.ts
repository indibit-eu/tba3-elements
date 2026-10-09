// Bricht den Build, wenn eine Antwort nach der Original-Spec nicht mehr zum Modell passt.
import type { paths as OriginalPaths } from './tba3-spec.original';
import type { AggregationsResponse, CompetenceLevelsResponse, ItemsResponse } from './index';

type OriginalResponse<P extends keyof OriginalPaths> = OriginalPaths[P] extends {
  get: { responses: { 200: { content: { 'application/json': infer R } } } };
}
  ? R
  : never;

type Assignable<From, To> = From extends To ? true : never;

export type SpecCompat = [
  Assignable<OriginalResponse<'/groups/{id}/competence-levels'>, CompetenceLevelsResponse>,
  Assignable<OriginalResponse<'/groups/{id}/aggregations'>, AggregationsResponse>,
  Assignable<OriginalResponse<'/groups/{id}/items'>, ItemsResponse>,
];
