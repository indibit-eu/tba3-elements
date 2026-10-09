Zeigt die höchsten und niedrigsten Lösungsquoten einer Gruppe als zwei Karten, mit Vergleichsgruppe
die Werte mit der größten Abweichung nach oben und unten.

{{ NgDocActions.demo("SolutionRatesRankingDemoComponent") }}

## Daten

Nimmt beliebige Value-Groups der `aggregations`-Endpunkte. Genutzt werden `type`, `id`, `name`,
`domain.name`, das Testheft und je Aggregation `type`, `value`, `description` und
`descriptiveStatistics.mean` als Lösungsquote. Alle Domänen beziehungsweise Kompetenztypen des
aktiven Testhefts werden gemeinsam gerankt.

## Verwendung

```html
{% raw %}
<tba3-solution-rates-ranking
  [aggregations]="valueGroups"
  comparison="state:7"
  [count]="3"
  [deviationThreshold]="5"
  [valueLabels]="{ 'Kompetenz.D1': { label: 'Sprechen und Zuhören' } }"
/>
{% endraw %}
```

- `aggregations: AggregationsValueGroup[]`: Value-Groups, die erste ist die Hauptgruppe
- `comparison: string`: anfangs gewählte Vergleichsgruppe als `typ:id`, ohne Angabe ohne Vergleich
- `count: number`: Einträge je Karte, Standard 3
- `deviationThreshold: number`: Prozentpunkte, ab denen die Δ-Pille eingefärbt wird, Standard 5
- `valueLabels:` [`ValueLabels`](/api/type-aliases/tba3-elements/ValueLabels): Testhefte
  (`booklet.<wert>`), Werte ohne `description` (`<art>.<wert>`) und Kompetenztypen
  (`aggregation.<art>`)
