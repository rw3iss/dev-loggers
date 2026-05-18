/** Adapter used internally by the registry to coerce a v3 module into a Sink. */
export function moduleToSink(m) {
    return {
        name: m.name,
        write: (event) => m.onLog(event),
    };
}
