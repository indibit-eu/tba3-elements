# Mitwirken

Issues und Pull Requests sind willkommen. Größere Änderungen besprich bitte vorher in einem Issue.

## Aufbau

- `projects/elements`: die Bibliothek `@indibit/tba3-elements` mit Elementen, Theme und Fixtures
- `projects/docs`: Doku mit Live-Demos (ng-doc)
- `projects/demo`: Beispielbericht mit Mock-Daten

## Befehle

```sh
npm run generate:model      # Typen aus tba3-spec.yml und tba3-spec.patches.yml erzeugen
npm run build:lib
npm run start:docs
npm run start:demo
npm test
npm run validate:fixtures   # Fixtures und Mock-Daten gegen die Spec prüfen
npm run format:check
```

## Regeln für Elemente

- Standalone-Komponente mit `OnPush` und Präfix `tba3-`, exportiert über `public-api.ts`.
- Daten kommen nur über Inputs im Format der Spec. Keine HTTP-Aufrufe.
- Fehlende Daten führen zu einem Hinweis, nie zu einem Fehler.
- Bootstrap-Klassen statt eigenem CSS. Farben nur über die Variablen `--tba3-*`.
- Je Element Fixtures unter `projects/elements/src/fixtures/<element>/`, ein Test und eine
  Doku-Seite mit einer Demo.
- Kommentare nur, wo ein „Warum“ nicht aus dem Code hervorgeht.

## Spec

`tba3-spec.yml` ist eine Kopie der TBA-III-Spezifikation. `tba3-spec.patches.yml` enthält
vorgeschlagene Ergänzungen. Fließen sie in die Spezifikation zurück, schrumpft die Datei.

## Release

Version in `projects/elements/package.json` erhöhen, committen und einen passenden Tag pushen, etwa
`v0.2.0`. Die Action baut das Paket und hängt es an das GitHub-Release.
