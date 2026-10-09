import type { AggregationsValueGroup, CompetenceLevelsValueGroup } from '../../lib/model';
import classCompetenceLevels from './class.competence-levels.json';
import classAggregations from './class.aggregations.json';
import empty from './empty.competence-levels.json';

/** Klasse 8a mit acht Personen, zwei Domänen und einer Nicht-Teilnahme. */
export const FIXTURE_GROUP_RESULTS_TABLE = classCompetenceLevels as CompetenceLevelsValueGroup[];

/** Mittlere Lösungsquote je Person und Domäne der Klasse 8a. */
export const FIXTURE_GROUP_RESULTS_TABLE_AGGREGATIONS =
  classAggregations as AggregationsValueGroup[];

/** Klasse 8a ohne Personen. */
export const FIXTURE_GROUP_RESULTS_TABLE_EMPTY = empty as CompetenceLevelsValueGroup[];
