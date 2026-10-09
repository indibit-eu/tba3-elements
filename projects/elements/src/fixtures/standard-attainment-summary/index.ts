import type { AggregationsValueGroup } from '../../lib/model';
import schoolWithComparisons from './school-with-comparisons.aggregations.json';
import schoolTwoSubjects from './school-two-subjects.aggregations.json';
import schoolNoComparison from './school-no-comparison.aggregations.json';
import empty from './empty.aggregations.json';

/** Schule mit Vergleichsschulen und Land im Fach Deutsch. */
export const FIXTURE_STANDARD_ATTAINMENT_SUMMARY =
  schoolWithComparisons as AggregationsValueGroup[];

/** Schule mit Deutsch und Mathematik, dazu das Land. */
export const FIXTURE_STANDARD_ATTAINMENT_SUMMARY_TWO_SUBJECTS =
  schoolTwoSubjects as AggregationsValueGroup[];

/** Schule ohne Vergleichsgruppe. */
export const FIXTURE_STANDARD_ATTAINMENT_SUMMARY_NO_COMPARISON =
  schoolNoComparison as AggregationsValueGroup[];

/** Hauptgruppe, deren Verteilung niemanden zählt. */
export const FIXTURE_STANDARD_ATTAINMENT_SUMMARY_EMPTY = empty as AggregationsValueGroup[];
