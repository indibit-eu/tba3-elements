Zeigt die Ergebnisse einer Lerngruppe als sortierbare Tabelle mit einer Zeile je Person: Merkmale,
Statusmarker und je Domäne die erreichte Stufe, optional mit mittlerer Lösungsquote.

{{ NgDocActions.demo("GroupResultsTableDemoComponent") }}

## Daten

Nimmt beliebige Value-Groups der `competence-levels`- und `aggregations`-Endpunkte. Genutzt werden
`name`, `domain.name`, `covariates` und der erste Eintrag von `competenceLevels` mit `nameShort`,
`name` und `classification`, bei den Aggregationen `value` und `descriptiveStatistics.mean` der
Domänen-Aggregation. Eine Value-Group mit leerem `competenceLevels` gilt als Nicht-Teilnahme.

## Verwendung

```html
{% raw %}
<tba3-group-results-table
  [competenceLevels]="valueGroups"
  [aggregations]="domainAverages"
  [valueLabels]="{ 'gender.female': { label: 'weiblich', labelShort: 'w' } }"
  (personSelected)="openStudent($event)"
/>
{% endraw %}
```

- `competenceLevels: CompetenceLevelsValueGroup[]`: Value-Groups, die erste ist die Lerngruppe, die
  feineren die Personen
- `aggregations: AggregationsValueGroup[]`: Lösungsquoten je Person und Domäne; ohne sie entfallen
  die Ø-Spalten und die Zeile „Mittel der Personenwerte“
- `valueLabels:` [`ValueLabels`](/api/type-aliases/tba3-elements/ValueLabels): Anzeigetexte für
  Merkmalswerte, bevorzugt `labelShort`
- `personSelected: string` (Output): Schlüssel `typ:id` der Person, deren Name angeklickt wurde
