// Temporary refactor tool: split multi-export TS files into one construct per file and rewrite importers.
// Usage: node codemod-split.mjs split.json
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('./node_modules/typescript');

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const abs = (p) => path.resolve(ROOT, p);
const noExt = (p) => p.replace(/\.ts$/, '');
const rel = (fromFile, target) => {
  let r = path.relative(path.dirname(fromFile), target).split(path.sep).join('/');
  if (!r.startsWith('.')) r = './' + r;
  return r;
};

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p, out); }
    else if (p.endsWith('.ts')) out.push(p);
  }
  return out;
}
const parse = (file) => ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);

function resolveSpec(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const base = path.resolve(path.dirname(fromFile), spec);
  for (const c of [base, base + '.ts', path.join(base, 'index.ts')]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return base + '.ts';
}

function declaredNames(stmt) {
  if (ts.isVariableStatement(stmt)) return stmt.declarationList.declarations.map((d) => d.name.getText());
  if (stmt.name) return [stmt.name.getText()];
  return [];
}
const isExported = (stmt) => (ts.getCombinedModifierFlags(stmt) & ts.ModifierFlags.Export) !== 0
  || (stmt.modifiers ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
const isTypeDecl = (stmt) => ts.isInterfaceDeclaration(stmt) || ts.isTypeAliasDeclaration(stmt);

function referencedIdentifiers(node) {
  const out = new Set();
  const visit = (n) => {
    if (ts.isIdentifier(n)) {
      const p = n.parent;
      const isName = (ts.isPropertyAccessExpression(p) && p.name === n)
        || ((ts.isPropertyAssignment(p) || ts.isPropertyDeclaration(p) || ts.isPropertySignature(p)
          || ts.isMethodDeclaration(p) || ts.isMethodSignature(p) || ts.isEnumMember(p)
          || ts.isGetAccessor(p) || ts.isSetAccessor(p)) && p.name === n)
        || (ts.isQualifiedName(p) && p.right === n);
      if (!isName) out.add(n.text);
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
  return out;
}

function splitFile(cfg) {
  const src = abs(cfg.from);
  const sf = parse(src);
  const text = sf.getFullText();
  const parts = Object.fromEntries(Object.entries(cfg.parts).map(([k, v]) => [k, abs(v)]));
  const drop = new Set(cfg.drop ?? []);
  const unexport = new Set(cfg.unexport ?? []);
  const internal = new Set(cfg.internal ?? []);
  const barrels = (cfg.barrels ?? []).map(abs);

  const imports = [];
  const stmts = [];
  let header = '';
  sf.statements.forEach((s, i) => {
    if (ts.isImportDeclaration(s)) {
      if (i === 0) {
        const lead = text.slice(s.getFullStart(), s.getStart(sf));
        if (lead.trim()) header = lead.trim() + '\n\n';
      }
      imports.push(s);
    } else stmts.push(s);
  });

  const owner = new Map();
  const nameToStmt = new Map();
  for (const s of stmts) for (const n of declaredNames(s)) nameToStmt.set(n, s);

  for (const s of stmts) {
    const names = declaredNames(s);
    const exported = isExported(s);
    for (const n of names) {
      if (drop.has(n)) { owner.set(s, 'DROP'); continue; }
      if (parts[n]) owner.set(s, parts[n]);
      else if (exported && !unexport.has(n)) throw new Error(`${cfg.from}: exported ${n} has no target`);
    }
  }

  const refs = new Map(stmts.map((s) => [s, referencedIdentifiers(s)]));
  const helperOwners = new Map();
  for (const [s, file] of owner) {
    if (file === 'DROP') continue;
    const stack = [s];
    const seen = new Set([s]);
    while (stack.length) {
      const cur = stack.pop();
      for (const r of refs.get(cur)) {
        const dep = nameToStmt.get(r);
        if (!dep || seen.has(dep) || owner.has(dep)) continue;
        seen.add(dep);
        if (!helperOwners.has(dep)) helperOwners.set(dep, new Set());
        helperOwners.get(dep).add(file);
        stack.push(dep);
      }
    }
  }
  for (const s of stmts) {
    if (owner.has(s)) continue;
    const users = helperOwners.get(s);
    if (!users) { console.warn(`  WARN ${cfg.from}: unused statement ${declaredNames(s).join(',') || s.kind} dropped`); owner.set(s, 'DROP'); continue; }
    if (users.size > 1) throw new Error(`${cfg.from}: helper ${declaredNames(s)} used by ${[...users].map((u) => path.relative(ROOT, u)).join(', ')}; map it explicitly`);
    owner.set(s, [...users][0]);
  }

  const files = new Map();
  for (const s of stmts) {
    const f = owner.get(s);
    if (f === 'DROP') continue;
    if (!files.has(f)) files.set(f, []);
    files.get(f).push(s);
  }

  const nameToFile = new Map();
  for (const [s, f] of owner) if (f !== 'DROP') for (const n of declaredNames(s)) nameToFile.set(n, f);

  for (const [file, list] of files) {
    const used = new Set();
    for (const s of list) for (const r of refs.get(s)) used.add(r);
    const own = new Set(list.flatMap(declaredNames));
    const lines = [];
    for (const imp of imports) {
      const spec = imp.moduleSpecifier.text;
      const newSpec = spec.startsWith('.') ? rel(file, noExt(path.resolve(path.dirname(src), spec))) : spec;
      const clause = imp.importClause;
      if (!clause) continue;
      const typeOnly = clause.isTypeOnly ? 'type ' : '';
      if (clause.name && used.has(clause.name.text)) lines.push(`import ${typeOnly}${clause.name.text} from '${newSpec}';`);
      const nb = clause.namedBindings;
      if (nb && ts.isNamespaceImport(nb) && used.has(nb.name.text)) lines.push(`import ${typeOnly}* as ${nb.name.text} from '${newSpec}';`);
      if (nb && ts.isNamedImports(nb)) {
        const els = nb.elements.filter((e) => used.has(e.name.text)).map((e) => e.getText());
        if (els.length) lines.push(`import ${typeOnly}{ ${els.join(', ')} } from '${newSpec}';`);
      }
    }
    const intra = new Map();
    for (const u of used) {
      const f = nameToFile.get(u);
      if (!f || f === file || own.has(u)) continue;
      if (!intra.has(f)) intra.set(f, []);
      intra.get(f).push(u);
    }
    for (const [f, names] of intra) lines.push(`import { ${names.sort().join(', ')} } from '${rel(file, noExt(f))}';`);

    const bodies = list.map((s) => {
      let t = text.slice(s.getFullStart(), s.getEnd()).replace(/^\s*\n/, '');
      const names = declaredNames(s);
      if (names.some((n) => unexport.has(n))) {
        const start = s.getStart(sf) - s.getFullStart();
        const lead = text.slice(s.getFullStart(), s.getStart(sf)).replace(/^\s*\n/, '');
        const own = text.slice(s.getStart(sf), s.getEnd()).replace(/^export\s+/, '');
        t = lead + own;
        void start;
      }
      return t.trimEnd();
    });
    const head = cfg.headerTo && nameToFile.get(cfg.headerTo) === file ? header : '';
    const content = head + (lines.length ? lines.join('\n') + '\n\n' : '') + bodies.join('\n\n') + '\n';
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    console.log(`  wrote ${path.relative(ROOT, file)}`);
  }
  if (!files.has(src)) fs.unlinkSync(src);

  const isPublic = (n) => !internal.has(n) && !unexport.has(n) && !drop.has(n) && parts[n];
  for (const b of barrels) {
    const idx = path.join(b, 'index.ts');
    let cur = fs.existsSync(idx) ? fs.readFileSync(idx, 'utf8') : '';
    for (const [n, f] of Object.entries(parts)) {
      if (!isPublic(n) || path.dirname(f) !== b) continue;
      const s = nameToStmt.get(n);
      const line = `export ${isTypeDecl(s) ? 'type ' : ''}{ ${n} } from './${path.basename(f, '.ts')}';`;
      if (!cur.includes(line)) cur += line + '\n';
    }
    fs.writeFileSync(idx, cur);
  }

  const targetSpecFor = (consumer, n) => {
    const f = parts[n];
    const b = barrels.find((d) => path.dirname(f) === d);
    if (b && isPublic(n) && !consumer.startsWith(b + path.sep)) return rel(consumer, b);
    return rel(consumer, noExt(f));
  };

  for (const file of [...walk(abs('src')), ...walk(abs('test'))]) {
    const csf = parse(file);
    const ctext = csf.getFullText();
    const edits = [];
    for (const st of csf.statements) {
      const isImp = ts.isImportDeclaration(st);
      const isExp = ts.isExportDeclaration(st);
      if ((!isImp && !isExp) || !st.moduleSpecifier) continue;
      if (resolveSpec(file, st.moduleSpecifier.text) !== src) continue;
      const kw = isImp ? 'import' : 'export';
      const typeOnly = (isImp ? st.importClause?.isTypeOnly : st.isTypeOnly) ? 'type ' : '';
      const nb = isImp ? st.importClause?.namedBindings : st.exportClause;
      if (!nb || !(ts.isNamedImports(nb) || ts.isNamedExports(nb)) || (isImp && st.importClause.name)) {
        throw new Error(`${path.relative(ROOT, file)}: unsupported ${kw} form from ${cfg.from}`);
      }
      const groups = new Map();
      for (const e of nb.elements) {
        const n = (e.propertyName ?? e.name).text;
        if (!parts[n] || drop.has(n)) throw new Error(`${path.relative(ROOT, file)}: imports ${n}, which is dropped or unmapped`);
        const spec = targetSpecFor(file, n);
        if (!groups.has(spec)) groups.set(spec, []);
        groups.get(spec).push(e.getText());
      }
      const repl = [...groups].map(([spec, els]) => `${kw} ${typeOnly}{ ${els.join(', ')} } from '${spec}';`).join('\n');
      edits.push([st.getStart(csf), st.getEnd(), repl]);
    }
    const old = noExt(path.relative(path.dirname(file), src));
    if (ctext.includes(`jest.mock('${old}`)) throw new Error(`${path.relative(ROOT, file)}: jest.mock of ${cfg.from}`);
    if (!edits.length) continue;
    let out = ctext;
    for (const [a, b, r] of edits.sort((x, y) => y[0] - x[0])) out = out.slice(0, a) + r + out.slice(b);
    fs.writeFileSync(file, out);
    console.log(`  updated ${path.relative(ROOT, file)}`);
  }
}

const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
for (const s of cfg.splits) { console.log(`split ${s.from}`); splitFile(s); }
