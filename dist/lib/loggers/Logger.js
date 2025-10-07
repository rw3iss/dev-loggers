import { log, warn, error } from '../../globals.js';
import { DEFAULT_LOG_COLOR } from '../../config.js';
export const DEFAULT_LOGGER_OPTIONS = {
    namespace: '',
    enabled: true,
    color: DEFAULT_LOG_COLOR || '',
    prefix: '',
    postfix: ''
};
export class Logger {
    opts;
    constructor(namespace, opts = {}) {
        this.opts = {
            ...DEFAULT_LOGGER_OPTIONS,
            ...opts,
            namespace: namespace || opts.namespace || ''
        };
    }
    log = (...args) => {
        log(this.opts.namespace, ...this.applyFormatting(args));
        return this;
    };
    warn = (...args) => {
        warn(this.opts.namespace, ...this.applyFormatting(args));
        return this;
    };
    error = (...args) => {
        error(this.opts.namespace, ...this.applyFormatting(args));
        return this;
    };
    setEnabled = (enabled) => {
        this.opts.enabled = enabled;
        return this;
    };
    applyFormatting = (args) => {
        if (!this.opts.prefix && !this.opts.postfix)
            return args;
        const formatted = [...args];
        if (this.opts.prefix)
            formatted.unshift(this.opts.prefix);
        if (this.opts.postfix)
            formatted.push(this.opts.postfix);
        return formatted;
    };
}
