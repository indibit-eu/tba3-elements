Zeigt die Lerngruppen einer Schule mit ihrer Kompetenzstufenverteilung je Fach und Domäne,
gegliedert nach Lerngruppe oder nach Fach, optional mit Donuts zu Geschlecht und Teilnahme.

{{ NgDocActions.demo("GroupsOverviewDemoComponent") }}

## Daten

Nimmt beliebige Value-Groups der `competence-levels`-Endpunkte und für die Donuts optional der
`aggregations`-Endpunkte. Genutzt werden `type`, `id`, `name`, `subject.name`, `domain.name`, je
Stufe `nameShort`, `classification` und `descriptiveStatistics` sowie die Aggregationen
`students-by-gender` und `students-by-participation` je Lerngruppe und Fach. Trägt eine Lerngruppe
in einer Domäne mehrere Stufensets, zeigt das Element Classifications statt Stufen.

## Verwendung

```html
{% raw %}
<tba3-groups-overview
  [competenceLevels]="valueGroups"
  [aggregations]="aggregations"
  groupBy="subject"
  [valueLabels]="{ 'aggregation.students-by-gender': { label: 'Geschlecht' } }"
  (groupSelected)="openGroup($event)"
/>
{% endraw %}
```

- `competenceLevels: CompetenceLevelsValueGroup[]`: Value-Groups, die erste ist die Schule, die
  Lerngruppen folgen
- `aggregations: AggregationsValueGroup[]`: Geschlecht und Teilnahme je Lerngruppe und Fach
- `groupBy: 'group' | 'subject'`: anfängliche Gliederung, Standard `'group'`
- `valueLabels:` [`ValueLabels`](/api/type-aliases/tba3-elements/ValueLabels): Anzeigetexte für
  Merkmalsausprägungen und Bildunterschriften der Donuts
- `groupSelected: string` (Output): gewählte Lerngruppe als `typ:id`
