import type { CompetenceLevelsValueGroup } from '../../lib/model';
import classTwoDomains from './class-two-domains.competence-levels.json';
import classWithComparison from './class-with-comparison.competence-levels.json';
import schoolTwoSets from './school-two-sets.competence-levels.json';
import empty from './empty.competence-levels.json';

/** Klasse 8a in Deutsch mit den Domänen Lesen und Orthografie. */
export const FIXTURE_COMPETENCE_LEVELS_DISTRIBUTION =
  classTwoDomains as CompetenceLevelsValueGroup[];

/** Klasse 8a und Landesmittelwert in der Domäne Lesen. */
export const FIXTURE_COMPETENCE_LEVELS_DISTRIBUTION_WITH_COMPARISON =
  classWithComparison as CompetenceLevelsValueGroup[];

/** Schule mit zwei Stufensets in derselben Domäne. */
export const FIXTURE_COMPETENCE_LEVELS_DISTRIBUTION_TWO_SETS =
  schoolTwoSets as CompetenceLevelsValueGroup[];

/** Value-Group ohne Kompetenzstufen. */
export const FIXTURE_COMPETENCE_LEVELS_DISTRIBUTION_EMPTY = empty as CompetenceLevelsValueGroup[];
