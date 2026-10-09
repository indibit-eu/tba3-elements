import type { AggregationsValueGroup, CompetenceLevelsValueGroup } from '../../lib/model';
import school from './school.competence-levels.json';
import aggregations from './school.aggregations.json';
import twoSets from './school-two-sets.competence-levels.json';
import empty from './empty.competence-levels.json';

/** Schule mit den Klassen 8a, 8b und 8c in Deutsch und Mathematik. */
export const FIXTURE_GROUPS_OVERVIEW = school as CompetenceLevelsValueGroup[];

/** Geschlecht und Teilnahme je Klasse und Fach zu `FIXTURE_GROUPS_OVERVIEW`. */
export const FIXTURE_GROUPS_OVERVIEW_AGGREGATIONS = aggregations as AggregationsValueGroup[];

/** Schule und Klasse 8a mit zwei Stufensets in einer Domäne. */
export const FIXTURE_GROUPS_OVERVIEW_TWO_SETS = twoSets as CompetenceLevelsValueGroup[];

/** Nur die Schule, ohne Lerngruppen. */
export const FIXTURE_GROUPS_OVERVIEW_EMPTY = empty as CompetenceLevelsValueGroup[];
