// Temporary refactor tool: import from folder barrels from outside the folder; merge duplicate named imports.
// Usage: node codemod-tidy.mjs <dir-or-file>...
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('./node_modules/typescript');
const ROOT = path.dirname(new URL(import.meta.url).pathname);

function walk(p, out = []) {
  if (fs.statSync(p).isFile()) { if (p.endsWith('.ts')) out.push(p); return out; }
  for (const e of fs.readdirSync(p)) walk(path.join(p, e), out);
  return out;
}
const parse = (file) => ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
const rel = (fromFile, target) => {
  let r = path.relative(path.dirname(fromFile), target).split(path.sep).join('/');
  return r.startsWith('.') ? r : './' + r;
};
function resolveSpec(fromFile, spec) {
  const base = path.resolve(path.dirname(fromFile), spec);
  for (const c of [base + '.ts', path.join(base, 'index.ts')]) if (fs.existsSync(c)) return c;
  return null;
}
const barrelCache = new Map();
function barrelExports(dir) {
  if (barrelCache.has(dir)) return barrelCache.get(dir);
  const idx = path.join(dir, 'index.ts');
  const map = new Map();
  if (fs.existsSync(idx)) {
    for (const st of parse(idx).statements) {
      if (!ts.isExportDeclaration(st) || !st.moduleSpecifier || !st.exportClause) continue;
      const target = resolveSpec(idx, st.moduleSpecifier.text);
      for (const e of st.exportClause.elements) map.set(`${target}#${(e.propertyName ?? e.name).text}`, e.name.text);
    }
  }
  barrelCache.set(dir, map);
  return map;
}

const files = process.argv.slice(2).flatMap((p) => walk(path.resolve(ROOT, p)));
for (const file of files) {
  if (path.basename(file) === 'index.ts') continue;
  const sf = parse(file);
  const text = sf.getFullText();
  const decls = [];
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.moduleSpecifier.text.startsWith('.')) continue;
    const clause = st.importClause;
    if (!clause || clause.name || !clause.namedBindings || !ts.isNamedImports(clause.namedBindings)) continue;
    let spec = st.moduleSpecifier.text;
    const target = resolveSpec(file, spec);
    if (target && path.basename(target) !== 'index.ts') {
      const dir = path.dirname(target);
      const exp = barrelExports(dir);
      const names = clause.namedBindings.elements.map((e) => (e.propertyName ?? e.name).text);
      const inside = file.startsWith(dir + path.sep);
      if (!inside && names.every((n) => exp.get(`${target}#${n}`) === n)) spec = rel(file, dir);
    }
    decls.push({ st, spec, typeOnly: clause.isTypeOnly, els: clause.namedBindings.elements.map((e) => e.getText()) });
  }
  const groups = new Map();
  for (const d of decls) {
    const key = `${d.typeOnly}|${d.spec}`;
    if (!groups.has(key)) groups.set(key, { ...d, els: [], first: d.st });
    const g = groups.get(key);
    for (const e of d.els) if (!g.els.includes(e)) g.els.push(e);
  }
  const edits = [];
  for (const d of decls) {
    const g = groups.get(`${d.typeOnly}|${d.spec}`);
    if (g.first === d.st) {
      const repl = `import ${d.typeOnly ? 'type ' : ''}{ ${g.els.join(', ')} } from '${d.spec}';`;
      if (repl !== d.st.getText()) edits.push([d.st.getStart(sf), d.st.getEnd(), repl]);
    } else {
      let end = d.st.getEnd();
      if (text[end] === '\n') end += 1;
      edits.push([d.st.getStart(sf), end, '']);
    }
  }
  if (!edits.length) continue;
  let out = text;
  for (const [a, b, r] of edits.sort((x, y) => y[0] - x[0])) out = out.slice(0, a) + r + out.slice(b);
  fs.writeFileSync(file, out);
  console.log(`tidied ${path.relative(ROOT, file)}`);
}
