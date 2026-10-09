Zeigt die Lösungsquoten einer Gruppe je Teilkompetenz oder Aufgabe als Balken, auf Wunsch mit
Vergleichsgruppen und deren Abweichung in Prozentpunkten.

{{ NgDocActions.demo("SolutionRatesDemoComponent") }}

## Daten

Nimmt beliebige Value-Groups der `aggregations`-Endpunkte. Genutzt werden `name`, `domain.name`,
das Testheft und je Aggregation `type`, `value`, `description` und `descriptiveStatistics` (`mean`
als Lösungsquote). Trägt eine Value-Group keine Domäne, bildet jede Aggregationsart einen eigenen
Block.

## Verwendung

```html
{% raw %}
<tba3-solution-rates
  [aggregations]="valueGroups"
  [comparisons]="['state:7']"
  [deviationThreshold]="5"
  [links]="{ 'exercise.Der Sommer am See': 'https://example.org/aufgaben/1' }"
  [valueLabels]="{ 'booklet.DE-HSA': { label: 'Deutsch, Hauptschule' } }"
/>
{% endraw %}
```

- `aggregations: AggregationsValueGroup[]`: Value-Groups, die erste ist die Hauptgruppe
- `comparisons: string[]`: anfangs eingeblendete Vergleiche als `typ:id`
- `deviationThreshold: number`: Prozentpunkte, ab denen die Δ-Pille wertet, Standard 5
- `links: Record<string, string>`: URL je Aggregationswert, Schlüssel `typ.wert`
- `valueLabels:` [`ValueLabels`](/api/type-aliases/tba3-elements/ValueLabels): Klartexte für
  Testhefte, Aggregationswerte ohne `description` und Aggregationsarten
