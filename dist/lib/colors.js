import { COLORS_ENABLED } from './config.js';
// ============================================================================
// ANSI COLORS
// ============================================================================
export const Colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    orange: '\x1b[48:5:208m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    purple: '\x1b[95m',
    darkcyan: '\x1b[36m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    BGblack: '\x1b[40m',
    BGred: '\x1b[41m',
    BGgreen: '\x1b[42m',
    BGyellow: '\x1b[43m',
    BGblue: '\x1b[44m',
    BGmagenta: '\x1b[45m',
    BGcyan: '\x1b[46m',
    BGwhite: '\x1b[47m'
};
export function color(colorName, str) {
    if (!COLORS_ENABLED)
        return str;
    const colorCode = colorName.includes('\x1b') ? colorName : Colors[colorName];
    return colorCode ? `${colorCode}${str}${Colors.reset}` : str;
}
