import { NgDocPage } from '@ng-doc/core';
import Category from '../ng-doc.category';
import { StudentCompetenceLevelsDemoComponent } from './demos/student-competence-levels-demo.component';

const StudentCompetenceLevelsPage: NgDocPage = {
  title: 'Kompetenzstufen einer Person',
  mdFile: './index.md',
  category: Category,
  order: 7,
  demos: { StudentCompetenceLevelsDemoComponent },
};

export default StudentCompetenceLevelsPage;
