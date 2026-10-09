import type { AggregationsValueGroup } from '../../lib/model';
import type { ProfileColumn } from '../../lib/elements/solution-rates-profile/solution-rates-profile';
import classStudents from './class-students.aggregations.json';
import schoolGroups from './school-groups.aggregations.json';
import competenceTypes from './competence-types.aggregations.json';
import readingStyles from './reading-styles.aggregations.json';
import empty from './empty.aggregations.json';

/** Klasse 8a mit zwei Domänen, sechs Schüler:innen und dem Landesmittelwert als Vergleich. */
export const FIXTURE_SOLUTION_RATES_PROFILE = classStudents as AggregationsValueGroup[];

/** Schule mit drei Klassen, Vergleichsschulen und Landesmittelwert, nur Domäne Lesen. */
export const FIXTURE_SOLUTION_RATES_PROFILE_SCHOOL = schoolGroups as AggregationsValueGroup[];

/** Schule und Land ohne Domäne, mit den Kompetenztypen `Kompetenz` und `Domäne`. */
export const FIXTURE_SOLUTION_RATES_PROFILE_COMPETENCE_TYPES =
  competenceTypes as AggregationsValueGroup[];

/** Lerngruppe ohne Domäne, bei der derselbe Code in zwei Kompetenztypen vorkommt. */
export const FIXTURE_SOLUTION_RATES_PROFILE_READING_STYLES =
  readingStyles as AggregationsValueGroup[];

/** Hauptgruppe ohne Aggregationen. */
export const FIXTURE_SOLUTION_RATES_PROFILE_EMPTY = empty as AggregationsValueGroup[];

/** Schule und Klassen als Hauptspalten, Vergleichsschulen als Vergleichsspalte. */
export const EXAMPLE_PROFILE_COLUMNS_SCHOOL: ProfileColumn[] = [
  { key: 'school:school-birkenmoor', role: 'main' },
  { key: 'group:group-8a', role: 'main' },
  { key: 'group:group-8b', role: 'main' },
  { key: 'group:group-8c', role: 'main' },
  { key: 'school:school-faircomparison', role: 'comparison' },
];
