import loggerTest from './logger.test.ts';
import performanceLoggerTest from './performanceLogger.test.ts';
import bufferedLoggerTest from './bufferLogger.test.ts';
import { executePromisesSequentially } from '../dist/index.js';

const RUN_IN_PARALLEL = true;

const ALL_TESTS = [
	loggerTest,
	performanceLoggerTest,
	bufferedLoggerTest
]

const runAll = async (parallel = RUN_IN_PARALLEL) => {
	console.log(`Running ${ALL_TESTS.length} tests in ${parallel ? 'parallel': 'sequence'}:\n-----------------------------------`);
	let results;

	if (parallel) {
		results = (await Promise.allSettled(ALL_TESTS.map(t => t()))).map(r => (r as any).value || r);
	} else {
		results = await executePromisesSequentially(ALL_TESTS);
	}

	console.log(`\n-----------------------------------\nAll tests finished:`, results)
}

runAll();

