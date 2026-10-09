import { NgDocPage } from '@ng-doc/core';
import Category from '../ng-doc.category';
import { SolutionRatesDemoComponent } from './demos/solution-rates-demo.component';

const SolutionRatesPage: NgDocPage = {
  title: 'Lösungsquoten',
  mdFile: './index.md',
  category: Category,
  order: 10,
  demos: { SolutionRatesDemoComponent },
};

export default SolutionRatesPage;
