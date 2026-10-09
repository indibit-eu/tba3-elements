import { NgDocPage } from '@ng-doc/core';
import Category from '../ng-doc.category';
import { StandardAttainmentByDomainDemoComponent } from './demos/standard-attainment-by-domain-demo.component';

const StandardAttainmentByDomainPage: NgDocPage = {
  title: 'Standarderreichung je Domäne',
  mdFile: './index.md',
  category: Category,
  order: 4,
  demos: { StandardAttainmentByDomainDemoComponent },
};

export default StandardAttainmentByDomainPage;
