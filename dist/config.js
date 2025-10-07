const tryParseBool = (b, def = undefined) => {
    if (typeof b == 'boolean')
        return b;
    return b === 'true' ? true : b === 'false' ? false : def;
};
export const LOG_ERROR_TRACES = process.env.LOG_ERROR_TRACES === 'true';
export const ALWAYS_LOG_ERRORS = tryParseBool(process.env.LOG_ERRORS_ALWAYS, true);
export const ALWAYS_LOG_WARNINGS = tryParseBool(process.env.LOG_WARNINGS_ALWAYS, true);
export const COLORS_ENABLED = tryParseBool(process.env.LOG_COLORS_ENABLED, true);
export const DEFAULT_LOG_COLOR = process.env.LOG_COLOR_DEFAULT;
