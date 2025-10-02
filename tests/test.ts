import { getPerformanceLogger } from '../dist/index.js';

const { log } = getPerformanceLogger("[P]");

console.log(`pl`, log);

log('simple');
log('simple');