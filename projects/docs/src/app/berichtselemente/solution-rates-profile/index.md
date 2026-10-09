Zeigt die Lösungsquoten je Teilkompetenz einer Gruppe als Tabelle neben Teil- und Vergleichsgruppen,
wahlweise als Abweichung vom Bezug oder auf einer absoluten Skala.

{{ NgDocActions.demo("SolutionRatesProfileDemoComponent") }}

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
  [thresholds]="[40, 55, 70]"
  scale="relative"
  [deviationThreshold]="5"
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
- `thresholds:` [`ScaleThresholds`](/api/type-aliases/tba3-elements/ScaleThresholds): Grenzen der
  absoluten Skala in Prozent, Standard `[40, 55, 70]`
- `scale: 'relative' | 'absolute'`: Abweichung von der ersten Vergleichsspalte oder absolute Skala
- `deviationThreshold: number`: Prozentpunkte, ab denen eine relative Zelle farbig wird, Standard 5
- `view: 'byDomain' | 'flat'`: in Blöcke gegliedert oder eine Tabelle
- `defaultSort: { column: number; direction: 'asc' | 'desc' }`: Sortierung nach einer Wertspalte
- `valueLabels:` [`ValueLabels`](/api/type-aliases/tba3-elements/ValueLabels): Anzeigetexte für
  Testhefte, Blocknamen und Zeilen ohne `description`
- `rowSelected: string` (Output): Schlüssel `type.value` der angeklickten Zeile
