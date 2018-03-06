/**
 * 全局调试开关
 */
let GLOBAL_DEBUG = false;

class Logger {

    constructor(prefix = "BTS-WS") {
        this.prefix = prefix;
        Object.defineProperty(this, "DEBUG", {
            get: function () {
                return GLOBAL_DEBUG;
            },
            set: function (value) {
                GLOBAL_DEBUG = value;
            },
            enumerable: true,
            configurable: true
        })
    }

    log() {
        if (!GLOBAL_DEBUG) {
            return;
        }
        let params = [];
        for (let _i = 0; _i < arguments.length; _i++) {
            params[_i] = arguments[_i];
        }
        return console.log.apply(console, [this.prefix + ":"].concat(params));
    }
}

export function instance(prefix) {
    return new Logger(prefix);
}