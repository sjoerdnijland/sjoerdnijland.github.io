#!/usr/bin/env node
/**
 * Pre-push console error checker.
 * Visits every public HTML page in a local server and fails if any
 * breaking JS errors are detected (TypeError, ReferenceError, SyntaxError, etc.)
 */

const { chromium } = require('playwright');
const { execSync, spawn }  = require('child_process');
const path = require('path');
const fs   = require('fs');

// ── Config ───────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');
const PORT = 8788;
const BASE = `http://localhost:${PORT}`;

// Pages to check (relative paths)
const PAGES = [
    'index.html',
    'enter.html',
    'reader.html',
    'wiki.html',
    'podcast.html',
    'map.html',
    'feed.html',
    'legal.html',
    'reviews.html',
    'podcast-player.html',
];

// Ignore patterns — third-party noise that isn't our code's fault
const IGNORE = [
    /fonts\.googleapis\.com/,
    /fonts\.gstatic\.com/,
    /supabase\.co/,
    /Failed to load resource.*favicon/i,
    /ERR_BLOCKED_BY_CLIENT/,            // ad blockers
    /Content Security Policy/i,
    /Cross-Origin/i,
    /\/uploads\//,                      // excluded from git intentionally
    /\/assets\/mp3\//,                  // excluded from git intentionally
    /ERR_FILE_NOT_FOUND/,
];

const BREAKING_TYPES = ['TypeError', 'ReferenceError', 'SyntaxError', 'RangeError'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isIgnored(msg) {
    return IGNORE.some(re => re.test(msg));
}

function isBreaking(msg) {
    return BREAKING_TYPES.some(t => msg.includes(t));
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
    // Start local server
    const server = spawn('npx', ['serve', ROOT, '-l', String(PORT), '--no-clipboard'], {
        stdio: 'ignore', shell: true,
    });
    await new Promise(r => setTimeout(r, 1500)); // let server boot

    const browser = await chromium.launch();
    const results = [];

    for (const page of PAGES) {
        const url  = `${BASE}/${page}`;
        const tab  = await browser.newPage();
        const errs = [];

        tab.on('pageerror', err => {
            const text = err.message;
            if (!isIgnored(text) && isBreaking(text)) {
                errs.push({ kind: 'error', blocking: true, text });
            }
        });

        tab.on('console', msg => {
            if (msg.type() !== 'error') return;
            const text = msg.text();
            const loc  = msg.location();
            const detail = loc?.url ? `${text} — ${loc.url}` : text;
            if (isIgnored(detail)) return;
            // 404 resource failures are warnings; JS errors in our own scripts are blocking
            const isOwn = loc?.url && loc.url.includes(`localhost:${PORT}`) && !loc.url.match(/\.(css|png|jpg|webp|ttf|woff|mp3|json)$/);
            errs.push({ kind: isOwn ? 'js-error' : '404/missing', blocking: isOwn, text: detail });
        });

        tab.on('pageerror', err => {
            const text = err.message;
            if (!isIgnored(text) && isBreaking(text)) errs.push({ kind: 'uncaught', text });
        });

        try {
            await tab.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
            // Let deferred scripts settle
            await tab.waitForTimeout(1000);
        } catch (e) {
            errs.push({ kind: 'load', text: e.message });
        }

        await tab.close();
        results.push({ page, errs });
    }

    await browser.close();
    server.kill();

    // ── Report ────────────────────────────────────────────────────────────────
    const blocking = results.filter(r => r.errs.some(e => e.blocking));
    const warnings = results.filter(r => r.errs.some(e => !e.blocking) && !r.errs.some(e => e.blocking));

    if (warnings.length) {
        console.warn('\x1b[33m⚠ Non-blocking warnings (missing assets, data files):\x1b[0m');
        for (const { page, errs } of warnings) {
            console.warn(`  ${page}`);
            for (const e of errs.filter(e => !e.blocking)) {
                console.warn(`    [${e.kind}] ${e.text.slice(0, 160)}`);
            }
        }
        console.warn('');
    }

    if (blocking.length === 0) {
        console.log('\x1b[32m✓ No JS errors across ' + PAGES.length + ' pages.\x1b[0m');
        process.exit(0);
    }

    console.error('\x1b[31m✖ JS errors detected — push blocked.\x1b[0m\n');
    for (const { page, errs } of blocking) {
        console.error(`  \x1b[33m${page}\x1b[0m`);
        for (const e of errs.filter(e => e.blocking)) {
            console.error(`    [${e.kind}] ${e.text.slice(0, 200)}`);
        }
    }
    console.error('\nFix the errors above, or add patterns to IGNORE in scripts/check-console.js.\n');
    process.exit(1);
})();
