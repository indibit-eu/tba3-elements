import { NgDocApi } from '@ng-doc/core';

const api: NgDocApi = {
  title: 'Typen',
  scopes: [
    {
      name: 'tba3-elements',
      route: 'tba3-elements',
      include: 'projects/docs/src/app/api/reference.ts',
    },
  ],
};

export default api;
