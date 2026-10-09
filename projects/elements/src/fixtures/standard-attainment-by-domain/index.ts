import type { AggregationsValueGroup, CompetenceLevelsValueGroup } from '../../lib/model';
import schoolTwoSubjects from './school-two-subjects.competence-levels.json';
import schoolTwoSubjectsTotals from './school-two-subjects.aggregations.json';
import schoolWithComparison from './school-with-comparison.competence-levels.json';
import schoolWithComparisonTotals from './school-with-comparison.aggregations.json';
import schoolTwoSets from './school-two-sets.competence-levels.json';
import empty from './empty.competence-levels.json';

/** Schule mit zwei Fächern und je zwei Domänen. */
export const FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN =
  schoolTwoSubjects as CompetenceLevelsValueGroup[];

/** Fachweite `minimumClassification`-Aggregationen derselben Schule. */
export const FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN_TOTALS =
  schoolTwoSubjectsTotals as AggregationsValueGroup[];

/** Schule und Landesmittelwert im Fach Deutsch. */
export const FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN_WITH_COMPARISON =
  schoolWithComparison as CompetenceLevelsValueGroup[];

/** Fachweite Aggregationen von Schule und Landesmittelwert in Deutsch. */
export const FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN_WITH_COMPARISON_TOTALS =
  schoolWithComparisonTotals as AggregationsValueGroup[];

/** Schule mit zwei Stufensets in einer Domäne. */
export const FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN_TWO_SETS =
  schoolTwoSets as CompetenceLevelsValueGroup[];

/** Hauptgruppe ohne Kompetenzstufen. */
export const FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN_EMPTY = empty as CompetenceLevelsValueGroup[];
