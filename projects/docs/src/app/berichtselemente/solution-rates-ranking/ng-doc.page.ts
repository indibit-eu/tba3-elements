import { NgDocPage } from '@ng-doc/core';
import Category from '../ng-doc.category';
import { SolutionRatesRankingDemoComponent } from './demos/solution-rates-ranking-demo.component';

const SolutionRatesRankingPage: NgDocPage = {
  title: 'Stärken und Schwächen',
  mdFile: './index.md',
  category: Category,
  order: 11,
  demos: { SolutionRatesRankingDemoComponent },
};

export default SolutionRatesRankingPage;
