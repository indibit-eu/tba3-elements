import { NgDocPage } from '@ng-doc/core';
import Category from '../ng-doc.category';
import { StandardAttainmentSummaryDemoComponent } from './demos/standard-attainment-summary-demo.component';

const StandardAttainmentSummaryPage: NgDocPage = {
  title: 'Standortbestimmung',
  mdFile: './index.md',
  category: Category,
  order: 3,
  demos: { StandardAttainmentSummaryDemoComponent },
};

export default StandardAttainmentSummaryPage;
