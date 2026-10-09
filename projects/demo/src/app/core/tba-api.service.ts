import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, catchError, of } from 'rxjs';
import type { AggregationsValueGroup, CompetenceLevelsValueGroup } from '@indibit/tba3-elements';

export type ApiContext = 'groups' | 'schools' | 'states';

export interface ApiParams {
  type?: string;
  comparison?: string;
  filter?: string;
  aggregation?: string;
}

/** Fehler werden zu einem leeren Array, damit die Elemente ihren Leerzustand zeigen. */
@Injectable({ providedIn: 'root' })
export class TbaApiService {
  private readonly http = inject(HttpClient);

  competenceLevels$(
    context: ApiContext,
    id: string,
    params: ApiParams = {},
  ): Observable<CompetenceLevelsValueGroup[]> {
    return this.http
      .get<CompetenceLevelsValueGroup[]>(`/api/${context}/${id}/competence-levels`, {
        params: toHttpParams(params),
      })
      .pipe(catchError(() => of([])));
  }

  aggregations$(
    context: ApiContext,
    id: string,
    params: ApiParams = {},
  ): Observable<AggregationsValueGroup[]> {
    return this.http
      .get<AggregationsValueGroup[]>(`/api/${context}/${id}/aggregations`, {
        params: toHttpParams(params),
      })
      .pipe(catchError(() => of([])));
  }

  competenceLevels(
    context: ApiContext,
    id: string,
    params: ApiParams = {},
  ): Signal<CompetenceLevelsValueGroup[]> {
    return toSignal(this.competenceLevels$(context, id, params), { initialValue: [] });
  }

  aggregations(
    context: ApiContext,
    id: string,
    params: ApiParams = {},
  ): Signal<AggregationsValueGroup[]> {
    return toSignal(this.aggregations$(context, id, params), { initialValue: [] });
  }
}

function toHttpParams(params: ApiParams): HttpParams {
  let httpParams = new HttpParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      httpParams = httpParams.set(key, value);
    }
  }
  return httpParams;
}
