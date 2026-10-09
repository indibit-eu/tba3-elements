#!/usr/bin/env node
// Baut Doku (Wurzel) und Demo (demo/) als einen statischen Baum nach dist/pages/.
// Die Wurzel kommt aus PAGES_BASE_HREF, z. B. `/tba3-elements/` für GitHub Pages.
import { cpSync, copyFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'dist/pages');

const segments = (process.env.PAGES_BASE_HREF ?? '').split('/').filter(Boolean);
const base = segments.length ? `/${segments.join('/')}/` : '/';

function run(script, ...args) {
  execFileSync('npm', ['run', script, '--', ...args], { cwd: ROOT, stdio: 'inherit' });
}

rmSync(OUT, { recursive: true, force: true });

run('build:docs', '--base-href', base);
run('build:demo', '--base-href', `${base}demo/`);

cpSync(join(ROOT, 'dist/docs/browser'), OUT, { recursive: true });
cpSync(join(ROOT, 'dist/demo/browser'), join(OUT, 'demo'), { recursive: true });

// Statische Hosts liefern für unbekannte Pfade die 404.html. Als Kopie der Doku-App findet sie die
// Route clientseitig. Die Demo braucht das nicht, sie routet über den Hash.
copyFileSync(join(OUT, 'index.html'), join(OUT, '404.html'));

console.log(`dist/pages/ geschrieben (Doku unter ${base}, Demo unter ${base}demo/).`);
