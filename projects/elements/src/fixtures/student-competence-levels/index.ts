import type { CompetenceLevelDefinition, CompetenceLevelsValueGroup } from '../../lib/model';
import student from './student.competence-levels.json';
import singleSubject from './single-subject.competence-levels.json';
import empty from './empty.competence-levels.json';

/** Eine Person mit Deutsch (drei Domänen, eine ohne Teilnahme) und Mathematik (eine Domäne). */
export const FIXTURE_STUDENT_COMPETENCE_LEVELS = student as CompetenceLevelsValueGroup[];

/** Eine Person mit Deutsch in zwei Domänen. */
export const FIXTURE_STUDENT_COMPETENCE_LEVELS_SINGLE_SUBJECT =
  singleSubject as CompetenceLevelsValueGroup[];

/** Eine Person ohne Teilnahme in zwei Domänen. */
export const FIXTURE_STUDENT_COMPETENCE_LEVELS_EMPTY = empty as CompetenceLevelsValueGroup[];

/** Stufenkatalog für Deutsch (sechs Stufen) und Mathematik (fünf Stufen) mit erfundenen Beschreibungen. */
export const EXAMPLE_LEVEL_CATALOG: CompetenceLevelDefinition[] = [
  {
    nameShort: 'Ia',
    name: 'Mindeststandard noch nicht erreicht',
    classification: 'unter Mindeststandard',
    description: 'Erfasst einzelne Wörter und sehr einfache Satzaussagen.',
    subject: 'Deutsch',
  },
  {
    nameShort: 'Ib',
    name: 'Mindeststandard noch nicht erreicht',
    classification: 'unter Mindeststandard',
    description: 'Entnimmt kurzen Texten einzelne ausdrücklich genannte Informationen.',
    subject: 'Deutsch',
  },
  {
    nameShort: 'II',
    name: 'Mindeststandard',
    classification: 'Mindeststandard',
    description: 'Entnimmt Texten benachbarte Informationen und verknüpft sie.',
    subject: 'Deutsch',
  },
  {
    nameShort: 'III',
    name: 'Regelstandard',
    classification: 'Regelstandard',
    description: 'Kann zentrale Aussagen eines Textes selbstständig zusammenfassen.',
    subject: 'Deutsch',
  },
  {
    nameShort: 'IV',
    name: 'Regelstandard plus',
    classification: 'Regelstandard plus',
    description: 'Deutet auch implizite Textaussagen und begründet sie am Text.',
    subject: 'Deutsch',
  },
  {
    nameShort: 'V',
    name: 'Optimalstandard',
    classification: 'Optimalstandard',
    description: 'Beurteilt Texte kriteriengeleitet und reflektiert ihre Wirkung.',
    subject: 'Deutsch',
  },
  {
    nameShort: 'I',
    name: 'Mindeststandard noch nicht erreicht',
    classification: 'unter Mindeststandard',
    description: 'Löst einfachste Aufgaben im vertrauten Zahlenraum mit Anschauung.',
    subject: 'Mathematik',
  },
  {
    nameShort: 'II',
    name: 'Mindeststandard',
    classification: 'Mindeststandard',
    description: 'Führt die Grundrechenarten in vertrauten Kontexten sicher aus.',
    subject: 'Mathematik',
  },
  {
    nameShort: 'III',
    name: 'Regelstandard',
    classification: 'Regelstandard',
    description: 'Löst Standardaufgaben mehrschrittig und wählt passende Verfahren.',
    subject: 'Mathematik',
  },
  {
    nameShort: 'IV',
    name: 'Regelstandard plus',
    classification: 'Regelstandard plus',
    description: 'Begründet Rechenwege und überträgt sie auf neue Aufgaben.',
    subject: 'Mathematik',
  },
  {
    nameShort: 'V',
    name: 'Optimalstandard',
    classification: 'Optimalstandard',
    description: 'Modelliert komplexe Situationen und beurteilt Lösungswege kritisch.',
    subject: 'Mathematik',
  },
];
