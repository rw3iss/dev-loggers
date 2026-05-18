import { debug, attachSink, detachSink } from '../dist/index.js';

export default async () => {
	const events: any[] = [];
	const sink = { name: 'test', write: (e: any) => events.push(e) };
	attachSink(sink);

	debug('audio:attach', { tag: 'VIDEO', src: 'blob:fake' });
	debug('audio:chain', 'rebuild', { stages: 5 });
	debug.scope('audio:state').log('after rebuild', { ctx: 'running' });

	detachSink(sink);

	const pass =
		events.length === 3 &&
		events[0].id === 'audio:attach' &&
		events[0].namespace === 'audio' &&
		events[0].level === 'debug' &&
		!!events[0].data &&
		events[1].id === 'audio:chain' &&
		events[2].id === 'audio:state';

	if (!pass) {
		console.log('debug() events:', events);
	}
	return pass;
};
