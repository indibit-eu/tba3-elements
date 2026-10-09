import type { CompetenceLevelDefinition } from '@indibit/tba3-elements';

/** Empfehlung des Berichts neben den Elementen, kein TBA-III-Datenpunkt. */
export interface Handlungsfeld {
  title: string;
  text: string;
}

export const SCHOOL_HANDLUNGSFELDER: readonly Handlungsfeld[] = [
  {
    title: 'Leseflüssigkeit in Jahrgang 8',
    text: 'Regelmäßige Lautlese-Tandems in allen achten Klassen verankern und nach einem Halbjahr erneut messen.',
  },
  {
    title: 'Orthografie gezielt fördern',
    text: 'Für Lernende unter Mindeststandard in Orthografie eine wöchentliche Förderstunde einrichten.',
  },
  {
    title: 'Übergänge begleiten',
    text: 'Ergebnisse mit den abgebenden Grundschulen besprechen und gemeinsame Förderschwerpunkte abstimmen.',
  },
];

export const AUTHORITY_HANDLUNGSFELDER: readonly Handlungsfeld[] = [
  {
    title: 'Schulen mit hohem Förderbedarf begleiten',
    text: 'Schulen mit auffällig hohem Anteil unter Mindeststandard eine Fortbildung zur Leseförderung anbieten.',
  },
  {
    title: 'Gute Praxis sichtbar machen',
    text: 'Schulen mit stabilen Ergebnissen als Hospitationsorte für den kollegialen Austausch gewinnen.',
  },
  {
    title: 'Sozialindex berücksichtigen',
    text: 'Ressourcen entlang der Sozialstruktur der Schulen steuern und die faire Vergleichsgruppe heranziehen.',
  },
];

/** Die Spec liefert keine Stufentexte, darum bringt der Bericht seinen eigenen Katalog mit. */
export const GERMAN_LEVEL_CATALOG: CompetenceLevelDefinition[] = [
  {
    nameShort: 'Ia',
    name: 'Mindeststandard noch nicht erreicht (Ia)',
    description: 'Grundlegende Lesestrategien sind noch nicht sicher verfügbar.',
    classification: 'unter Mindeststandard',
    subject: 'Deutsch',
  },
  {
    nameShort: 'Ib',
    name: 'Mindeststandard noch nicht erreicht (Ib)',
    description:
      'Einfache Aufgaben werden teilweise gelöst, der Mindeststandard ist noch nicht erreicht.',
    classification: 'unter Mindeststandard',
    subject: 'Deutsch',
  },
  {
    nameShort: 'II',
    name: 'Mindeststandard',
    description: 'Grundlegende Anforderungen werden bewältigt.',
    classification: 'Mindeststandard',
    subject: 'Deutsch',
  },
  {
    nameShort: 'III',
    name: 'Regelstandard',
    description: 'Die Regelanforderungen werden im Wesentlichen erfüllt.',
    classification: 'Regelstandard',
    subject: 'Deutsch',
  },
  {
    nameShort: 'IV',
    name: 'Regelstandard plus',
    description: 'Die Anforderungen werden sicher und über den Regelstandard hinaus erfüllt.',
    classification: 'Regelstandard plus',
    subject: 'Deutsch',
  },
  {
    nameShort: 'V',
    name: 'Optimalstandard',
    description: 'Auch anspruchsvolle Aufgaben werden zuverlässig gelöst.',
    classification: 'Optimalstandard',
    subject: 'Deutsch',
  },
];
