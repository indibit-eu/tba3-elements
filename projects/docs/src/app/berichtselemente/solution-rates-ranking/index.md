Zeigt die stärksten und schwächsten Lösungsquoten einer Gruppe als zwei Karten. Das Bezugssystem
`scale` legt fest, ob relativ nach der Abweichung zu einer Vergleichsgruppe oder absolut nach der
Lösungsquote gerankt wird.

{{ NgDocActions.demo("SolutionRatesRankingRelativeDemoComponent") }}

{{ NgDocActions.demo("SolutionRatesRankingAbsoluteDemoComponent") }}

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
  [scale]="{ mode: 'relative', threshold: 5 }"
  comparison="state:7"
  [count]="3"
  [valueLabels]="{ 'Kompetenz.D1': { label: 'Sprechen und Zuhören' } }"
/>
{% endraw %}
```

- `aggregations: AggregationsValueGroup[]`: Value-Groups, die erste ist die Hauptgruppe
- `scale:` [`RankingScale`](/api/type-aliases/tba3-elements/RankingScale): Bezugssystem, relativ nach
  Abweichung oder absolut nach Lösungsquote, Standard `{ mode: 'relative', threshold: 5 }`
- `comparison: string`: anfangs gewählte Vergleichsgruppe als `typ:id`, relativ sonst die erste
- `count: number`: Einträge je Karte, Standard 3
- `valueLabels:` [`ValueLabels`](/api/type-aliases/tba3-elements/ValueLabels): Testhefte
  (`booklet.<wert>`), Werte ohne `description` (`<art>.<wert>`) und Kompetenztypen
  (`aggregation.<art>`)
