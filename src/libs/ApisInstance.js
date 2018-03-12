import ChainWebSocket from "./ChainWebSocket";

let logger = (require("./Logger")).instance("ApiInstance");

let singletonInst = null;
let defaultOptions = {
    debug: false             // Global debugging switch
};

/**
 * Global unique API call entry，Singleton mode
 */
class ApisInstance {

    constructor(url, options) {
        this.ws_url = url;
        this.options = options;
    }

    /**
     * Actively connect to the API node
     *
     * @param callback Connection status callback function
     */
    connect(callback) {
        if (typeof callback !== "function") {
            throw new ReferenceError("callback parameters can only be a function type.");
        }

        if (!this.ws_url || !/^ws{1,2}:\/\//.test(this.ws_url.toLowerCase())) {
            let err = new TypeError(`Connection address is invalid: ${this.ws_url}`);
            return callback(err, null);
        }

        if (!this.ws_rpc) {
            this.ws_rpc = new ChainWebSocket(this.ws_url, this.options, (error, apis) => {
                if (!error) {
                    this.db_api = apis[0];
                    this.hist_api = apis[1];
                    this.net_api = apis[2];
                    setTimeout(() => callback(null, this), 0);  // Must ensure that errors are handled asynchronously
                } else {
                    setTimeout(() => callback(error, null), 0); // Must ensure that errors are handled asynchronously
                }
            });
        } else {
            let err = new ReferenceError("‘connect’method allows only call once, if you need to reset the connection status, call the‘reconnect’method");
            return callback(err, null);
        }
    }

    /**
     * Thoroughly disconnect the current connection, re-establish a new API connection
     *
     * @param callback Connection status callback function
     * @param keepEvent Whether to retain the original listener function
     */
    reconnect(callback, keepEvent = false) {
        if (!this.ws_url || !/^ws{1,2}:\/\//.test(this.ws_url.toLowerCase())) {
            let err = new TypeError(`Connection address is invalid: ${this.ws_url}`);
            return callback(err, null);
        }

        if (!this.ws_rpc) {
            return this.connect(callback);
        }

        let _this = this;
        let closePromise = null;

        if (_this.ws_rpc.readyState === 3 || _this.ws_rpc.readyState === 0) {
            closePromise = Promise.resolve();
        } else if (this.ws_rpc.readyState === 1) {
            closePromise = new Promise(function (resolve, reject) {
                _this.close(1000, "reconnect", {keepClosed: true}).then((event) => {
                    resolve(event);
                }).catch((error) => {
                    reject(error);
                })
            });
        }

        closePromise.then((event) => {
            _this.ws_rpc.ws_url = _this.ws_url;
            _this.ws_rpc.options = _this.options;
            this.ws_rpc.reconnect((error, apis) => {
                if (!error) {
                    _this.db_api = apis[0];
                    _this.hist_api = apis[1];
                    _this.net_api = apis[2];
                    setTimeout(() => callback(null, _this), 0);  // Don't make callback function errors in Promise
                } else {
                    setTimeout(() => callback(error, null), 0); // Don't make callback function errors in Promise
                }
            }, keepEvent);
        }).catch((error) => {
            return callback(error, null);
        });
    }

    /**
     * Proactively close the WebSocket connection
     *
     * @param options Additional options { keepClosed:false, delay:0 }
     * @return Promise
     */
    close(code = 1000, reason = "", options = {}) {
        if (!this.ws_rpc) {
            return Promise.resolve();
        }

        if (arguments.length === 1 && arguments[0] instanceof Object) {
            code = 1000;
            options = Object.assign({}, arguments[0]);
        }

        let closePromise = new Promise((resolve) => {
            this.ws_rpc.onceEventListener("close", function (event) {
                resolve(event);
            });
            this.ws_rpc.close(code, reason, options);
        });

        return closePromise;
    }


    /**
     * Set the blockchain ID
     *
     * @param chainResult "get_chain_id" return result
     */
    static setChainId(chainResult) {
        if (singletonInst) {
            singletonInst.chain_id = chainResult.result;
        }
    }

    /**
     * Get the default configuration items
     *
     * @return Object
     */
    static getDefaultOptions() {
        return defaultOptions;
    };

    /**
     * Static method, get a singleton instance
     *
     * @param url Connection address
     * @param options Configuration parameters
     * @return ApisInstance Singleton object
     */
    static instance(url = "ws://localhost:8090", options = {}) {
        options = Object.assign(this.getDefaultOptions(), options);
        logger.DEBUG = options.debug;

        if (singletonInst === null) {
            singletonInst = new ApisInstance(url, options);
        } else {
            logger.log("Your configuration parameters have been abandoned. Please use the object properties to modify.");
        }

        return singletonInst;
    }
}

export default ApisInstance;