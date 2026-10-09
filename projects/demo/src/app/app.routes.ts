import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'lerngruppe' },
  {
    path: 'lerngruppe',
    title: 'Lerngruppe',
    loadComponent: () => import('./pages/group-page/group-page').then((m) => m.GroupPageComponent),
  },
  {
    path: 'person/:studentId',
    title: 'Person',
    loadComponent: () =>
      import('./pages/person-page/person-page').then((m) => m.PersonPageComponent),
  },
  {
    path: 'person',
    title: 'Person',
    loadComponent: () =>
      import('./pages/person-page/person-page').then((m) => m.PersonPageComponent),
  },
  {
    path: 'schule',
    title: 'Schule',
    loadComponent: () =>
      import('./pages/school-page/school-page').then((m) => m.SchoolPageComponent),
  },
  {
    path: 'schulamt',
    title: 'Schulamt',
    loadComponent: () =>
      import('./pages/authority-page/authority-page').then((m) => m.AuthorityPageComponent),
  },
  {
    path: 'land',
    title: 'Land',
    loadComponent: () => import('./pages/state-page/state-page').then((m) => m.StatePageComponent),
  },
  { path: '**', redirectTo: 'lerngruppe' },
];
