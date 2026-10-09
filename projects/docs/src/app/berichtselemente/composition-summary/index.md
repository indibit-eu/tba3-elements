Zeigt die Zusammensetzung einer Gruppe als Kartenreihe: Anmeldungen, Teilnahmequote, je Merkmal
einen Donut und den Anteil „Mindeststandard erreicht“ je Fach.

{{ NgDocActions.demo("CompositionSummaryDemoComponent") }}

## Daten

Nimmt beliebige Value-Groups der `aggregations`-Endpunkte. Genutzt werden von der Hauptgruppe die
Kopfzahlen zu Teilnahme, angemeldeten Einheiten und Merkmalen sowie `minimumClassification` je Fach,
jeweils mit `type`, `value`, `description`, `total` und `frequency`. Jedes Merkmal mit mehr als einer
Ausprägung wird ein Donut, beim sozioökonomischen Status mit Median. Die Sprache zu Hause fasst das
Element zu Deutsch und „andere“ zusammen.

## Verwendung

```html
{% raw %}
<tba3-composition-summary
  [aggregations]="valueGroups"
  [subject]="'Mathematik'"
  [valueLabels]="{
    'aggregation.students-by-gender': { label: 'Geschlecht' },
    'unit.students': { label: 'Kinder' }
  }"
/>
{% endraw %}
```

- `aggregations: AggregationsValueGroup[]`: Value-Groups, die erste ist die Hauptgruppe
- `subject: string`: Fach, auf das Fachbalken und Zusammensetzung eingegrenzt werden; ohne den
  Input je Fach ein Balken
- `valueLabels:` [`ValueLabels`](/api/type-aliases/tba3-elements/ValueLabels): Kartentitel
  (`aggregation.<art>`), Ausprägungen ohne `description` und gezählte Einheiten (`unit.<einheit>`);
  ohne Kartentitel erscheint die Aggregationsart
