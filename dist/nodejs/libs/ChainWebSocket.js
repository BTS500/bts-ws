"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _RWebSocket = require("./RWebSocket");

var _RWebSocket2 = _interopRequireDefault(_RWebSocket);

var _ApisInstance = require("./ApisInstance");

var _ApisInstance2 = _interopRequireDefault(_ApisInstance);

var _ApiRequest = require("./ApiRequest");

var _ApiRequest2 = _interopRequireDefault(_ApiRequest);

var _ApiResult = require("./ApiResult");

var _ApiResult2 = _interopRequireDefault(_ApiResult);

var _GrapheneApi = require("./GrapheneApi");

var _GrapheneApi2 = _interopRequireDefault(_GrapheneApi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = require("../libs/Logger").instance("ChainWebSocket");

var apiCallQueue = new Map(); // Unsuccessful request queue

/**
 * Graphene system-specific WebSocket connection
 */

var ChainWebSocket = function () {

    /**
     * @param url WebSocket address
     * @param options Configuration parameters
     * @param callback Connection status callback function
     */
    function ChainWebSocket(url, options, callback) {
        _classCallCheck(this, ChainWebSocket);

        this._init(url, options, callback);
    }

    _createClass(ChainWebSocket, [{
        key: "_init",
        value: function _init(url) {
            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
            var callback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

            this._connect_callback = callback; // Record connection callback function
            try {
                this.ws_url = url ? url : this.ws_url;
                if (!this.options) this.options = {};
                this.options = Object.assign(this.options, options, { constructor: ChainWebSocket.getWebSocketClient() });
                this._rws = new _RWebSocket2.default(url, [], this.options);
                this._initDefaultListeners()._bypassRWSProperties();
            } catch (err) {
                this._callback(err, null);
            }
        }

        /**
         * Define the default event handler
         */

    }, {
        key: "_initDefaultListeners",
        value: function _initDefaultListeners() {
            this._open_listener = this._rwsOpenListener.bind(this);
            this._close_listener = this._rwsCloseListener.bind(this);
            this._error_listener = this._rwsErrorListener.bind(this);
            this._message_listener = this._rwsMessageListener.bind(this);
            this._down_listener = this._rwsDownListener.bind(this);

            this._rws.addEventListener("open", this._open_listener);
            this._rws.addEventListener("close", this._close_listener);
            this._rws.addEventListener("error", this._error_listener);
            this._rws.addEventListener("message", this._message_listener);
            this._rws.addEventListener("down", this._down_listener);

            return this;
        }

        /**
         * Remove all the default event handler
         */

    }, {
        key: "_clearDefaultListeners",
        value: function _clearDefaultListeners() {
            this._rws.removeEventListener("open", this._open_listener);
            this._rws.removeEventListener("close", this._close_listener);
            this._rws.removeEventListener("error", this._error_listener);
            this._rws.removeEventListener("message", this._message_listener);
            this._rws.removeEventListener("down", this._down_listener);

            return this;
        }

        /**
         * Proxy's WebSocket property
         */

    }, {
        key: "_bypassRWSProperties",
        value: function _bypassRWSProperties() {
            var _this2 = this;

            var IGNORE_0_EVENTS = ["onopen", "onclose", "onmessage", "onerror", "addEventListener", "removeEventListener", "close", "send"];
            var _this = this;

            var _loop = function _loop(property) {
                if (!IGNORE_0_EVENTS.includes(property) && _this._rws.hasOwnProperty(property)) {
                    Object.defineProperty(_this2, property, {
                        get: function get() {
                            return _this._rws[property];
                        },
                        set: function set(value) {
                            return _this._rws[property] = value;
                        },
                        enumerable: true,
                        configurable: true
                    });
                }
            };

            for (var property in _this._rws) {
                _loop(property);
            }

            ["send", "close", "addEventListener", "onceEventListener", "assignEventListener", "removeEventListener"].forEach(function (property) {
                _this[property] = _this._rws[property];
            });
            return this;
        }
    }, {
        key: "_rwsMessageListener",
        value: function _rwsMessageListener(event) {
            try {
                var apiResult = new _ApiResult2.default(event.data);
                var apiRequest = apiCallQueue.get(apiResult.id);

                if (!apiRequest) {
                    logger.log("An unknown WebSocket response object：" + apiResult);
                    return;
                }

                if (apiResult.subscribe) {
                    return apiRequest.callback(apiResult); // Subscription result special treatment
                }

                if (!apiResult.error) {
                    apiRequest.resolve(apiResult);
                } else {
                    apiRequest.reject(apiResult);
                }

                apiCallQueue.delete(apiRequest.id); // delete it，It has completed its mission
            } catch (error) {
                logger.log("In order not to affect the operation, an error has been ignored：", error);
            }
        }
    }, {
        key: "_rwsOpenListener",
        value: function _rwsOpenListener(event) {
            this.loginGraphene(event);
        }
    }, {
        key: "_rwsCloseListener",
        value: function _rwsCloseListener(event) {}
    }, {
        key: "_rwsErrorListener",
        value: function _rwsErrorListener(event) {}
    }, {
        key: "_rwsDownListener",
        value: function _rwsDownListener(downEvent) {
            logger.log(this.ws_url + " may be down !!!");
        }

        /**
         * Callback connection status function
         */

    }, {
        key: "_callback",
        value: function _callback(err, apis) {
            if (this._connect_callback) {
                var callback = this._connect_callback;
                this._connect_callback = null;
                callback(err, apis);
            }
        }

        /**
         * Login the Graphene system and initialization
         */

    }, {
        key: "loginGraphene",
        value: function loginGraphene() {
            var _this3 = this;

            var graphene = new _GrapheneApi2.default(this);
            var apis = [];
            var _this = this;
            graphene.login().then(function () {
                var db_init = new _GrapheneApi2.default(_this3, "database");
                var hist_init = new _GrapheneApi2.default(_this3, "history");
                var net_init = new _GrapheneApi2.default(_this3, "network_broadcast");
                return Promise.all([db_init.init(), hist_init.init(), net_init.init()]);
            }).then(function (_apis) {
                var _apis2 = _slicedToArray(_apis, 1),
                    db_api = _apis2[0];

                apis = _apis;
                return db_api.call(new _ApiRequest2.default("get_chain_id"));
            }).then(function (chainResult) {
                _ApisInstance2.default.setChainId(chainResult);
                setTimeout(function () {
                    return _this._callback(null, apis);
                }, 0); // Don't make callback function errors in Promise
            }).catch(function (err) {
                setTimeout(function () {
                    return _this._callback(err, null);
                }, 0); // Don't make callback function errors in Promise
            });
        }

        /**
         * Reconnect the WebSocket
         * @param callback Connection status callback function
         * @param keepEvent Whether to retain the original listener function
         */

    }, {
        key: "reconnect",
        value: function reconnect(callback, keepEvent) {
            logger.log("reconnect to " + this.ws_url + ",and keepEvent: " + keepEvent);

            this._clearDefaultListeners();
            var oldListeners = this._rws.listeners;
            var oldOnceListeners = this._rws.once_listeners;
            this._init(this.ws_url, this.options, callback);

            if (keepEvent) {
                this._rws.assignEventListener(oldListeners);
                this._rws.assignEventListener(oldOnceListeners);
            }
        }

        /**
         * Start the API call
         *
         * @param api ApiCall Type
         * @return Promise
         */

    }, {
        key: "requestApi",
        value: function requestApi(api) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                apiCallQueue.set(api.id, api);
                _this.ws.send(api.setResolve(resolve).setReject(reject).build());
            });
        }

        /**
         * Get the underlying WebSocket support based on your operating environment
         */

    }], [{
        key: "getWebSocketClient",
        value: function getWebSocketClient() {
            var WebSocketClient = null;
            if (typeof WebSocket === "undefined") {
                WebSocketClient = require("ws");
            } else {
                WebSocketClient = WebSocket;
            }
            return WebSocketClient;
        }
    }]);

    return ChainWebSocket;
}();

exports.default = ChainWebSocket;