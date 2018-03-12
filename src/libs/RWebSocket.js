let logger = (require("./Logger")).instance("RWS");

let isWebSocket = function (constructor) {
    return constructor && constructor.CLOSING === 2;
};

let isGlobalWebSocket = function () {
    return typeof WebSocket !== "undefined" && isWebSocket(WebSocket);
};

let getDefaultOptions = function () {
    return ({
        constructor: isGlobalWebSocket() ? WebSocket : null,
        maxReconnectionDelay: 10000,
        minReconnectionDelay: 1500,
        reconnectionDelayGrowFactor: 1.3,
        connectionTimeout: 60000,
        maxRetries: Infinity
    });
};

let bypassProperty = function (src, dst, name) {
    Object.defineProperty(dst, name, {
        get: function () {
            return src[name];
        },
        set: function (value) {
            src[name] = value;
        },
        enumerable: true,
        configurable: true,
    });
};

let initReconnectionDelay = function (options) {
    return (options.minReconnectionDelay + Math.random() * options.minReconnectionDelay);
};

let updateReconnectionDelay = function (options, previousDelay) {
    let newDelay = previousDelay * options.reconnectionDelayGrowFactor;
    return (newDelay > options.maxReconnectionDelay) ? options.maxReconnectionDelay : newDelay;
};

/**
 * Reconnect WebSocket，To achieve a reconnection system
 */
class RWebSocket {

    /**
     * @param url WebSocket Address
     * @param protocols Array
     * @param options Configuration parameters
     */
    constructor(url, protocols, options) {
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
        this.listeners = {};
        this.once_listeners = {};

        this._connect();
    }

    _connect() {
        if (!this.shouldRetry) {
            return;
        }

        logger.log("start connecting...");
        this.ws = new this.options.constructor(this.ws_url, this.protocols);
        this.ws.onopen = this._handleOpen.bind(this);
        this.ws.onmessage = this._handleMessage.bind(this);
        this.ws.onclose = this._handleClose.bind(this);
        this.ws.onerror = this._handleError.bind(this);

        for (let key in this.ws) {
            if (["addEventListener", "removeEventListener", "close", "send"].indexOf(key) < 0) {
                bypassProperty(this.ws, this, key); // Proxy's WebSocket property
            }
        }

        // Define connection timeout detection
        this.connectingTimeout = setTimeout(() => {
            if (this.ws !== undefined && this.ws.readyState === 1) {
                return this._clearConnectingTimeout();
            }
            logger.log("connecting timeout !!!");
            this.ws.close();
        }, this.options.connectionTimeout);
    }

    /**
     * WebSocket open event handle
     */
    _handleOpen(event) {
        this._clearConnectingTimeout();

        logger.log("_handleOpen connection is successful");
        this.reconnectDelay = initReconnectionDelay(this.options);
        this.retriesCount = 0;

        this.emitEvent("open", event);
    }

    /**
     * WebSocket message event handle
     */
    _handleMessage(event) {
        this.emitEvent("message", event);
    }

    /**
     * WebSocket close event handle
     */
    _handleClose(event) {
        this._clearConnectingTimeout();

        logger.log("_handleClose", {shouldRetry: this.shouldRetry});
        this.retriesCount++;
        logger.log("_handleClose retries count", this.retriesCount);

        if (this.retriesCount > this.options.maxRetries) {
            return this.emitEvent("down", event);  // server is down
        }

        if (Array.isArray(this.listeners.close)) {
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
    _handleError(error) {
        this.emitEvent("error", error);
    }

    /**
     * Clear connection timeout detection
     */
    _clearConnectingTimeout() {
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
    emitEvent(type, event) {
        if (Array.isArray(this.once_listeners[type])) {
            this.once_listeners[type] = this.once_listeners[type].filter(function (listener) {
                let [callback, options] = listener;
                return callback(event, options) && false;
            });
        }

        if (Array.isArray(this.listeners[type])) {
            this.listeners[type].forEach(function (listener) {
                let [callback, options] = listener;
                callback(event, options);
            });
        }
    }

    /**
     * WebSocket send
     *
     * @param data
     */
    send(data) {
        this.ws.send(data);
    };

    /**
     * Custom close method
     *
     * @param code
     * @param reason
     * @param _a Expand the object { keepClosed:false, delay:0 }
     */
    close(code, reason, _a) {
        code = code ? code : 1000;
        reason = reason ? reason : "";
        let {keepClosed = false, delay = 0} = Object.assign({}, _a);

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
    };

    /**
     * Add event listener
     *
     * @param type event "error" "message" "open" "close" "down"
     * @param listener event function
     * @param options expand object
     */
    addEventListener(type, listener, options = {}) {
        if (Array.isArray(this.listeners[type])) {
            if (!this.listeners[type].some(function (item) {
                    let [callback] = item;
                    return callback === listener;   // Detection added repeatedly
                })
            ) {
                this.listeners[type].push([listener, options]);
            }
        } else {
            this.listeners[type] = [[listener, options]];
        }
    }

    /**
     * Add event listener, Trigger only once
     *
     * @param type event "error" "message" "open" "close" "down"
     * @param listener event function
     * @param options expand object
     */
    onceEventListener(type, listener, options = {}) {
        if (Array.isArray(this.once_listeners[type])) {
            if (!this.once_listeners[type].some(function (item) {
                    let [callback] = item;
                    return callback === listener;   // Detection added repeatedly
                })
            ) {
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
    assignEventListener(listeners, once = false) {
        let _this = this;
        let target_listeners = this.listeners;
        if (once) {
            target_listeners = this.once_listeners;
        }

        Object.keys(listeners).forEach(function (type) {
            listeners[type].forEach(function (item) {
                let [callback, options] = item;
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
    removeEventListener(type, listener) {
        if (type && !listener) {
            this.once_listeners[type] = [];
            this.listeners[type] = [];
            return;
        }

        if (Array.isArray(this.once_listeners[type])) {
            this.once_listeners[type] = this.once_listeners[type].filter(function (item) {
                let [callback] = item;
                return callback !== listener;
            });
        }

        if (Array.isArray(this.listeners[type])) {
            this.listeners[type] = this.listeners[type].filter(function (item) {
                let [callback] = item;
                return callback !== listener;
            });
        }
    };

}

export default RWebSocket;