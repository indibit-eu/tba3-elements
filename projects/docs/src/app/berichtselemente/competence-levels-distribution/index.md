Zeigt je Gruppe und Domäne, wie viele Teilnehmende jede Kompetenzstufe erreichen, dazu die Zahl mit
Optimalstandard, den Anteil mit erreichtem Mindeststandard und die Zahl unter Mindeststandard.

{{ NgDocActions.demo("CompetenceLevelsDistributionDemoComponent") }}

## Daten

Nimmt beliebige Value-Groups der `competence-levels`-Endpunkte. Genutzt werden `name`,
`subject.name`, `domain.name` und je Stufe `nameShort`, `classification` und
`descriptiveStatistics`. Jede Value-Group wird ein eigener Block, es gibt keine Hauptgruppe. Trägt
eine Gruppe in einer Domäne mehrere Stufensets, zeigt das Element statt der Stufen die
Classifications.

## Verwendung

```html
{% raw %}
<tba3-competence-levels-distribution [competenceLevels]="valueGroups" />
{% endraw %}
```

- `competenceLevels: CompetenceLevelsValueGroup[]`: Value-Groups, je Gruppe und Domäne ein Block
