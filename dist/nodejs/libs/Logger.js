"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.instance = instance;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * 全局调试开关
 */
var GLOBAL_DEBUG = false;

var Logger = function () {
    function Logger() {
        var prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "BTS-WS";

        _classCallCheck(this, Logger);

        this.prefix = prefix;
        Object.defineProperty(this, "DEBUG", {
            get: function get() {
                return GLOBAL_DEBUG;
            },
            set: function set(value) {
                GLOBAL_DEBUG = value;
            },
            enumerable: true,
            configurable: true
        });
    }

    _createClass(Logger, [{
        key: "log",
        value: function log() {
            if (!GLOBAL_DEBUG) {
                return;
            }
            var params = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                params[_i] = arguments[_i];
            }
            return console.log.apply(console, [this.prefix + ":"].concat(params));
        }
    }]);

    return Logger;
}();

function instance(prefix) {
    return new Logger(prefix);
}