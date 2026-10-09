import { NgDocPage } from '@ng-doc/core';
import Category from '../ng-doc.category';
import { SolutionRatesProfileDemoComponent } from './demos/solution-rates-profile-demo.component';
import { SolutionRatesProfileAbsoluteDemoComponent } from './demos/solution-rates-profile-absolute-demo.component';

const SolutionRatesProfilePage: NgDocPage = {
  title: 'Teilkompetenzen-Profil',
  mdFile: './index.md',
  category: Category,
  order: 12,
  demos: { SolutionRatesProfileDemoComponent, SolutionRatesProfileAbsoluteDemoComponent },
};

export default SolutionRatesProfilePage;
