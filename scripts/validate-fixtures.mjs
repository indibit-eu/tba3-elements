#!/usr/bin/env node
/**
 * Prüft Fixtures und Mock-Daten strikt gegen tba3-spec.proposed.yml und tolerant gegen
 * tba3-spec.yml. Der Endpunkt ergibt sich aus dem Dateinamen (`competence-levels`, `aggregations`,
 * `items`). Aufruf: node scripts/validate-fixtures.mjs [Verzeichnisse oder Dateien]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { buildProposedSpec, loadOriginal, PROPOSED_FILE, ROOT } from './lib/proposed-spec.mjs';

const DEFAULT_DIRS = ['projects/elements/src/fixtures', 'projects/demo/public/mock-api'];
const ENDPOINTS = ['competence-levels', 'aggregations', 'items'];

const original = loadOriginal();
const { spec: proposed, text: proposedText } = buildProposedSpec();

let proposedStale = false;
try {
  proposedStale = readFileSync(PROPOSED_FILE, 'utf8') !== proposedText;
} catch {
  proposedStale = true;
}

/** Verbietet unbekannte Felder, bei `allOf` über `unevaluatedProperties` statt je Zweig. */
function strictSchemas(schemas) {
  const copy = structuredClone(schemas);
  const inAllOf = new Set();
  const collect = (node) => {
    if (Array.isArray(node)) return node.forEach(collect);
    if (node && typeof node === 'object') {
      if (Array.isArray(node.allOf)) {
        for (const branch of node.allOf) {
          if (branch.$ref) inAllOf.add(branch.$ref.split('/').pop());
        }
      }
      Object.values(node).forEach(collect);
    }
  };
  collect(copy);
  const tighten = (node, name, branch = false) => {
    if (Array.isArray(node)) return node.forEach((child) => tighten(child));
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node.allOf)) {
      node.unevaluatedProperties = false;
      node.allOf.forEach((child) => tighten(child, undefined, true));
    }
    if (node.properties && !inAllOf.has(name) && !branch) node.additionalProperties = false;
    for (const [key, child] of Object.entries(node)) {
      if (key === 'allOf') continue;
      if (key === 'properties' && child && typeof child === 'object') {
        Object.values(child).forEach((prop) => tighten(prop));
      } else if (key !== 'enum' && key !== 'examples' && key !== 'required') {
        tighten(child);
      }
    }
  };
  for (const [name, schema] of Object.entries(copy)) tighten(schema, name);
  return copy;
}

function makeValidators(spec, { strict, id }) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const schemas = strict ? strictSchemas(spec.components.schemas) : spec.components.schemas;
  ajv.addSchema({ $id: id, components: { schemas } });
  return Object.fromEntries(
    ENDPOINTS.map((endpoint) => {
      const response =
        spec.paths[`/groups/{id}/${endpoint}`]?.get?.responses?.['200']?.content?.[
          'application/json'
        ]?.schema;
      if (!response?.$ref) throw new Error(`Kein Antwortschema für /groups/{id}/${endpoint}`);
      return [endpoint, ajv.compile({ $ref: `${id}${response.$ref}` })];
    }),
  );
}

const proposedStrict = makeValidators(proposed, { strict: true, id: 'proposed-strict' });
const originalTolerant = makeValidators(original, { strict: false, id: 'original' });
const originalStrict = makeValidators(original, { strict: true, id: 'original-strict' });

function collectJsonFiles(target) {
  const absolute = resolve(ROOT, target);
  let stat;
  try {
    stat = statSync(absolute);
  } catch {
    return [];
  }
  if (stat.isFile()) return absolute.endsWith('.json') ? [absolute] : [];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) =>
    collectJsonFiles(join(absolute, entry.name)),
  );
}

const targets = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_DIRS;
const files = targets.flatMap(collectJsonFiles);

let failures = 0;
let checked = 0;
let skipped = 0;
const usesProposed = [];

for (const file of files) {
  const rel = relative(ROOT, file);
  const endpoint = ENDPOINTS.find((candidate) => rel.includes(candidate));
  if (!endpoint) {
    skipped++;
    console.log(`  übersprungen (kein Endpunkt im Namen): ${rel}`);
    continue;
  }
  const data = JSON.parse(readFileSync(file, 'utf8'));
  checked++;
  const strictOk = proposedStrict[endpoint](data);
  const strictErrors = proposedStrict[endpoint].errors ?? [];
  const tolerantOk = originalTolerant[endpoint](data);
  const tolerantErrors = originalTolerant[endpoint].errors ?? [];
  if (strictOk && tolerantOk) {
    if (!originalStrict[endpoint](data)) usesProposed.push(rel);
    continue;
  }
  failures++;
  console.error(`✗ ${rel} (${endpoint})`);
  if (!strictOk) {
    for (const error of strictErrors) {
      console.error(`    [proposed, strikt] ${error.instancePath || '/'} ${error.message}`);
    }
  }
  if (!tolerantOk) {
    for (const error of tolerantErrors) {
      console.error(`    [original] ${error.instancePath || '/'} ${error.message}`);
    }
  }
}

console.log(`\n${checked} Dateien geprüft, ${failures} fehlerhaft, ${skipped} übersprungen.`);
if (usesProposed.length) {
  console.log(`Nutzen vorweggenommene Felder (nur mit Proposed strikt gültig):`);
  for (const rel of usesProposed) console.log(`  ${rel}`);
}
if (files.length === 0) console.log('Hinweis: Noch keine Fixtures oder Mock-Daten vorhanden.');
if (proposedStale) {
  console.error(
    '\n✗ tba3-spec.proposed.yml ist nicht aktuell. Bitte `npm run spec:proposed` ausführen.',
  );
}
process.exit(failures || proposedStale ? 1 : 0);
