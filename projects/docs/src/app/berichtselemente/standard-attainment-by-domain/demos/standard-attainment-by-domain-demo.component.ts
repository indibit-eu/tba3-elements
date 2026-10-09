import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN,
  FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN_TOTALS,
  StandardAttainmentByDomainComponent,
} from '@indibit/tba3-elements';

@Component({
  selector: 'standard-attainment-by-domain-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StandardAttainmentByDomainComponent],
  template: `<tba3-standard-attainment-by-domain
    [competenceLevels]="data"
    [aggregations]="totals"
  />`,
})
export class StandardAttainmentByDomainDemoComponent {
  protected readonly data = FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN;
  protected readonly totals = FIXTURE_STANDARD_ATTAINMENT_BY_DOMAIN_TOTALS;
}
