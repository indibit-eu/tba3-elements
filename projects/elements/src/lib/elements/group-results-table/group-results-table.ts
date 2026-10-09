import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type {
  AggregationsValueGroup,
  Classification,
  CompetenceLevelsValueGroup,
  SortCriterion,
  SortDirection,
  SortValue,
  ValueLabels,
} from '../../model';
import {
  BELOW_MINIMUM,
  CLASSIFICATIONS,
  type GroupedValueGroups,
  OPTIMAL,
  ariaSort as ariaSortOf,
  domainNames,
  groupKey,
  percent,
  resolveLabel,
  sortByCriteria,
  sortPriority,
  splitByRole,
  toggleSort,
} from '../../model';
import { Tba3LevelBadgeComponent } from '../../components/level-badge/level-badge';
import { Tba3ControlPanelComponent } from '../../components/control-panel/control-panel';
import { Tba3ViewSlot } from '../../components/control-panel/control-panel-slots';
import { Tba3SortHeaderComponent } from '../../components/sort-header/sort-header';
import { Tba3LegendComponent, type Tba3LegendItem } from '../../components/legend/legend';

interface CovariateColumn {
  type: string;
  label: string;
  sortKey: string;
}

interface DomainColumn {
  name: string;
  levelKey: string;
  averageKey: string;
}

interface DomainCell {
  nameShort: string;
  levelName: string;
  hasStage: boolean;
  classification: string | undefined;
  averageText: string;
  hasAverage: boolean;
  averageMean: number;
}

interface CovariateCell {
  text: string;
  title: string;
}

interface PersonRow {
  id: string;
  name: string;
  belowMinimum: boolean;
  optimal: boolean;
  noParticipation: boolean;
  covariateCells: CovariateCell[];
  cells: DomainCell[];
  sortValues: Map<string, SortValue>;
}

interface DomainFooter {
  averageText: string;
}

interface Marker {
  key: 'belowMinimum' | 'optimal' | 'noParticipation';
  icon: string;
  color: string | undefined;
  description: string;
}

const MARKERS: readonly Marker[] = [
  {
    key: 'belowMinimum',
    icon: 'fa-triangle-exclamation',
    color: 'var(--tba3-mark-alert)',
    description: 'Unter Mindeststandard in mindestens einer Domäne',
  },
  {
    key: 'optimal',
    icon: 'fa-crown',
    color: 'var(--tba3-mark-top)',
    description: 'Optimalstandard in allen Domänen',
  },
  {
    key: 'noParticipation',
    icon: 'fa-circle-xmark',
    color: undefined,
    description: 'Ohne Teilnahme in mindestens einer Domäne',
  },
];

const NAME_COLUMN = 'name';

/**
 * Ergebnistabelle einer Lerngruppe mit einer Zeile je Person: Statusmarker, Merkmale und je Domäne
 * die erreichte Stufe, optional mit mittlerer Lösungsquote. Die Spalten sind mehrfach sortierbar.
 */
@Component({
  selector: 'tba3-group-results-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Tba3LevelBadgeComponent,
    Tba3ControlPanelComponent,
    Tba3ViewSlot,
    Tba3SortHeaderComponent,
    Tba3LegendComponent,
  ],
  templateUrl: './group-results-table.html',
  styleUrl: './group-results-table.scss',
})
export class GroupResultsTableComponent {
  /** Value-Groups eines `competence-levels`-Endpunkts: zuerst die Lerngruppe, dann die Personen. */
  readonly competenceLevels = input<CompetenceLevelsValueGroup[]>([]);

  /** Value-Groups eines `aggregations`-Endpunkts mit der Lösungsquote je Person und Domäne. */
  readonly aggregations = input<AggregationsValueGroup[]>([]);

  /** Anzeigetexte für Merkmalswerte, bevorzugt `labelShort`. */
  readonly valueLabels = input<ValueLabels | undefined>(undefined);

  /** Schlüssel `typ:id` der Person, deren Name angeklickt wurde. */
  readonly personSelected = output<string>();

  private readonly sortCriteria = signal<SortCriterion<string>[]>([]);

  readonly markers = MARKERS;

  readonly legendItems = computed<Tba3LegendItem[]>(() => {
    const items: Tba3LegendItem[] = [];
    if (this.hasAggregations()) {
      items.push({ text: 'Ø = mittlere Lösungsquote' });
    }
    for (const marker of MARKERS) {
      items.push({
        text: marker.description,
        marker: { icon: marker.icon, color: marker.color },
      });
    }
    return items;
  });

  private readonly roles = computed(() => splitByRole(this.competenceLevels()));

  readonly hasAggregations = computed(() => this.aggregations().length > 0);

  readonly domainColumns = computed<DomainColumn[]>(() => {
    const roles = this.roles();
    const source = roles.focus?.groups ?? roles.parts.flatMap((part) => part.groups);
    const names = domainNames(source).filter((name): name is string => name !== undefined);
    return names.map((name) => ({
      name,
      levelKey: `level:${name}`,
      averageKey: `average:${name}`,
    }));
  });

  private readonly catalogByDomain = computed(() => {
    const catalog = new Map<
      string,
      { order: Map<string, number>; classification: Map<string, string> }
    >();
    for (const group of this.roles().focus?.groups ?? []) {
      const domain = group.domain?.name;
      if (domain === undefined || catalog.has(domain)) continue;
      const order = new Map<string, number>();
      const classification = new Map<string, string>();
      group.competenceLevels.forEach((level, index) => {
        order.set(level.nameShort, index);
        if (level.classification) classification.set(level.nameShort, level.classification);
      });
      catalog.set(domain, { order, classification });
    }
    return catalog;
  });

  readonly covariateColumns = computed<CovariateColumn[]>(() => {
    const columns: CovariateColumn[] = [];
    const seen = new Set<string>();
    for (const person of this.roles().parts) {
      for (const group of person.groups) {
        for (const covariate of group.covariates ?? []) {
          if (seen.has(covariate.type)) continue;
          seen.add(covariate.type);
          columns.push({
            type: covariate.type,
            label: covariate.label ?? covariate.type,
            sortKey: `covariate:${covariate.type}`,
          });
        }
      }
    }
    return columns;
  });

  private readonly averageByPersonDomain = computed(() => {
    const map = new Map<string, Map<string, number>>();
    for (const group of this.aggregations()) {
      const key = groupKey(group);
      let byDomain = map.get(key);
      if (!byDomain) {
        byDomain = new Map<string, number>();
        map.set(key, byDomain);
      }
      for (const aggregation of group.aggregations) {
        if (aggregation.type === 'domain') {
          byDomain.set(aggregation.value, aggregation.descriptiveStatistics.mean);
        }
      }
    }
    return map;
  });

  private readonly rows = computed<PersonRow[]>(() => {
    const labels = this.valueLabels();
    const domains = this.domainColumns();
    const covariateColumns = this.covariateColumns();
    const catalog = this.catalogByDomain();
    const averages = this.averageByPersonDomain();

    return this.roles().parts.map((person) =>
      this.rowOf(person, domains, covariateColumns, catalog, averages, labels),
    );
  });

  readonly sortedRows = computed<PersonRow[]>(() =>
    sortByCriteria(this.rows(), this.sortCriteria(), (row, key) => row.sortValues.get(key)),
  );

  // Ungewichtetes Mittel der Personenwerte, keine eigene Kennzahl der Gruppe.
  readonly footer = computed<DomainFooter[]>(() => {
    if (!this.hasAggregations()) return [];
    const rows = this.rows();
    return this.domainColumns().map((_, index) => {
      const means = rows
        .map((row) => row.cells[index])
        .filter((cell) => cell.hasAverage)
        .map((cell) => cell.averageMean);
      if (means.length === 0) return { averageText: '–' };
      const mean = means.reduce((sum, value) => sum + value, 0) / means.length;
      return { averageText: `${percent(mean)} %` };
    });
  });

  sort(column: string): void {
    this.sortCriteria.set(toggleSort(this.sortCriteria(), column));
  }

  clearSort(): void {
    this.sortCriteria.set([]);
  }

  readonly isSorted = computed(() => this.sortCriteria().length > 0);

  sortDirection(column: string): SortDirection | undefined {
    return this.sortCriteria().find((criterion) => criterion.key === column)?.direction;
  }

  ariaSort(column: string): 'ascending' | 'descending' | 'none' {
    return ariaSortOf(this.sortDirection(column));
  }

  sortPriority(column: string): number | undefined {
    return sortPriority(this.sortCriteria(), column);
  }

  readonly nameColumn = NAME_COLUMN;

  private rowOf(
    person: GroupedValueGroups<CompetenceLevelsValueGroup>,
    domains: readonly DomainColumn[],
    covariateColumns: readonly CovariateColumn[],
    catalog: ReadonlyMap<
      string,
      { order: Map<string, number>; classification: Map<string, string> }
    >,
    averages: ReadonlyMap<string, Map<string, number>>,
    labels: ValueLabels | undefined,
  ): PersonRow {
    const sortValues = new Map<string, SortValue>();
    sortValues.set(NAME_COLUMN, person.name);

    // Merkmale sind je Person über alle Domänen gleich, die erste Value-Group mit dem Typ genügt.
    const covariateByType = new Map<string, CovariateCell>();
    for (const group of person.groups) {
      for (const covariate of group.covariates ?? []) {
        if (!covariateByType.has(covariate.type)) {
          covariateByType.set(covariate.type, {
            text: resolveLabel(labels, covariate.type, covariate.value, { short: true }),
            title: resolveLabel(labels, covariate.type, covariate.value),
          });
        }
      }
    }
    const covariateCells = covariateColumns.map((column) => {
      const cell = covariateByType.get(column.type);
      sortValues.set(column.sortKey, cell?.text);
      return cell ?? { text: '–', title: '' };
    });

    const meanByDomain = averages.get(person.key);
    let belowMinimum = false;
    let noParticipation = false;
    let stagesCount = 0;
    let optimalCount = 0;

    const cells: DomainCell[] = domains.map((column) => {
      const group = person.groups.find((entry) => entry.domain?.name === column.name);
      const reached = group?.competenceLevels[0];
      const domainCatalog = catalog.get(column.name);

      if (group && !reached) noParticipation = true;

      let classification: string | undefined;
      if (reached) {
        classification =
          reached.classification ?? domainCatalog?.classification.get(reached.nameShort);
        stagesCount += 1;
        if (classification === BELOW_MINIMUM) belowMinimum = true;
        if (classification === OPTIMAL) optimalCount += 1;
        // Ohne Katalogeintrag sortiert der Rang der Classification.
        const order = domainCatalog?.order.get(reached.nameShort);
        sortValues.set(
          column.levelKey,
          order ?? CLASSIFICATIONS.indexOf(classification as Classification),
        );
      } else {
        sortValues.set(column.levelKey, undefined);
      }

      const mean = meanByDomain?.get(column.name);
      const hasAverage = mean !== undefined;
      sortValues.set(column.averageKey, mean);

      return {
        nameShort: reached?.nameShort ?? '–',
        levelName: reached?.name ?? '',
        hasStage: reached !== undefined,
        classification,
        averageText: hasAverage ? `${percent(mean)} %` : '–',
        hasAverage,
        averageMean: mean ?? 0,
      };
    });

    return {
      id: person.key,
      name: person.name,
      belowMinimum,
      optimal: stagesCount > 0 && optimalCount === stagesCount,
      noParticipation,
      covariateCells,
      cells,
      sortValues,
    };
  }
}
