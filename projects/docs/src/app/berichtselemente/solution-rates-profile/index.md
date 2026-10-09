Zeigt die Lösungsquoten je Teilkompetenz einer Gruppe als Tabelle neben Teil- und Vergleichsgruppen,
relativ zum Bezug der ersten Vergleichsspalte oder auf einer absoluten Skala, je nach Konfiguration.

{{ NgDocActions.demo("SolutionRatesProfileDemoComponent") }}

{{ NgDocActions.demo("SolutionRatesProfileAbsoluteDemoComponent") }}

## Daten

Nimmt beliebige Value-Groups der `aggregations`-Endpunkte. Genutzt werden `name`, `domain.name`, das
Testheft und je Aggregation `type`, `value`, `description` und `descriptiveStatistics.mean` als
Lösungsquote. Trägt eine Value-Group keine Domäne, bildet jeder Aggregationstyp einen eigenen Block.

## Verwendung

```html
{% raw %}
<tba3-solution-rates-profile
  [aggregations]="valueGroups"
  [columns]="[{ key: 'group:8a', role: 'main' }, { key: 'state:7', role: 'comparison' }]"
  [scale]="{ mode: 'relative', threshold: 5 }"
  view="byDomain"
  [defaultSort]="{ column: 0, direction: 'desc' }"
  [valueLabels]="{ 'Kompetenz.D1': { label: 'Sprechen und Zuhören' } }"
  (rowSelected)="openCompetence($event)"
/>
{% endraw %}
```

- `aggregations: AggregationsValueGroup[]`: Value-Groups, die erste ist die Hauptgruppe
- `columns:` [`ProfileColumn[]`](/api/interfaces/tba3-elements/ProfileColumn): Spalten mit Rolle,
  ohne Angabe alle Gruppen der Antwort
- `scale:` [`SolutionRatesScale`](/api/type-aliases/tba3-elements/SolutionRatesScale): relativ zum
  Bezug oder absolute Skala, Standard `{ mode: 'relative', threshold: 5 }`
- `view: 'byDomain' | 'flat'`: in Blöcke gegliedert oder eine Tabelle
- `defaultSort: { column: number; direction: 'asc' | 'desc' }`: Sortierung nach einer Wertspalte
- `valueLabels:` [`ValueLabels`](/api/type-aliases/tba3-elements/ValueLabels): Anzeigetexte für
  Testhefte, Blocknamen und Zeilen ohne `description`
- `rowSelected: string` (Output): Schlüssel `type.value` der angeklickten Zeile
