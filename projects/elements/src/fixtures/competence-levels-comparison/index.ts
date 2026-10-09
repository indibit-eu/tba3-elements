import type { CompetenceLevelsValueGroup } from '../../lib/model';
import classComparison from './class-comparison.competence-levels.json';
import classWithYear from './class-with-year.competence-levels.json';
import classMixedSets from './class-mixed-sets.competence-levels.json';
import classDifferentSets from './class-different-sets.competence-levels.json';
import authorityStateCollision from './authority-state-collision.competence-levels.json';
import empty from './empty.competence-levels.json';

/** Klasse 8a mit zwei Domänen und vier Vergleichsgruppen, gleiche Stufenfolge. */
export const FIXTURE_COMPETENCE_LEVELS_COMPARISON = classComparison as CompetenceLevelsValueGroup[];

/** Klasse 8a mit dem Vorjahresdurchgang als Vergleich. */
export const FIXTURE_COMPETENCE_LEVELS_COMPARISON_WITH_YEAR =
  classWithYear as CompetenceLevelsValueGroup[];

/** Klasse 8a mit zwei Stufensets in einer Domäne. */
export const FIXTURE_COMPETENCE_LEVELS_COMPARISON_MIXED_SETS =
  classMixedSets as CompetenceLevelsValueGroup[];

/** Klasse 8a und Land mit verschiedenen Stufensets. */
export const FIXTURE_COMPETENCE_LEVELS_COMPARISON_DIFFERENT_SETS =
  classDifferentSets as CompetenceLevelsValueGroup[];

/** Schulamt und Land mit derselben `id`. */
export const FIXTURE_COMPETENCE_LEVELS_COMPARISON_ID_COLLISION =
  authorityStateCollision as CompetenceLevelsValueGroup[];

/** Hauptgruppe ohne Kompetenzstufen. */
export const FIXTURE_COMPETENCE_LEVELS_COMPARISON_EMPTY = empty as CompetenceLevelsValueGroup[];
