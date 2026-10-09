import { NgDocPage } from '@ng-doc/core';
import Category from '../ng-doc.category';
import { SolutionRatesRankingRelativeDemoComponent } from './demos/solution-rates-ranking-relative-demo.component';
import { SolutionRatesRankingAbsoluteDemoComponent } from './demos/solution-rates-ranking-absolute-demo.component';

const SolutionRatesRankingPage: NgDocPage = {
  title: 'Stärken und Schwächen',
  mdFile: './index.md',
  category: Category,
  order: 11,
  demos: {
    SolutionRatesRankingRelativeDemoComponent,
    SolutionRatesRankingAbsoluteDemoComponent,
  },
};

export default SolutionRatesRankingPage;
