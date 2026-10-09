import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { classificationVariable, contrastColor } from '../../model';

/** Kürzel einer Kompetenzstufe als Badge oder als Text mit Unterstrich in der Stufenfarbe. */
@Component({
  selector: 'tba3-level-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './level-badge.html',
  styleUrl: './level-badge.scss',
})
export class Tba3LevelBadgeComponent {
  readonly nameShort = input('');
  readonly classification = input<string | undefined>(undefined);
  readonly title = input('');
  /** `text` für dichte Tabellen; die Farbe liegt im Unterstrich, damit helle Stufen lesbar sind. */
  readonly display = input<'badge' | 'text'>('badge');

  readonly backgroundColor = computed(
    () => `var(${classificationVariable(this.classification())})`,
  );

  readonly textColor = computed(() => contrastColor(classificationVariable(this.classification())));
}
