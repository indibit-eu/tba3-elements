/** Anzeigetexte für Werte der Antwort, Schlüssel der Form `typ.wert` wie `gender.male`. */
export type ValueLabels = Readonly<Record<string, { label: string; labelShort?: string }>>;

/** Vorrang: `description` aus der Antwort, dann `labels`, dann der Rohwert. */
export function resolveLabel(
  labels: ValueLabels | undefined,
  type: string,
  value: string,
  options: { description?: string; short?: boolean } = {},
): string {
  if (options.description) return options.description;
  const entry = labels?.[`${type}.${value}`];
  if (!entry) return value;
  if (options.short && entry.labelShort) return entry.labelShort;
  return entry.label;
}
