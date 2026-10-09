Zeigt je Fach drei Kennzahlkarten zur Standarderreichung: Mindeststandard erreicht, unter
Mindeststandard und oberer Leistungsbereich, jeweils mit der Differenz zu den Vergleichsgruppen.

{{ NgDocActions.demo("StandardAttainmentSummaryDemoComponent") }}

## Daten

Nimmt beliebige Value-Groups der `aggregations`-Endpunkte. Genutzt werden `name`, `subject.name`
und je Aggregation der Art `minimumClassification` `value` und `descriptiveStatistics`, je Gruppe
und Fach eine Value-Group. Value-Groups anderer Aggregationsart übergeht das Element, auch bei der
Wahl der Hauptgruppe.

## Verwendung

```html
{% raw %}
<tba3-standard-attainment-summary [aggregations]="valueGroups" [deviationThreshold]="5" />
{% endraw %}
```

- `aggregations: AggregationsValueGroup[]`: Value-Groups, die erste ist die Hauptgruppe
- `deviationThreshold: number`: Prozentpunkte, ab denen eine Differenz farbig wertet, Standard 5
