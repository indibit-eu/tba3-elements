import type { AggregationsValueGroup } from '../../lib/model';
import schoolSes from './school-ses.aggregations.json';
import schoolSesDomains from './school-ses-domains.aggregations.json';
import schoolGenderLanguage from './school-gender-language.aggregations.json';
import schoolTwoBooklets from './school-two-booklets.aggregations.json';
import empty from './empty.aggregations.json';

/** Schule mit fünf SES-Ausprägungen und zwei Vergleichsgruppen. */
export const FIXTURE_COVARIATE_GRADIENT = schoolSes as AggregationsValueGroup[];

/** Schule und Land mit der SES-Aufschlüsselung je für zwei Domänen. */
export const FIXTURE_COVARIATE_GRADIENT_DOMAINS = schoolSesDomains as AggregationsValueGroup[];

/** Schule und Land mit den Merkmalen `gender` und `languageAtHome` in einer Value-Group. */
export const FIXTURE_COVARIATE_GRADIENT_GENDER_LANGUAGE =
  schoolGenderLanguage as AggregationsValueGroup[];

/** Schule und Land mit der SES-Aufschlüsselung je für zwei Testhefte. */
export const FIXTURE_COVARIATE_GRADIENT_TWO_BOOKLETS =
  schoolTwoBooklets as AggregationsValueGroup[];

/** Hauptgruppe ohne Aggregationen. */
export const FIXTURE_COVARIATE_GRADIENT_EMPTY = empty as AggregationsValueGroup[];
