import type { AggregationsValueGroup } from '../../lib/model';
import authorityComparisons from './authority-comparisons.aggregations.json';
import competenceTypes from './competence-types.aggregations.json';
import readingStyles from './reading-styles.aggregations.json';
import empty from './empty.aggregations.json';

/** Schulamt mit zwei Domänen, Landesmittelwert, Vorjahresdurchgang und einer Schule. */
export const FIXTURE_SOLUTION_RATES_COMPARISON_TABLE =
  authorityComparisons as AggregationsValueGroup[];

/** Schulamt und Land ohne Domäne, mit zwei Kompetenztypen. */
export const FIXTURE_SOLUTION_RATES_COMPARISON_TABLE_COMPETENCE_TYPES =
  competenceTypes as AggregationsValueGroup[];

/** Schulamt und Land mit demselben Code in zwei Kompetenztypen. */
export const FIXTURE_SOLUTION_RATES_COMPARISON_TABLE_READING_STYLES =
  readingStyles as AggregationsValueGroup[];

/** Hauptgruppe ohne Aggregationen. */
export const FIXTURE_SOLUTION_RATES_COMPARISON_TABLE_EMPTY = empty as AggregationsValueGroup[];
