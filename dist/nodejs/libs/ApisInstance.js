"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ChainWebSocket = require("./ChainWebSocket");

var _ChainWebSocket2 = _interopRequireDefault(_ChainWebSocket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = require("./Logger").instance("ApiInstance");

var singletonInst = null;
var defaultOptions = {
    debug: false // Global debugging switch
};

/**
 * Global unique API call entry，Singleton mode
 */

var ApisInstance = function () {
    function ApisInstance(url, options) {
        _classCallCheck(this, ApisInstance);

        this.ws_url = url;
        this.options = options;
    }

    /**
     * Actively connect to the API node
     *
     * @param callback Connection status callback function
     */


    _createClass(ApisInstance, [{
        key: "connect",
        value: function connect(callback) {
            var _this2 = this;

            if (typeof callback !== "function") {
                throw new ReferenceError("callback parameters can only be a function type.");
            }

            if (!this.ws_url || !/^ws{1,2}:\/\//.test(this.ws_url.toLowerCase())) {
                var err = new TypeError("Connection address is invalid: " + this.ws_url);
                return callback(err, null);
            }

            if (!this.ws_rpc) {
                this.ws_rpc = new _ChainWebSocket2.default(this.ws_url, this.options, function (error, apis) {
                    if (!error) {
                        _this2.db_api = apis[0];
                        _this2.hist_api = apis[1];
                        _this2.net_api = apis[2];
                        setTimeout(function () {
                            return callback(null, _this2);
                        }, 0); // Must ensure that errors are handled asynchronously
                    } else {
                        setTimeout(function () {
                            return callback(error, null);
                        }, 0); // Must ensure that errors are handled asynchronously
                    }
                });
            } else {
                var _err = new ReferenceError("‘connect’method allows only call once, if you need to reset the connection status, call the‘reconnect’method");
                return callback(_err, null);
            }
        }

        /**
         * Thoroughly disconnect the current connection, re-establish a new API connection
         *
         * @param callback Connection status callback function
         * @param keepEvent Whether to retain the original listener function
         */

    }, {
        key: "reconnect",
        value: function reconnect(callback) {
            var _this3 = this;

            var keepEvent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            if (!this.ws_url || !/^ws{1,2}:\/\//.test(this.ws_url.toLowerCase())) {
                var err = new TypeError("Connection address is invalid: " + this.ws_url);
                return callback(err, null);
            }

            if (!this.ws_rpc) {
                return this.connect(callback);
            }

            var _this = this;
            var closePromise = null;

            if (_this.ws_rpc.readyState === 3 || _this.ws_rpc.readyState === 0) {
                closePromise = Promise.resolve();
            } else if (this.ws_rpc.readyState === 1) {
                closePromise = new Promise(function (resolve, reject) {
                    _this.close(1000, "reconnect", { keepClosed: true }).then(function (event) {
                        resolve(event);
                    }).catch(function (error) {
                        reject(error);
                    });
                });
            }

            closePromise.then(function (event) {
                _this.ws_rpc.ws_url = _this.ws_url;
                _this.ws_rpc.options = _this.options;
                _this3.ws_rpc.reconnect(function (error, apis) {
                    if (!error) {
                        _this.db_api = apis[0];
                        _this.hist_api = apis[1];
                        _this.net_api = apis[2];
                        setTimeout(function () {
                            return callback(null, _this);
                        }, 0); // Don't make callback function errors in Promise
                    } else {
                        setTimeout(function () {
                            return callback(error, null);
                        }, 0); // Don't make callback function errors in Promise
                    }
                }, keepEvent);
            }).catch(function (error) {
                return callback(error, null);
            });
        }

        /**
         * Proactively close the WebSocket connection
         *
         * @param options Additional options { keepClosed:false, delay:0 }
         * @return Promise
         */

    }, {
        key: "close",
        value: function close() {
            var code = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1000;

            var _this4 = this;

            var reason = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
            var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

            if (!this.ws_rpc) {
                return Promise.resolve();
            }

            if (arguments.length === 1 && arguments[0] instanceof Object) {
                code = 1000;
                options = Object.assign({}, arguments[0]);
            }

            var closePromise = new Promise(function (resolve) {
                _this4.ws_rpc.onceEventListener("close", function (event) {
                    resolve(event);
                });
                _this4.ws_rpc.close(code, reason, options);
            });

            return closePromise;
        }

        /**
         * Set the blockchain ID
         *
         * @param chainResult "get_chain_id" return result
         */

    }], [{
        key: "setChainId",
        value: function setChainId(chainResult) {
            if (singletonInst) {
                singletonInst.chain_id = chainResult.result;
            }
        }

        /**
         * Get the default configuration items
         *
         * @return Object
         */

    }, {
        key: "getDefaultOptions",
        value: function getDefaultOptions() {
            return defaultOptions;
        }
    }, {
        key: "instance",


        /**
         * Static method, get a singleton instance
         *
         * @param url Connection address
         * @param options Configuration parameters
         * @return ApisInstance Singleton object
         */
        value: function instance() {
            var url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "ws://localhost:8090";
            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            options = Object.assign(this.getDefaultOptions(), options);
            logger.DEBUG = options.debug;

            if (singletonInst === null) {
                singletonInst = new ApisInstance(url, options);
            } else {
                logger.log("Your configuration parameters have been abandoned. Please use the object properties to modify.");
            }

            return singletonInst;
        }
    }]);

    return ApisInstance;
}();

exports.default = ApisInstance;