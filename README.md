# tba3-elements

Angular-Komponenten für Auswertungsdaten im [TBA-III-Format](https://github.com/indibit-eu/tba3):
Kompetenzstufen, Standarderreichung, Lösungsquoten und Übersichten für Lerngruppe, Schule, Schulamt
und Land. Jedes Element bekommt Value-Groups als Input und zeigt sie an.

## Installation

Das Paket liegt nicht auf npm, sondern als Datei an jedem
[GitHub-Release](https://github.com/indibit-eu/tba3-elements/releases):

```sh
npm install https://github.com/indibit-eu/tba3-elements/releases/download/v0.1.0/indibit-tba3-elements-0.1.0.tgz
```

## Verwendung

```ts
import { Component } from '@angular/core';
import { GroupsOverviewComponent } from '@indibit/tba3-elements';

@Component({
  selector: 'app-report',
  imports: [GroupsOverviewComponent],
  template: `<tba3-groups-overview
    [competenceLevels]="valueGroups"
    (groupSelected)="open($event)"
  />`,
})
export class ReportComponent {
  valueGroups = [];
  open(key: string) {}
}
```

## Entwicklung

```sh
npm install
npm run start:docs   # Doku mit Live-Demos
npm run start:demo   # Beispielbericht mit Mock-Daten
npm test
```

Mehr in [CONTRIBUTING.md](CONTRIBUTING.md).

## Lizenz

[MIT](LICENSE)
