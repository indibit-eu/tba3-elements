import type { AggregationsValueGroup, CompetenceLevelsValueGroup } from '../../lib/model';
import schoolCompetenceLevels from './school.competence-levels.json';
import stateCompetenceLevels from './state.competence-levels.json';
import schoolMinimumClassification from './school.minimum-classification.aggregations.json';
import statesMinimumClassification from './states.minimum-classification.aggregations.json';
import schoolCompetence from './school.competence.aggregations.json';
import statesCompetence from './states.competence.aggregations.json';
import statesCovariates from './states.covariates.aggregations.json';

// Antworten eines Backends ohne `comparison`-Filter, aus denen ein Host zusammensetzt, was ein
// Element braucht. Land und Schulamt Nordmark tragen absichtlich dieselbe id `7`.

/** Schule, Vergleichsschulen und Kurse; die Schule trägt in Deutsch zwei Stufensets. */
export const FIXTURE_SCENARIO_SCHOOL_COMPETENCE_LEVELS =
  schoolCompetenceLevels as CompetenceLevelsValueGroup[];

export const FIXTURE_SCENARIO_STATE_COMPETENCE_LEVELS =
  stateCompetenceLevels as CompetenceLevelsValueGroup[];

export const FIXTURE_SCENARIO_SCHOOL_MINIMUM_CLASSIFICATION =
  schoolMinimumClassification as AggregationsValueGroup[];

export const FIXTURE_SCENARIO_STATES_MINIMUM_CLASSIFICATION =
  statesMinimumClassification as AggregationsValueGroup[];

export const FIXTURE_SCENARIO_SCHOOL_COMPETENCE = schoolCompetence as AggregationsValueGroup[];

export const FIXTURE_SCENARIO_STATES_COMPETENCE = statesCompetence as AggregationsValueGroup[];

export const FIXTURE_SCENARIO_STATES_COVARIATES = statesCovariates as AggregationsValueGroup[];
