import type { AggregationsValueGroup } from '../../lib/model';
import regelfall from './regelfall.aggregations.json';
import participationGender from './participation-gender.aggregations.json';
import subjectBuckets from './subject-buckets.aggregations.json';
import subjects from './subjects.aggregations.json';
import empty from './empty.aggregations.json';

/** Klasse 8a mit Teilnahme, Geschlecht, Sprache und SES, dazu der Landesmittelwert als Vergleich. */
export const FIXTURE_COMPOSITION_SUMMARY = regelfall as AggregationsValueGroup[];

/** Klasse 8a nur mit Teilnahme und Geschlecht. */
export const FIXTURE_COMPOSITION_SUMMARY_PARTICIPATION_GENDER =
  participationGender as AggregationsValueGroup[];

/** Klasse 8a mit Kopfzahlen ohne Fach sowie je Fach für Deutsch und Mathematik. */
export const FIXTURE_COMPOSITION_SUMMARY_SUBJECT_BUCKETS =
  subjectBuckets as AggregationsValueGroup[];

/** Eine Schule mit Merkmalen, Klassenzahl und dem Mindeststandard je Fach. */
export const FIXTURE_COMPOSITION_SUMMARY_SUBJECTS = subjects as AggregationsValueGroup[];

/** Hauptgruppe ohne Aggregationen. */
export const FIXTURE_COMPOSITION_SUMMARY_EMPTY = empty as AggregationsValueGroup[];
