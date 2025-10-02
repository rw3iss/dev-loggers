import { getPerformanceLogger } from '../dist/index.js';

const { log } = getPerformanceLogger("PerformanceLogger", { color: 'green' });

export default async () => {
	return new Promise((resolve, reject) => {
		log('[test1]', 'Start 2s performance test.');

		setTimeout(() => {
			log('[test1]', 'New performance event (1s interval).');

			setTimeout(() => {
				log('[test1]', 'Finish performance test (1s interval).');
				return resolve(true);
			}, 1000);
		}, 1000);
	});
}