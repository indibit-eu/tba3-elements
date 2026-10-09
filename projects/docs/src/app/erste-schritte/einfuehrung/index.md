`@indibit/tba3-elements` ist eine Sammlung von Angular-Komponenten für Auswertungsdaten im
[TBA-III-Format](https://github.com/indibit-eu/tba3). Jedes Element bekommt Value-Groups als Input
und zeigt sie an. Eigene Abrufe macht es nicht.

## Installation

Das Paket liegt nicht auf npm, sondern als Datei an jedem
[GitHub-Release](https://github.com/indibit-eu/tba3-elements/releases):

```sh
npm install https://github.com/indibit-eu/tba3-elements/releases/download/v0.1.0/indibit-tba3-elements-0.1.0.tgz
```

Der Host braucht Angular, Bootstrap 5, ngx-echarts und FontAwesome Free. Das Theme bindest du nach
Bootstrap in dein globales Stylesheet ein:

```scss
@use 'bootstrap/scss/bootstrap';
@use '@indibit/tba3-elements/styles/theme';
@use '@indibit/tba3-elements/styles/tables';
@use '@indibit/tba3-elements/styles/charts';
```

## Grundregeln

- Die erste Value-Group ist die Hauptgruppe, die weiteren sind Vergleiche. Value-Groups einer
  feineren Ebene (etwa Klassen einer Schule) sind Teilgruppen.
- Eine Gruppe ist durch `type` und `id` bestimmt. Inputs und Outputs nennen sie `typ:id`, zum
  Beispiel `state:7`. Ohne `id` tritt der `name` an ihre Stelle.
- Mehrere Value-Groups einer Gruppe stehen für ihre Domänen, Fächer oder Stufensets. Bei
  verschiedenen Stufensets zeigen die Elemente Classifications statt Stufen.
- Lösungsquoten sind nur innerhalb eines Testhefts vergleichbar. Das Heft steht als `booklet` in
  `properties` oder als Kovariate. Bei mehreren Heften erscheint ein Umschalter.
- Anzeigetexte für Werte kommen über `valueLabels` mit Schlüsseln der Form `typ.wert`, zum Beispiel
  `gender.male`.
- Fehlen Daten, zeigt das Element einen Hinweis.

## Titel und Fußnote

```html
<tba3-competence-levels-distribution [competenceLevels]="valueGroups">
  <h3 tba3Header>Kompetenzstufen</h3>
  <p tba3Footer>Quelle: Vergleichsarbeit 2025</p>
</tba3-competence-levels-distribution>
```

## Farben

Alle Farben sind CSS-Variablen `--tba3-*` auf `:root` und lassen sich im Host überschreiben. Die
Hauptgruppe nutzt `--tba3-focus`. Setz sie auf die Primärfarbe deiner Anwendung, etwa
`--tba3-focus: var(--bs-primary)`.
