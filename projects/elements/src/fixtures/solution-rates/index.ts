import type { AggregationsValueGroup } from '../../lib/model';
import classCompetences from './class-competences.aggregations.json';
import classTwoBooklets from './class-two-booklets.aggregations.json';
import classExercises from './class-exercises.aggregations.json';
import competenceTypes from './competence-types.aggregations.json';
import readingStyles from './reading-styles.aggregations.json';
import empty from './empty.aggregations.json';

/** Klasse 8a mit zwei Domänen je vier Teilkompetenzen, Schule und Land als Vergleich. */
export const FIXTURE_SOLUTION_RATES = classCompetences as AggregationsValueGroup[];

/** Klasse 8a und Land mit zwei Testheften in einer Domäne. */
export const FIXTURE_SOLUTION_RATES_TWO_BOOKLETS = classTwoBooklets as AggregationsValueGroup[];

/** Klasse 8a mit fünf Aufgaben ohne Domäne, Land als Vergleich. */
export const FIXTURE_SOLUTION_RATES_EXERCISES = classExercises as AggregationsValueGroup[];

/** Schule und Land ohne Domäne, der Kompetenztyp steht in `aggregation.type`. */
export const FIXTURE_SOLUTION_RATES_COMPETENCE_TYPES = competenceTypes as AggregationsValueGroup[];

/** Lerngruppe mit demselben Code in zwei Aggregationsarten. */
export const FIXTURE_SOLUTION_RATES_READING_STYLES = readingStyles as AggregationsValueGroup[];

/** Hauptgruppe ohne Aggregationen. */
export const FIXTURE_SOLUTION_RATES_EMPTY = empty as AggregationsValueGroup[];

/** Fiktive Aufgabenlinks zu `FIXTURE_SOLUTION_RATES_EXERCISES`. */
export const EXAMPLE_SOLUTION_RATE_LINKS: Record<string, string> = {
  'exercise.Der Sommer am See': 'https://example.org/aufgaben/der-sommer-am-see',
  'exercise.Ein Brief an die Zukunft': 'https://example.org/aufgaben/ein-brief-an-die-zukunft',
  'exercise.Die Werkstatt': 'https://example.org/aufgaben/die-werkstatt',
  'exercise.Der lange Weg': 'https://example.org/aufgaben/der-lange-weg',
  'exercise.Sturm über der Stadt': 'https://example.org/aufgaben/sturm-ueber-der-stadt',
};
