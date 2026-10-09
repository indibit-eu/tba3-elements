import { NgDocPage } from '@ng-doc/core';
import Category from '../ng-doc.category';
import { SolutionRatesComparisonTableDemoComponent } from './demos/solution-rates-comparison-table-demo.component';

const SolutionRatesComparisonTablePage: NgDocPage = {
  title: 'Teilkompetenzen-Vergleich',
  mdFile: './index.md',
  category: Category,
  order: 13,
  demos: { SolutionRatesComparisonTableDemoComponent },
};

export default SolutionRatesComparisonTablePage;
