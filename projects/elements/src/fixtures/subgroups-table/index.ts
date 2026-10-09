import type { AggregationsValueGroup } from '../../lib/model';
import authority from './authority.aggregations.json';
import state from './state.aggregations.json';
import noParts from './no-parts.aggregations.json';
import participation from './participation.aggregations.json';
import empty from './empty.aggregations.json';

/** Schulamt Nordmark mit fünf Schulen, Beispielland als Vergleich. */
export const FIXTURE_SUBGROUPS_TABLE_AUTHORITY = authority as AggregationsValueGroup[];

/** Beispielland mit vier Schulämtern. */
export const FIXTURE_SUBGROUPS_TABLE_STATE = state as AggregationsValueGroup[];

/** Schulamt Nordmark und Beispielland ohne Teilgruppen. */
export const FIXTURE_SUBGROUPS_TABLE_NO_PARTS = noParts as AggregationsValueGroup[];

/** Schulamt Nordmark mit zwei Schulen und Teilnahme-Kopfzahlen. */
export const FIXTURE_SUBGROUPS_TABLE_PARTICIPATION = participation as AggregationsValueGroup[];

/** Hauptgruppe ohne Aggregationen. */
export const FIXTURE_SUBGROUPS_TABLE_EMPTY = empty as AggregationsValueGroup[];
