import { NgDocPage } from '@ng-doc/core';
import Category from '../ng-doc.category';
import { SolutionRatesHeatmapDemoComponent } from './demos/solution-rates-heatmap-demo.component';
import { SolutionRatesHeatmapAbsoluteDemoComponent } from './demos/solution-rates-heatmap-absolute-demo.component';

const SolutionRatesHeatmapPage: NgDocPage = {
  title: 'Lösungsquoten-Heatmap',
  mdFile: './index.md',
  category: Category,
  order: 14,
  demos: { SolutionRatesHeatmapDemoComponent, SolutionRatesHeatmapAbsoluteDemoComponent },
};

export default SolutionRatesHeatmapPage;
