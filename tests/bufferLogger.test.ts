import { getBufferedLogger } from '../dist/index.js';

const { log, flush } = getBufferedLogger("BufferedLogger", { color: 'blue' });

export default async () => {
	return new Promise((resolve, reject) => {
		console.log(`(starting buffered logger test: 2s interval)`)
		log('Buffered logger first message.');

		setTimeout(() => {
			log('Buffered logger second message.');

			setTimeout(() => {
				log('Buffered logger last message.');
				flush();
				return resolve(true);
			}, 1000);
		}, 1000);
	});
}