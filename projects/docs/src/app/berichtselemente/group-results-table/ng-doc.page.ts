import { NgDocPage } from '@ng-doc/core';
import Category from '../ng-doc.category';
import { GroupResultsTableDemoComponent } from './demos/group-results-table-demo.component';

const GroupResultsTablePage: NgDocPage = {
  title: 'Ergebnistabelle der Lerngruppe',
  mdFile: './index.md',
  category: Category,
  order: 6,
  demos: { GroupResultsTableDemoComponent },
};

export default GroupResultsTablePage;
