import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type {
  CompetenceLevelDefinition,
  CompetenceLevelsValueGroup,
  ValueLabels,
} from '../../model';
import {
  type CompetenceLevelEntry,
  catalogFor,
  compareBlocks,
  resolveLabel,
  subjectNames,
} from '../../model';
import { Tba3LevelBadgeComponent } from '../../components/level-badge/level-badge';

interface CovariateBadge {
  label: string;
  value: string;
}

interface Header {
  name: string;
  subjects: string[];
  covariates: CovariateBadge[];
}

interface CatalogRow {
  nameShort: string;
  description: string;
  classification: string | undefined;
  reached: boolean;
}

interface ReachedBadge {
  nameShort: string;
  name: string;
  description: string;
  classification: string | undefined;
}

interface DomainCard {
  domain: string;
  subject: string;
  caption: string;
  rows: CatalogRow[];
  reached: ReachedBadge | undefined;
  noParticipation: boolean;
}

const NO_PARTICIPATION_LABEL = 'Ohne Teilnahme';

/**
 * Zeigt die erreichten Kompetenzstufen einer Person je Domäne, mit Stufenkatalog als Tabelle aller
 * Stufen.
 */
@Component({
  selector: 'tba3-student-competence-levels',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Tba3LevelBadgeComponent],
  templateUrl: './student-competence-levels.html',
})
export class StudentCompetenceLevelsComponent {
  protected readonly noParticipationLabel = NO_PARTICIPATION_LABEL;

  /** Value-Groups einer Person, eine je Domäne; Name und Merkmale stammen aus der ersten. */
  readonly competenceLevels = input<CompetenceLevelsValueGroup[]>([]);

  /** Stufenkatalog, der die nicht erreichten Stufen je Domäne ergänzt. */
  readonly levelCatalog = input<CompetenceLevelDefinition[]>([]);

  /** Anzeigetexte für Merkmalswerte im Kopf, Schlüssel `typ.wert`. */
  readonly valueLabels = input<ValueLabels | undefined>(undefined);

  readonly header = computed<Header | undefined>(() => {
    const groups = this.competenceLevels();
    const first = groups[0];
    if (!first) return undefined;

    const labels = this.valueLabels();
    const covariates: CovariateBadge[] = (first.covariates ?? []).map((covariate) => ({
      label: covariate.label ?? covariate.type,
      value: resolveLabel(labels, covariate.type, covariate.value),
    }));

    const subjects = subjectNames(groups).filter((name): name is string => !!name);
    return { name: first.name ?? '', subjects, covariates };
  });

  readonly cards = computed<DomainCard[]>(() => {
    const groups = this.competenceLevels();
    if (groups.length === 0) return [];

    const catalog = this.levelCatalog();
    const showSubject = subjectNames(groups).length > 1;
    return [...groups].sort(compareBlocks).map((group) => this.cardOf(group, showSubject, catalog));
  });

  private cardOf(
    group: CompetenceLevelsValueGroup,
    showSubject: boolean,
    catalog: readonly CompetenceLevelDefinition[],
  ): DomainCard {
    const subject = group.subject?.name ?? '';
    const domain = group.domain?.name ?? '';
    const title = domain || subject;
    const caption = `Kompetenzstufen ${[subject, domain]
      .filter(Boolean)
      .join(' ')}, die erreichte Stufe ist hervorgehoben.`;
    const base = {
      domain: title,
      subject: showSubject && domain ? subject : '',
      caption,
    };

    const reached = reachedLevel(group);
    if (!reached) {
      return { ...base, rows: [], reached: undefined, noParticipation: true };
    }

    const definitions = catalogFor(catalog, subject || undefined, domain || undefined);
    if (definitions.length > 0) {
      // Der Katalog läuft von schwach nach stark, die Tabelle zeigt die stärkste Stufe oben.
      const rows = [...definitions].reverse().map((definition) => rowOf(definition, reached));
      return { ...base, rows, reached: undefined, noParticipation: false };
    }

    return {
      ...base,
      rows: [],
      reached: {
        nameShort: reached.nameShort,
        name: reached.name ?? '',
        description: reached.description ?? '',
        classification: reached.classification,
      },
      noParticipation: false,
    };
  }
}

function rowOf(definition: CompetenceLevelDefinition, reached: CompetenceLevelEntry): CatalogRow {
  return {
    nameShort: definition.nameShort,
    description: definition.description ?? definition.name ?? '',
    classification: definition.classification,
    reached: definition.nameShort === reached.nameShort,
  };
}

// Auf Personenebene trägt `competenceLevels` nur die erreichte Stufe.
function reachedLevel(group: CompetenceLevelsValueGroup): CompetenceLevelEntry | undefined {
  return group.competenceLevels[0];
}
