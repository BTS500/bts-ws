"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = require("./Logger").instance("RWS");

var isWebSocket = function isWebSocket(constructor) {
    return constructor && constructor.CLOSING === 2;
};

var isGlobalWebSocket = function isGlobalWebSocket() {
    return typeof WebSocket !== "undefined" && isWebSocket(WebSocket);
};

var getDefaultOptions = function getDefaultOptions() {
    return {
        constructor: isGlobalWebSocket() ? WebSocket : null,
        maxReconnectionDelay: 10000,
        minReconnectionDelay: 1500,
        reconnectionDelayGrowFactor: 1.3,
        connectionTimeout: 60000,
        maxRetries: Infinity
    };
};

var bypassProperty = function bypassProperty(src, dst, name) {
    Object.defineProperty(dst, name, {
        get: function get() {
            return src[name];
        },
        set: function set(value) {
            src[name] = value;
        },
        enumerable: true,
        configurable: true
    });
};

var initReconnectionDelay = function initReconnectionDelay(options) {
    return options.minReconnectionDelay + Math.random() * options.minReconnectionDelay;
};

var updateReconnectionDelay = function updateReconnectionDelay(options, previousDelay) {
    var newDelay = previousDelay * options.reconnectionDelayGrowFactor;
    return newDelay > options.maxReconnectionDelay ? options.maxReconnectionDelay : newDelay;
};

/**
 * Reconnect WebSocket，To achieve a reconnection system
 */

var RWebSocket = function () {

    /**
     * @param url WebSocket Address
     * @param protocols Array
     * @param options Configuration parameters
     */
    function RWebSocket(url, protocols, options) {
        _classCallCheck(this, RWebSocket);

        if (url === undefined || url === null) {
            throw new ReferenceError("The RWebSocket url parameter can not be null.");
        }

        this.ws_url = url;
        this.protocols = Array.isArray(protocols) ? protocols : [];
        this.options = Object.assign(getDefaultOptions(), options);
        if (!isWebSocket(this.options.constructor)) {
            throw new TypeError("The RWebSocket options parameter must include 'constructor'");
        }

        this.ws = null;
        this.connectingTimeout = null;
        this.reconnectDelay = 0;
        this.retriesCount = 0;
        this.shouldRetry = true;
        this.keep_listeners = {};
        this.once_listeners = {};

        this._connect();
    }

    _createClass(RWebSocket, [{
        key: "_connect",
        value: function _connect() {
            var _this2 = this;

            if (!this.shouldRetry) {
                return;
            }

            logger.log("start connecting...");
            this.ws = new this.options.constructor(this.ws_url, this.protocols);
            this.ws.onopen = this._handleOpen.bind(this);
            this.ws.onmessage = this._handleMessage.bind(this);
            this.ws.onclose = this._handleClose.bind(this);
            this.ws.onerror = this._handleError.bind(this);

            for (var key in this.ws) {
                if (["addEventListener", "removeEventListener", "close", "send"].indexOf(key) < 0) {
                    bypassProperty(this.ws, this, key); // Proxy's WebSocket property
                }
            }

            // Define connection timeout detection
            this.connectingTimeout = setTimeout(function () {
                if (_this2.ws !== undefined && _this2.ws.readyState === 1) {
                    return _this2._clearConnectingTimeout();
                }
                logger.log("connecting timeout !!!");
                _this2.ws.close();
            }, this.options.connectionTimeout);
        }

        /**
         * WebSocket open event handle
         */

    }, {
        key: "_handleOpen",
        value: function _handleOpen(event) {
            this._clearConnectingTimeout();

            logger.log("_handleOpen connection is successful");
            this.reconnectDelay = initReconnectionDelay(this.options);
            this.retriesCount = 0;

            this.emitEvent("open", event);
        }

        /**
         * WebSocket message event handle
         */

    }, {
        key: "_handleMessage",
        value: function _handleMessage(event) {
            this.emitEvent("message", event);
        }

        /**
         * WebSocket close event handle
         */

    }, {
        key: "_handleClose",
        value: function _handleClose(event) {
            this._clearConnectingTimeout();

            logger.log("_handleClose", { shouldRetry: this.shouldRetry });
            this.retriesCount++;
            logger.log("_handleClose retries count", this.retriesCount);

            if (this.retriesCount > this.options.maxRetries) {
                return this.emitEvent("down", event); // server is down
            }

            if (Array.isArray(this.keep_listeners.close)) {
                this.emitEvent("close", event);
            }

            if (!this.reconnectDelay) {
                this.reconnectDelay = initReconnectionDelay(this.options);
            } else {
                this.reconnectDelay = updateReconnectionDelay(this.options, this.reconnectDelay);
            }

            if (this.shouldRetry) {
                logger.log("_handleClose The next connection will wait", this.reconnectDelay, "ms");
                setTimeout(this._connect.bind(this), this.reconnectDelay);
            }
        }

        /**
         * WebSocket error event handle
         */

    }, {
        key: "_handleError",
        value: function _handleError(error) {
            this.emitEvent("error", error);
        }

        /**
         * Clear connection timeout detection
         */

    }, {
        key: "_clearConnectingTimeout",
        value: function _clearConnectingTimeout() {
            if (this.connectingTimeout !== undefined && this.connectingTimeout !== null) {
                clearTimeout(this.connectingTimeout);
                this.connectingTimeout = null;
            }
        }

        /**
         * Emit the specified type of event
         * @param type Event Type
         * @param event Event Object
         */

    }, {
        key: "emitEvent",
        value: function emitEvent(type, event) {
            if (Array.isArray(this.once_listeners[type])) {
                this.once_listeners[type] = this.once_listeners[type].filter(function (listener) {
                    var _listener = _slicedToArray(listener, 2),
                        callback = _listener[0],
                        options = _listener[1];

                    return callback(event, options) && false;
                });
            }

            if (Array.isArray(this.keep_listeners[type])) {
                this.keep_listeners[type].forEach(function (listener) {
                    var _listener2 = _slicedToArray(listener, 2),
                        callback = _listener2[0],
                        options = _listener2[1];

                    callback(event, options);
                });
            }
        }

        /**
         * WebSocket send
         *
         * @param data
         */

    }, {
        key: "send",
        value: function send(data) {
            this.ws.send(data);
        }
    }, {
        key: "close",


        /**
         * Custom close method
         *
         * @param code
         * @param reason
         * @param _a Expand the object { keepClosed:false, delay:0 }
         */
        value: function close(code, reason, _a) {
            code = code ? code : 1000;
            reason = reason ? reason : "";

            var _Object$assign = Object.assign({}, _a),
                _Object$assign$keepCl = _Object$assign.keepClosed,
                keepClosed = _Object$assign$keepCl === undefined ? false : _Object$assign$keepCl,
                _Object$assign$delay = _Object$assign.delay,
                delay = _Object$assign$delay === undefined ? 0 : _Object$assign$delay;

            logger.log("close - params", {
                reason: reason,
                keepClosed: keepClosed,
                delay: delay,
                retriesCount: this.retriesCount,
                maxRetries: this.options.maxRetries
            });

            this.shouldRetry = !keepClosed && this.retriesCount <= this.options.maxRetries;

            if (delay) {
                this.reconnectDelay = delay;
            }
            this.ws.close(code, reason);
        }
    }, {
        key: "addEventListener",


        /**
         * Add event listener
         *
         * @param type event "error" "message" "open" "close" "down"
         * @param listener event function
         * @param options expand object
         */
        value: function addEventListener(type, listener) {
            var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

            if (Array.isArray(this.keep_listeners[type])) {
                if (!this.keep_listeners[type].some(function (item) {
                    var _item = _slicedToArray(item, 1),
                        callback = _item[0];

                    return callback === listener; // Detection added repeatedly
                })) {
                    this.keep_listeners[type].push([listener, options]);
                }
            } else {
                this.keep_listeners[type] = [[listener, options]];
            }
        }

        /**
         * Add event listener, Trigger only once
         *
         * @param type event "error" "message" "open" "close" "down"
         * @param listener event function
         * @param options expand object
         */

    }, {
        key: "onceEventListener",
        value: function onceEventListener(type, listener) {
            var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

            if (Array.isArray(this.once_listeners[type])) {
                if (!this.once_listeners[type].some(function (item) {
                    var _item2 = _slicedToArray(item, 1),
                        callback = _item2[0];

                    return callback === listener; // Detection added repeatedly
                })) {
                    this.once_listeners[type].push([listener, options]);
                }
            } else {
                this.once_listeners[type] = [[listener, options]];
            }
        }

        /**
         * Merge a group listener function
         *
         * @param listeners Object Type, A set of listener functions
         */

    }, {
        key: "assignEventListener",
        value: function assignEventListener(listeners) {
            var once = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            var _this = this;
            var target_listeners = _this.keep_listeners;
            if (once) {
                target_listeners = _this.once_listeners;
            }

            Object.keys(listeners).forEach(function (type) {
                listeners[type].forEach(function (item) {
                    var _item3 = _slicedToArray(item, 2),
                        callback = _item3[0],
                        options = _item3[1];

                    _this.addEventListener(type, callback, options);
                });
            });
        }

        /**
         * Remove the event listener，If you ignore the listener parameter，Remove all listener
         *
         * @param type event "error" "message" "open" "close" "down"
         * @param listener event function
         */

    }, {
        key: "removeEventListener",
        value: function removeEventListener(type, listener) {
            if (type && !listener) {
                this.once_listeners[type] = [];
                this.keep_listeners[type] = [];
                return;
            }

            if (Array.isArray(this.once_listeners[type])) {
                this.once_listeners[type] = this.once_listeners[type].filter(function (item) {
                    var _item4 = _slicedToArray(item, 1),
                        callback = _item4[0];

                    return callback !== listener;
                });
            }

            if (Array.isArray(this.keep_listeners[type])) {
                this.keep_listeners[type] = this.keep_listeners[type].filter(function (item) {
                    var _item5 = _slicedToArray(item, 1),
                        callback = _item5[0];

                    return callback !== listener;
                });
            }
        }
    }]);

    return RWebSocket;
}();

exports.default = RWebSocket;