import { getLogger } from '../dist/index.esm.js';

const { log } = getLogger("SimpleLogger");

export default async () => {
	log('Simple logger message.');
	return true;
}