#!/usr/bin/env node
/**
 * ⚠ EXPERIMENTAL — DO NOT USE WITH --html ⚠
 *
 * v372 attempt: this script builds a single concatenated JS bundle from
 * the 90 individual <script src=…> files in index.html. The build itself
 * works, but the resulting bundle FREEZES THE RENDERER on load — naive
 * concat doesn't preserve the per-script `defer` boot ordering that the
 * codebase relies on. The parallel `index-bundled.html` test page
 * confirmed this. Live `index.html` is unaffected.
 *
 * Real fix needs either (a) refactor every script to be import-safe and
 * use real esbuild dep tracking, or (b) keep concat but add explicit boot
 * wrappers per file. Either is 4-6 hours.
 *
 * Until that lands: don't run with --html. The default (dist-only) mode
 * is harmless — it builds artifacts to dist/ without touching the live
 * page.
 *
 * Original goal: cut cold-start HTTP from 90 round-trips to 1.
 *
 * Strategy: pure concatenation. These scripts are non-modular (each writes a
 * `var Foo = {…}` global), so we DON'T touch their contents — we just stitch
 * them in the SAME order index.html loads them, with `;\n` between files so
 * trailing-statement issues don't bleed across boundaries. esbuild then
 * minifies the combined file.
 *
 * The 2 CDN scripts at the top of index.html (Lucide, MapLibre) stay external —
 * we don't redistribute upstream code.
 *
 * Output: dist/bm.bundle.v{N}.min.js
 *
 * Usage:
 *   node scripts/build-bundle.mjs            # builds with current ?v= number
 *   node scripts/build-bundle.mjs --watch    # rebuild on change
 *   node scripts/build-bundle.mjs --html     # also rewrite index.html in place (DESTRUCTIVE)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
const DIST = path.join(ROOT, 'dist');

const args = new Set(process.argv.slice(2));
const REWRITE_HTML = args.has('--html');

function extractLocalScripts(html) {
  // Capture lines that load LOCAL scripts (not CDN). Preserve order.
  const re = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/g;
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const src = m[1];
    if (/^https?:\/\//.test(src)) continue;     // skip CDN
    const cleanPath = src.split('?')[0];        // strip cache-bust
    out.push({ raw: m[0], src, cleanPath, start: m.index, end: m.index + m[0].length });
  }
  return out;
}

function readVersionFromHTML(html) {
  // Prefer ?v=N script-tag query string (pre-bundle layout). Fall back to
  // the BUNDLED_VERSION constant (post-bundle layout, no ?v= strings left).
  // Last-resort: version.json.
  const m1 = html.match(/\?v=(\d+)/);
  if (m1) return m1[1];
  const m2 = html.match(/BUNDLED_VERSION\s*=\s*(\d+)/);
  if (m2) return m2[1];
  try {
    const v = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8'));
    if (v && typeof v.version !== 'undefined') return String(v.version);
  } catch (e) {}
  return 'dev';
}

function build() {
  const html = fs.readFileSync(INDEX, 'utf8');
  const scripts = extractLocalScripts(html);
  const version = readVersionFromHTML(html);

  console.log('Found ' + scripts.length + ' local scripts to bundle (v' + version + ')');

  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

  // Concatenate sources with file-boundary markers so source maps + debugging stay sane
  const buf = [];
  let totalIn = 0;
  for (const s of scripts) {
    const fp = path.join(ROOT, s.cleanPath);
    if (!fs.existsSync(fp)) {
      console.warn('  SKIP missing: ' + s.cleanPath);
      continue;
    }
    const c = fs.readFileSync(fp, 'utf8');
    totalIn += c.length;
    buf.push('/* ──── ' + s.cleanPath + ' ──── */');
    buf.push(c);
    // Defensive: if a file ends mid-statement (rare), `;\n` between files keeps
    // the next file's leading parens from being read as a function call on the
    // previous one's last expression.
    buf.push(';');
  }
  const combined = buf.join('\n');

  const rawOut = path.join(DIST, 'bm.bundle.v' + version + '.js');
  fs.writeFileSync(rawOut, combined);

  // Minify with esbuild — pure local-bin invocation, no globals required
  const esbuild = path.join(ROOT, 'node_modules', '.bin', 'esbuild');
  const minOut  = path.join(DIST, 'bm.bundle.v' + version + '.min.js');
  if (!fs.existsSync(esbuild)) {
    console.warn('esbuild not found at ' + esbuild + ' — skipping minify');
    fs.copyFileSync(rawOut, minOut);
  } else {
    execSync('"' + esbuild + '" "' + rawOut + '" --minify --target=es2020 --legal-comments=none --outfile="' + minOut + '"', { stdio: 'inherit' });
  }

  const inKB  = (totalIn       / 1024).toFixed(1);
  const rawKB = (fs.statSync(rawOut).size / 1024).toFixed(1);
  const minKB = (fs.statSync(minOut).size / 1024).toFixed(1);
  console.log('In: ' + inKB + ' KB across ' + scripts.length + ' files');
  console.log('Concatenated: ' + rawKB + ' KB (' + path.relative(ROOT, rawOut) + ')');
  console.log('Minified:     ' + minKB + ' KB (' + path.relative(ROOT, minOut) + ')');

  if (REWRITE_HTML) {
    // Replace ALL local <script src=…> tags with a single bundle tag, in-place.
    let newHtml = html;
    // Remove every local script tag from the source order
    const bundleTag = '<script defer src="dist/bm.bundle.v' + version + '.min.js"></script>';
    // Replace the FIRST local script with the bundle tag, then strip the rest.
    if (scripts.length) {
      const first = scripts[0];
      newHtml = newHtml.slice(0, first.start) + bundleTag + newHtml.slice(first.end);
      // Now remove every other local script tag — re-scan since indexes shifted
      const rest = extractLocalScripts(newHtml).filter(s => !/dist\/bm\.bundle\./.test(s.cleanPath));
      // Walk back-to-front so indexes don't shift mid-loop
      for (let i = rest.length - 1; i >= 0; i--) {
        const r = rest[i];
        // Strip the trailing newline before the tag too, if present
        const before = newHtml.slice(0, r.start).replace(/\n\s*$/, '\n');
        newHtml = before + newHtml.slice(r.end);
      }
    }
    fs.writeFileSync(INDEX, newHtml);
    console.log('index.html rewritten — ' + scripts.length + ' tags collapsed into 1.');
  } else {
    console.log('\nDry-mode: index.html NOT modified.');
    console.log('To test the bundle, open index-bundled.html (parallel file) or rerun with --html when ready.');
  }
}

if (args.has('--watch')) {
  console.log('Watching src/ for changes... (Ctrl-C to stop)');
  build();
  fs.watch(path.join(ROOT, 'src'), { recursive: true }, (_e, _f) => { try { build(); } catch (e) { console.error(e.message); } });
} else {
  build();
}
