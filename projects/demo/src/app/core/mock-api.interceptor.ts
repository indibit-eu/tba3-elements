import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

/** Beantwortet `/api/…` aus `public/mock-api/`. Ein echter Host spricht stattdessen sein Backend. */
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  const url = new URL(req.urlWithParams, document.baseURI);
  if (!url.pathname.startsWith('/api/')) {
    return next(req);
  }
  return new Observable<HttpResponse<unknown>>((subscriber) => {
    resolve(url)
      .then((body) => {
        subscriber.next(new HttpResponse({ status: 200, url: req.url, body }));
        subscriber.complete();
      })
      .catch((error: unknown) => subscriber.error(error));
  });
};

interface MockValueGroup {
  id?: string;
  type?: string;
  name?: string;
  aggregations?: { type: string }[];
}

const TYPE_ORDER = ['student', 'group', 'school', 'district', 'authority', 'state'];

/** Unbekannte Typen gelten als gröbste Stufe. */
function typeRank(type: string | undefined): number {
  const index = TYPE_ORDER.indexOf(type ?? '');
  return index === -1 ? TYPE_ORDER.length : index;
}

/** Bloße `id` ohne Typpräfix, wie ein Backend über `comparison` und `filter` filtern würde. */
function groupKey(group: MockValueGroup): string {
  return group.id ?? group.name ?? '';
}

async function resolve(url: URL): Promise<MockValueGroup[]> {
  const segments = url.pathname.replace(/^\/api\//, '').split('/');
  const [context, id, endpoint] = segments;
  const params = url.searchParams;
  const filter = params.get('filter') ?? undefined;

  const filePath = filePathFor(context, id, endpoint, filter);
  let groups = await loadFile(filePath, url.pathname);

  groups = applyStudentFilter(groups, filter, params.get('comparison'));
  groups = applyTypeFilter(groups, params.get('type'));
  groups = applyComparisonFilter(groups, params.get('comparison'));
  groups = applyAggregationFilter(groups, params.get('aggregation'), endpoint);
  return groups;
}

function filePathFor(
  context: string,
  id: string,
  endpoint: string,
  filter: string | undefined,
): string {
  if (context === 'states' && filter?.startsWith('authority:')) {
    return `mock-api/states/${id}/authorities/${filter.slice('authority:'.length)}/${endpoint}.json`;
  }
  if (context === 'states' && filter?.startsWith('school:')) {
    return `mock-api/states/${id}/schools/${filter.slice('school:'.length)}/${endpoint}.json`;
  }
  return `mock-api/${context}/${id}/${endpoint}.json`;
}

async function loadFile(filePath: string, requestPath: string): Promise<MockValueGroup[]> {
  let response: Response;
  try {
    response = await fetch(new URL(filePath, document.baseURI));
  } catch {
    throw notFound(requestPath);
  }
  if (!response.ok) {
    throw notFound(requestPath);
  }
  const body: unknown = await response.json().catch(() => undefined);
  if (!Array.isArray(body)) {
    throw notFound(requestPath);
  }
  return body as MockValueGroup[];
}

function notFound(requestPath: string): HttpErrorResponse {
  return new HttpErrorResponse({
    status: 404,
    statusText: 'Not Found',
    url: requestPath,
    error: `Keine Mock-Datei für ${requestPath}.`,
  });
}

/** `filter=student-<id>`: die Person zuerst, dahinter die Hauptgruppe und die genannten Vergleiche. */
function applyStudentFilter(
  groups: MockValueGroup[],
  filter: string | undefined,
  comparison: string | null,
): MockValueGroup[] {
  if (!filter?.startsWith('student-')) {
    return groups;
  }
  const mainKey = groups.length ? groupKey(groups[0]) : '';
  const named = new Set(
    (comparison ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  );
  const person = groups.filter((group) => groupKey(group) === filter);
  const rest = groups.filter((group) => {
    const key = groupKey(group);
    return key !== filter && (key === mainKey || named.has(key));
  });
  return [...person, ...rest];
}

function applyTypeFilter(groups: MockValueGroup[], type: string | null): MockValueGroup[] {
  if (!type) {
    return groups;
  }
  const wanted = new Set(type.split(',').map((value) => value.trim()));
  return groups.filter((group) => wanted.has(group.type ?? ''));
}

/** Hauptgruppe und feiner getypte Teilgruppen bleiben, Vergleichsgruppen nur mit genannter `id`. */
function applyComparisonFilter(
  groups: MockValueGroup[],
  comparison: string | null,
): MockValueGroup[] {
  if (comparison === null || groups.length === 0) {
    return groups;
  }
  const wanted = new Set(comparison.split(',').map((value) => value.trim()));
  const mainKey = groupKey(groups[0]);
  const mainRank = typeRank(groups[0].type);
  return groups.filter((group) => {
    const key = groupKey(group);
    if (key === mainKey) return true;
    if (typeRank(group.type) < mainRank) return true;
    return wanted.has(key);
  });
}

function applyAggregationFilter(
  groups: MockValueGroup[],
  aggregation: string | null,
  endpoint: string,
): MockValueGroup[] {
  if (!aggregation || endpoint !== 'aggregations') {
    return groups;
  }
  const wanted = new Set(aggregation.split(',').map((value) => value.trim()));
  return groups
    .map((group) => ({
      ...group,
      aggregations: (group.aggregations ?? []).filter((entry) => wanted.has(entry.type)),
    }))
    .filter((group) => group.aggregations.length > 0);
}
