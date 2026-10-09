Zeigt je Person und Teilkompetenz die Lösungsquote. Das Bezugssystem legt `scale` fest: relativ als
Differenz zu einer Vergleichsgruppe (Standard) oder absolut auf einer Prozentskala.

{{ NgDocActions.demo("SolutionRatesHeatmapDemoComponent") }}

{{ NgDocActions.demo("SolutionRatesHeatmapAbsoluteDemoComponent") }}

## Daten

Nimmt beliebige Value-Groups der `aggregations`-Endpunkte. Genutzt werden `type`, `id`, `name` und
je Aggregation `type`, `value`, `description` und `descriptiveStatistics.mean`. Value-Groups mit
feinerem Typ als die Hauptgruppe werden Personenzeilen, solche mit gröberem Vergleichsgruppen. In
der absoluten Darstellung bleiben die Vergleichsgruppen ungenutzt.

## Verwendung

```html
{% raw %}
<tba3-solution-rates-heatmap
  [aggregations]="valueGroups"
  [scale]="{ mode: 'relative', thresholds: [-10, -5, 5] }"
  cellValues="all"
  [valueLabels]="{ 'competence.1.1.2': { label: 'Grundrechenarten' } }"
  [links]="{ 'competence.1.1.2': 'https://example.org/aufgaben/1.1.2' }"
  (columnSelected)="openCompetence($event)"
  (studentsSelected)="markStudents($event)"
/>
{% endraw %}
```

- `aggregations: AggregationsValueGroup[]`: Value-Groups, die erste ist die Hauptgruppe
- `scale:` [`HeatmapScale`](/api/type-aliases/tba3-elements/HeatmapScale): Bezugssystem relativ oder
  absolut, Standard `{ mode: 'relative', thresholds: [-10, -5, 5] }`
- `cellValues: 'none' | 'reference' | 'all'`: Zellen mit Zahl, Standard Vergleich und Klassenmittel
- `valueLabels:` [`ValueLabels`](/api/type-aliases/tba3-elements/ValueLabels): Spaltentitel für
  Teilkompetenzen ohne `description`
- `links: Record<string, string>`: Link je Teilkompetenz (`typ.wert`), nicht mit `columnSelected`
- `columnSelected: string` (Output): `value` der geklickten Teilkompetenz, nur mit Listener klickbar
- `studentsSelected: string[]` (Output): markierte Personen als `typ:id`, Checkbox nur mit Listener
