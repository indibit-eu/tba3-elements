import { NgDocPage } from '@ng-doc/core';
import Category from '../ng-doc.category';
import { CompositionSummaryDemoComponent } from './demos/composition-summary-demo.component';

const CompositionSummaryPage: NgDocPage = {
  title: 'Zusammensetzung',
  mdFile: './index.md',
  category: Category,
  order: 5,
  demos: { CompositionSummaryDemoComponent },
};

export default CompositionSummaryPage;
