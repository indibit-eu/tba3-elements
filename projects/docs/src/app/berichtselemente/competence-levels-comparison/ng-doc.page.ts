import { NgDocPage } from '@ng-doc/core';
import Category from '../ng-doc.category';
import { CompetenceLevelsComparisonDemoComponent } from './demos/competence-levels-comparison-demo.component';

const CompetenceLevelsComparisonPage: NgDocPage = {
  title: 'Kompetenzstufen-Vergleich',
  mdFile: './index.md',
  category: Category,
  order: 2,
  demos: { CompetenceLevelsComparisonDemoComponent },
};

export default CompetenceLevelsComparisonPage;
