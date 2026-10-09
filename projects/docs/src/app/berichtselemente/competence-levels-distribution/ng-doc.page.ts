import { NgDocPage } from '@ng-doc/core';
import Category from '../ng-doc.category';
import { CompetenceLevelsDistributionDemoComponent } from './demos/competence-levels-distribution-demo.component';

const CompetenceLevelsDistributionPage: NgDocPage = {
  title: 'Kompetenzstufenverteilung',
  mdFile: './index.md',
  category: Category,
  order: 1,
  demos: { CompetenceLevelsDistributionDemoComponent },
};

export default CompetenceLevelsDistributionPage;
