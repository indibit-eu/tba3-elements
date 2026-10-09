/**
 * Erzeugt die Proposed-Spec aus tba3-spec.yml (Original) plus tba3-spec.patches.yml.
 *
 * Ein Patch ist ein YAML-Teilbaum, der per Deep-Merge über das Original gelegt wird: Objekte werden
 * rekursiv zusammengeführt, Arrays angehängt (ohne Duplikate), Skalare ersetzt.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';

export const ROOT = new URL('../..', import.meta.url).pathname;
export const ORIGINAL_FILE = join(ROOT, 'tba3-spec.yml');
export const PATCHES_FILE = join(ROOT, 'tba3-spec.patches.yml');
export const PROPOSED_FILE = join(ROOT, 'tba3-spec.proposed.yml');

const HEADER = `# GENERIERT aus tba3-spec.yml plus tba3-spec.patches.yml mit \`npm run spec:proposed\`.
# Nicht von Hand ändern. Die vorgeschlagenen Ergänzungen stehen in tba3-spec.patches.yml.
`;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function deepMerge(base, patch) {
  if (Array.isArray(base) && Array.isArray(patch)) {
    const seen = new Set(base.map((entry) => JSON.stringify(entry)));
    return [...base, ...patch.filter((entry) => !seen.has(JSON.stringify(entry)))];
  }
  if (isObject(base) && isObject(patch)) {
    const result = { ...base };
    for (const [key, value] of Object.entries(patch)) {
      result[key] = key in base ? deepMerge(base[key], value) : value;
    }
    return result;
  }
  return patch;
}

export function loadOriginal() {
  return parse(readFileSync(ORIGINAL_FILE, 'utf8'));
}

export function loadPatches() {
  return [{ name: 'tba3-spec.patches.yml', patch: parse(readFileSync(PATCHES_FILE, 'utf8')) }];
}

export function buildProposedSpec() {
  const patches = loadPatches();
  const spec = patches.reduce((acc, { patch }) => deepMerge(acc, patch), loadOriginal());
  const text = HEADER + stringify(spec, { lineWidth: 0 });
  return { spec, text, patches };
}
