Zeigt die Lösungsquote nach den Ausprägungen eines Merkmals, etwa des sozioökonomischen Status, im
Vergleich zu weiteren Gruppen. Darunter steht die Spannweite der Hauptgruppe.

{{ NgDocActions.demo("CovariateGradientDemoComponent") }}

## Daten

Nimmt beliebige Value-Groups der `aggregations`-Endpunkte. Genutzt werden `name`, `subject`,
`domain`, das Testheft und je Aggregation `type`, `value`, `description` sowie `mean` als
Lösungsquote und `total` als Personenzahl. Hat die Hauptgruppe mehrere Testhefte, zeigt das Element
einen Umschalter und Vergleiche nur aus dem gewählten Heft.

## Verwendung

```html
{% raw %}
<tba3-covariate-gradient
  [aggregations]="valueGroups"
  aggregationType="ses"
  [valueLabels]="{ 'ses.A': { label: 'sehr niedrig' }, 'booklet.DE-HSA': { label: 'Testheft HSA' } }"
/>
{% endraw %}
```

- `aggregations: AggregationsValueGroup[]`: Value-Groups, die erste ist die Hauptgruppe
- `aggregationType: string`: anzuzeigendes Merkmal, ohne Angabe das des ersten Eintrags
- `valueLabels:` [`ValueLabels`](/api/type-aliases/tba3-elements/ValueLabels): Anzeigetexte für
  Ausprägungen ohne `description`, für das Merkmal und für Testhefte
