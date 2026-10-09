# Mock-API der Demo

Spec-konforme Antworten für den Demo-Bericht. Alle Namen sind erfunden. Die Dateien sind generiert
und werden nicht von Hand geändert.

## Pfade

Ein Abruf `/api/<kontext>/<id>/<endpunkt>` lädt genau eine Datei `<kontext>/<id>/<endpunkt>.json`,
etwa `groups/group-8a/competence-levels.json`. Es gibt drei Kontexte: die Klasse `group-8a`, die
Schule `school-birkenmoor` und das Land `beispielland`.

## Query-Parameter

- `filter` wählt eine Teilsicht. `filter=authority:<id>` lädt
  `states/beispielland/authorities/<id>/…`, `filter=school:<id>` lädt
  `states/beispielland/schools/<id>/…`. `filter=student-<id>` stellt die Person nach vorn und behält
  die Hauptgruppe sowie die in `comparison` genannten Gruppen.
- `type` filtert exakt auf den `type` der Value-Group, kommasepariert.
- `comparison` nennt die Ids der eingeblendeten Vergleichsgruppen. Hauptgruppe und feiner getypte
  Teilgruppen bleiben immer erhalten. Ohne den Parameter bleiben alle Gruppen.
- `aggregation` schränkt im Endpunkt `aggregations` die Aggregationsarten ein. Value-Groups ohne
  verbleibende Aggregation entfallen.

Eine unbekannte Datei ergibt einen 404, den die Demo als leeres Array behandelt.
