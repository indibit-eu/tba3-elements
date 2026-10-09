Zeigt je Fach und Domäne den Anteil, der den Mindeststandard erreicht, als Donut mit drei
Segmenten. Optional steht je Fach eine Karte „Fach gesamt“ vorn.

{{ NgDocActions.demo("StandardAttainmentByDomainDemoComponent") }}

## Daten

Nimmt beliebige Value-Groups der `competence-levels`- und `aggregations`-Endpunkte. Genutzt werden
`subject.name`, `domain.name` und je Stufe `classification` und `descriptiveStatistics`, aus den
Aggregationen die Einträge `minimumClassification`. Dargestellt wird nur die Hauptgruppe, mehrere
Stufensets einer Domäne fasst das Element über die Classifications zu einem Donut zusammen.

## Verwendung

```html
{% raw %}
<tba3-standard-attainment-by-domain
  [competenceLevels]="valueGroups"
  [aggregations]="subjectTotals"
/>
{% endraw %}
```

- `competenceLevels: CompetenceLevelsValueGroup[]`: Value-Groups, die erste ist die Hauptgruppe
- `aggregations: AggregationsValueGroup[]`: fachweite Werte für die Karte „Fach gesamt“, ohne sie
  entfällt die Karte
