// Singleton accessible through LoggerRegistry.getInstance()
export class LoggerRegistry {
    static instance;
    loggers = new Map();
    modules = [];
    logAllMode = false;
    logOnlyNamespaces;
    static getInstance() {
        if (!LoggerRegistry.instance) {
            LoggerRegistry.instance = new LoggerRegistry();
        }
        return LoggerRegistry.instance;
    }
    getLogger(namespace) {
        return this.loggers.get(namespace);
    }
    setLogger(namespace, logger) {
        this.loggers.set(namespace, logger);
    }
    addModule(module) {
        this.modules.push(module);
    }
    getModules() {
        return this.modules;
    }
    shouldLog(namespace, enabled) {
        if (this.logAllMode) {
            return !this.logOnlyNamespaces || this.logOnlyNamespaces.has(namespace);
        }
        return enabled;
    }
    setLogAllMode(enabled, onlyNamespaces) {
        this.logAllMode = enabled;
        this.logOnlyNamespaces = onlyNamespaces ? new Set(onlyNamespaces) : undefined;
    }
    getAllLoggers() {
        return this.loggers;
    }
}
