Vergleicht die Kompetenzstufenverteilung einer Gruppe mit Vergleichsgruppen, je Domäne als
gestapeltes Säulendiagramm oder als Differenz in Prozentpunkten.

{{ NgDocActions.demo("CompetenceLevelsComparisonDemoComponent") }}

## Daten

Nimmt beliebige Value-Groups der `competence-levels`-Endpunkte. Genutzt werden `name`,
`domain.name` und je Stufe `nameShort`, `classification` und `descriptiveStatistics`. Tragen alle
Säulen einer Domäne dasselbe Stufenset, stapelt das Element nach Stufen, sonst nach
Classifications.

## Verwendung

```html
{% raw %}
<tba3-competence-levels-comparison
  [competenceLevels]="valueGroups"
  [comparisons]="['state:7']"
  [deviationThreshold]="5"
/>
{% endraw %}
```

- `competenceLevels: CompetenceLevelsValueGroup[]`: Value-Groups, die erste ist die Hauptgruppe
- `comparisons: string[]`: anfangs eingeblendete Vergleiche als `typ:id`
- `deviationThreshold: number`: Prozentpunkte, ab denen die Differenz wertet, Standard 5
