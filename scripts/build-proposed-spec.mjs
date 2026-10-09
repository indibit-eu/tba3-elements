#!/usr/bin/env node
/** Schreibt tba3-spec.proposed.yml. Aufruf: npm run spec:proposed */
import { writeFileSync } from 'node:fs';
import { relative } from 'node:path';
import { buildProposedSpec, PROPOSED_FILE, ROOT } from './lib/proposed-spec.mjs';

const { text, patches } = buildProposedSpec();
writeFileSync(PROPOSED_FILE, text);
console.log(
  `${relative(ROOT, PROPOSED_FILE)} geschrieben (${patches.length} Patches: ${patches.map((p) => p.name).join(', ')}).`,
);
