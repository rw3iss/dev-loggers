import { executePromisesSequentially } from './test.utils.ts';
import loggerTest from './logger.test.ts';
import performanceLoggerTest from './performanceLogger.test.ts';
import bufferedLoggerTest from './bufferLogger.test.ts';
import debugTest from './debug.test.ts';

// Inline color helper. Replaces the import from the old per-file
// dist/colors.js which no longer exists (build is now bundled).
const ANSI: Record<string, string> = { red: '\x1b[31m', green: '\x1b[32m', reset: '\x1b[0m' };
function color(name: 'red' | 'green', s: string): string {
	return `${ANSI[name] || ''}${s}${ANSI.reset}`;
}

const RUN_IN_PARALLEL = true;

const ALL_TESTS = [
	loggerTest,
	performanceLoggerTest,
	bufferedLoggerTest,
	debugTest
]

const summarizeResults = (results) => {
	return results.map(r => r ? color('green', 'pass') : color('red', 'fail')).join(', ');
}

const runAll = async (parallel = RUN_IN_PARALLEL) => {
	console.log(`Running ${ALL_TESTS.length} tests in ${parallel ? 'parallel': 'sequence'}:\n-----------------------------------`);
	let results;

	if (parallel) {
		results = (await Promise.allSettled(ALL_TESTS.map(t => t()))).map(r => (r as any).value || r);
	} else {
		results = await executePromisesSequentially(ALL_TESTS);
	}

	console.log(`\n-----------------------------------\nAll tests finished:`, summarizeResults(results) )
}

runAll();

