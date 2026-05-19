#!/usr/bin/env node
/**
 * Build all entry points for dev-loggers.
 *
 *   .         → dist/index.mjs + dist/index.cjs            (core)
 *   ./panel   → dist/panel/index.mjs + dist/panel/index.cjs  (panel)
 *
 * Output uses proper `.mjs` (ESM) and `.cjs` (CJS) extensions so Node
 * picks the right module system from the extension alone, independent of
 * the package's `"type": "module"` field. (Earlier builds used
 * `.esm.js` / `.cjs.js`, which Node treated as ESM regardless of the
 * `cjs.` prefix because the extension is still `.js` — and that broke
 * CommonJS consumers like @nestjs/cli.)
 *
 * esbuild handles bundling + SCSS-to-injected-JS. TypeScript declarations
 * are emitted separately by `tsc -p tsconfig.build.json` (see package.json).
 */
import esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Compile each `*.scss` import to a string and inject it as a <style>
 *  element on first evaluation. SSR no-ops because of the document guard. */
const scssPlugin = {
	name: 'scss',
	setup(build) {
		build.onLoad({ filter: /\.scss$/ }, async (args) => {
			const sass = await import('sass');
			const result = sass.compile(args.path, {
				style: 'compressed',
				sourceMap: false,
			});
			const cssContent = result.css.toString();
			const js = `
				const css = ${JSON.stringify(cssContent)};
				if (typeof document !== 'undefined') {
					// Idempotency guard — re-importing the module (HMR, fast-refresh)
					// should not re-inject duplicate <style> blocks.
					const id = ${JSON.stringify('dev-loggers:' + path.basename(args.path))};
					if (!document.querySelector('style[data-dev-loggers-style="' + id + '"]')) {
						const style = document.createElement('style');
						style.dataset.devLoggersStyle = id;
						style.textContent = css;
						document.head.appendChild(style);
					}
				}
				export default css;
			`;
			return { contents: js, loader: 'js' };
		});
	},
};

const watch = process.argv.includes('--watch');

const entries = [
	{ in: 'src/index.ts',       outdir: 'dist',       label: 'core' },
	{ in: 'src/panel/index.ts', outdir: 'dist/panel', label: 'panel' },
];

const baseConfig = {
	bundle: true,
	target: 'es2020',
	sourcemap: true,
	minify: true,
	external: ['jsondiffpatch', 'fast-safe-stringify'],
	plugins: [scssPlugin],
	define: { 'process.env.NODE_ENV': '"production"' },
	logLevel: 'info',
};

async function buildAll() {
	if (!fs.existsSync('dist')) fs.mkdirSync('dist');

	const tasks = [];
	for (const e of entries) {
		// ESM (.mjs — always ESM regardless of package "type")
		tasks.push(
			esbuild.build({
				...baseConfig,
				entryPoints: [e.in],
				outdir: e.outdir,
				format: 'esm',
				outExtension: { '.js': '.mjs' },
			})
		);
		// CJS (.cjs — always CJS regardless of package "type")
		tasks.push(
			esbuild.build({
				...baseConfig,
				entryPoints: [e.in],
				outdir: e.outdir,
				format: 'cjs',
				outExtension: { '.js': '.cjs' },
			})
		);
	}
	await Promise.all(tasks);

	console.log('Build complete:');
	console.log('  - dist/index.mjs, dist/index.cjs                (core)');
	console.log('  - dist/panel/index.mjs, dist/panel/index.cjs    (panel)');
}

async function watchAll() {
	const formatExt = { esm: '.mjs', cjs: '.cjs' };
	const ctxs = [];
	for (const e of entries) {
		for (const fmt of ['esm', 'cjs']) {
			const ctx = await esbuild.context({
				...baseConfig,
				entryPoints: [e.in],
				outdir: e.outdir,
				format: fmt,
				outExtension: { '.js': formatExt[fmt] },
			});
			ctxs.push(ctx);
			ctx.watch();
		}
	}
	console.log('Watching for changes...');
}

(watch ? watchAll : buildAll)().catch((err) => {
	console.error('Build failed:', err);
	process.exit(1);
});
