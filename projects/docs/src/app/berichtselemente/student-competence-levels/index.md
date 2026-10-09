Zeigt für eine Person je Domäne die erreichte Kompetenzstufe. Mit Stufenkatalog erscheint sie in
einer Tabelle aller Stufen der Domäne.

{{ NgDocActions.demo("StudentCompetenceLevelsDemoComponent") }}

## Daten

Nimmt beliebige Value-Groups der `competence-levels`-Endpunkte, eine je Domäne derselben Person.
Genutzt werden `name` und `covariates` der ersten Value-Group, je Value-Group `subject.name` und
`domain.name` sowie der erste Eintrag von `competenceLevels` mit `nameShort`, `name`, `description`
und `classification`. Eine Value-Group mit leerem `competenceLevels` erscheint als „Ohne Teilnahme“.

## Verwendung

```html
{% raw %}
<tba3-student-competence-levels
  [competenceLevels]="valueGroups"
  [levelCatalog]="levelCatalog"
  [valueLabels]="{ 'gender.female': { label: 'weiblich' }, 'ses.C': { label: 'mittel' } }"
/>
{% endraw %}
```

- `competenceLevels: CompetenceLevelsValueGroup[]`: Value-Groups einer Person, eine je Domäne
- `levelCatalog:` [`CompetenceLevelDefinition[]`](/api/interfaces/tba3-elements/CompetenceLevelDefinition):
  alle Stufen, von schwach nach stark; ohne passenden Eintrag zeigt eine Karte nur die erreichte
  Stufe
- `valueLabels:` [`ValueLabels`](/api/type-aliases/tba3-elements/ValueLabels): Klartexte für die
  Merkmalswerte im Kopf
