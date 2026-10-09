Zeigt die Teilgruppen einer Ebene als sortierbare Tabelle mit Zusammensetzung und einer Kennzahl
zum Standard, darüber die übergeordneten Gruppen als feste Zeilen.

{{ NgDocActions.demo("SubgroupsTableDemoComponent") }}

## Daten

Nimmt beliebige Value-Groups der `aggregations`-Endpunkte. Genutzt werden `type`, `id`, `name`,
die Aggregation `minimumClassification` des ersten Fachs und die Kopfzahlen zur Zusammensetzung.

## Verwendung

```html
{% raw %}
<tba3-subgroups-table
  [aggregations]="valueGroups"
  [valueLabels]="{ 'gender.male': { label: 'Jungen' } }"
  [thresholds]="[60, 75, 85]"
  [upperRangeThresholds]="[20, 30, 40]"
  [deviationThreshold]="5"
  metric="upperRange"
  comparison="state:7"
  (rowSelected)="openGroup($event)"
/>
{% endraw %}
```

- `aggregations: AggregationsValueGroup[]`: Value-Groups, die erste ist die Hauptgruppe
- `valueLabels:` [`ValueLabels`](/api/type-aliases/tba3-elements/ValueLabels): Anzeigetexte
- `thresholds:` [`ScaleThresholds`](/api/type-aliases/tba3-elements/ScaleThresholds): Skala
  „Mindeststandard erreicht“ in Prozent, Standard `[60, 75, 85]`
- `upperRangeThresholds:` [`ScaleThresholds`](/api/type-aliases/tba3-elements/ScaleThresholds):
  Skala „Oberer Leistungsbereich“, ohne Angabe keine Skala
- `deviationThreshold: number`: Prozentpunkte, ab denen die Differenz wertet, Standard 5
- `metric: 'minimumReached' | 'upperRange' | 'distribution'`: anfangs gewählte Kennzahl
- `comparison: string`: anfangs gewählte Vergleichszeile als `typ:id`
- `rowSelected: string` (Output): angeklickte Gruppe als `typ:id`, nur mit Listener klickbar
