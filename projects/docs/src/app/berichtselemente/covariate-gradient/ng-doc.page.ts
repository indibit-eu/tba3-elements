import { NgDocPage } from '@ng-doc/core';
import Category from '../ng-doc.category';
import { CovariateGradientDemoComponent } from './demos/covariate-gradient-demo.component';

const CovariateGradientPage: NgDocPage = {
  title: 'Lösungsquote nach Merkmal',
  mdFile: './index.md',
  category: Category,
  order: 12,
  demos: { CovariateGradientDemoComponent },
};

export default CovariateGradientPage;
