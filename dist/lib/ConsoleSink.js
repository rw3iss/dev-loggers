/**
 * Default Sink. Writes to the browser/Node console using the level-appropriate
 * method. Always attached unless explicitly removed (`detachSink(consoleSink)`).
 */
export class ConsoleSink {
    name = 'console';
    write(event) {
        switch (event.level) {
            case 'error':
                console.error(...event.args);
                return;
            case 'warn':
                console.warn(...event.args);
                return;
            default:
                console.log(...event.args);
        }
    }
}
