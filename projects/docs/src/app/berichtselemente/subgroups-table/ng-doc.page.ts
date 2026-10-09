import { NgDocPage } from '@ng-doc/core';
import Category from '../ng-doc.category';
import { SubgroupsTableDemoComponent } from './demos/subgroups-table-demo.component';

const SubgroupsTablePage: NgDocPage = {
  title: 'Teilgruppen-Tabelle',
  mdFile: './index.md',
  category: Category,
  order: 9,
  demos: { SubgroupsTableDemoComponent },
};

export default SubgroupsTablePage;
