import { NgDocPage } from '@ng-doc/core';
import Category from '../ng-doc.category';
import { GroupsOverviewDemoComponent } from './demos/groups-overview-demo.component';

const GroupsOverviewPage: NgDocPage = {
  title: 'Lerngruppen-Übersicht der Schule',
  mdFile: './index.md',
  category: Category,
  order: 8,
  demos: { GroupsOverviewDemoComponent },
};

export default GroupsOverviewPage;
