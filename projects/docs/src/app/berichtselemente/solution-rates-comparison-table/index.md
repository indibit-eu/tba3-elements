Vergleicht die Lösungsquoten je Teilkompetenz einer Gruppe mit Vergleichsgruppen in einer Tabelle.

{{ NgDocActions.demo("SolutionRatesComparisonTableDemoComponent") }}

## Daten

Nimmt beliebige Value-Groups der `aggregations`-Endpunkte. Genutzt werden `name`, `domain.name`,
das Testheft und je Aggregation `type`, `value`, `description` und `descriptiveStatistics.mean`.

## Verwendung

```html
{% raw %}
<tba3-solution-rates-comparison-table
  [aggregations]="valueGroups"
  [deltas]="['state:7', 'group:year-2024']"
  [deviationThreshold]="5"
  view="flat"
  [defaultSort]="{ column: 'competence', direction: 'asc' }"
  [valueLabels]="{ 'Kompetenz.D1': { label: 'Sprechen und Zuhören' } }"
  (rowSelected)="openCompetence($event)"
/>
{% endraw %}
```

- `aggregations: AggregationsValueGroup[]`: Value-Groups, die erste ist die Hauptgruppe
- `deltas: string[]`: Vergleichsgruppen als `typ:id` mit Δ-Spalte, sonst die erste
- `deviationThreshold: number`: Prozentpunkte, ab denen ein Δ farbig wertet, Standard 5
- `view: 'byDomain' | 'flat'`: Startansicht, je Domäne oder Aggregationsart eine Tabelle oder flach
- `defaultSort: { column: string; direction: 'asc' | 'desc' }`: Startsortierung nach `competence`,
  `value:typ:id` oder `delta:typ:id`; ohne Angabe aufsteigend nach der ersten Δ-Spalte
- `valueLabels:` [`ValueLabels`](/api/type-aliases/tba3-elements/ValueLabels): Anzeigetexte für
  Testhefte, Aggregationsarten und Zeilen ohne `description`
- `rowSelected: string` (Output): Schlüssel `type.value` der angeklickten Zeile
