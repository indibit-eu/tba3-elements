import type { Classification } from './classification';

/** Eine Stufe des Katalogs, aus dem ein Element auch die nicht erreichten Stufen zeigt. */
export interface CompetenceLevelDefinition {
  /** Kürzel wie `III`, verbindet den Eintrag mit der erreichten Stufe. */
  nameShort: string;
  name?: string;
  /** Was auf dieser Stufe gekonnt wird. */
  description?: string;
  /** Bestimmt die Farbe. */
  classification?: Classification;
  /** Leer heißt: gilt für alle Fächer. */
  subject?: string;
  /** Leer heißt: gilt für alle Domänen des Fachs. */
  domain?: string;
}

/** Einträge der spezifischsten Ebene (Domäne, Fach, global); Ebenen werden nicht gemischt. */
export function catalogFor(
  catalog: readonly CompetenceLevelDefinition[],
  subject: string | undefined,
  domain: string | undefined,
): CompetenceLevelDefinition[] {
  const exact = catalog.filter(
    (entry) => entry.domain !== undefined && entry.domain === domain && entry.subject === subject,
  );
  if (exact.length > 0) return exact;

  const subjectWide = catalog.filter(
    (entry) =>
      entry.domain === undefined && entry.subject !== undefined && entry.subject === subject,
  );
  if (subjectWide.length > 0) return subjectWide;

  return catalog.filter((entry) => entry.subject === undefined && entry.domain === undefined);
}
