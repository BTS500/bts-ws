import RWebSocket from "./RWebSocket";
import ApisInstance from "./ApisInstance";
import ApiRequest from "./ApiRequest";
import ApiResult from "./ApiResult";
import GrapheneApi from "./GrapheneApi";

let logger = (require("../libs/Logger")).instance("ChainWebSocket");

let apiCallQueue = new Map();   // Unsuccessful request queue

/**
 * Graphene system-specific WebSocket connection
 */
class ChainWebSocket {

    /**
     * @param url WebSocket address
     * @param options Configuration parameters
     * @param callback Connection status callback function
     */
    constructor(url, options, callback) {
        this._init(url, options, callback)
    }

    _init(url, options = {}, callback = null) {
        this._connect_callback = callback;  // Record connection callback function
        try {
            this.ws_url = url ? url : this.ws_url;
            if (!this.options) this.options = {};
            this.options = Object.assign(this.options, options, {constructor: ChainWebSocket.getWebSocketClient()});
            this._rws = new RWebSocket(url, [], this.options);
            this._initDefaultListeners()._bypassRWSProperties();
        } catch (err) {
            this._callback(err, null);  // An error occurred during the build process
        }
    }

    /**
     * Define the default event handler
     */
    _initDefaultListeners() {
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
    _clearDefaultListeners() {
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
    _bypassRWSProperties() {
        let IGNORE_0_EVENTS = ["onopen", "onclose", "onmessage", "onerror", "addEventListener", "removeEventListener", "close", "send"];
        let _this = this;

        for (let property in _this._rws) {
            if (!IGNORE_0_EVENTS.includes(property) && _this._rws.hasOwnProperty(property)) {
                Object.defineProperty(this, property, {
                    get: function () {
                        return _this._rws[property];
                    },
                    set: function (value) {
                        return _this._rws[property] = value;
                    },
                    enumerable: true,
                    configurable: true
                });
            }
        }

        ["send", "close", "addEventListener", "onceEventListener", "assignEventListener", "removeEventListener"].forEach((property) => {
            _this[property] = _this._rws[property];
        });
        return this;
    }

    _rwsMessageListener(event) {
        try {
            let apiResult = new ApiResult(event.data);
            let apiRequest = apiCallQueue.get(apiResult.id);

            if (!apiRequest) {
                setTimeout(() => {
                    this._rws.emitEvent("error", new TypeError("An unknown WebSocket response object：" + apiResult));
                }, 0);
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

            apiCallQueue.delete(apiRequest.id);  // delete it，It has completed its mission
        } catch (error) {
            setTimeout(() => {
                this._rws.emitEvent("error", error);
            }, 0);
        }
    }

    _rwsOpenListener(event) {
        this.loginGraphene(event);
    }

    _rwsCloseListener(event) {
    }

    _rwsErrorListener(error) {
        logger.log("An error has occurred:", error);
    }

    _rwsDownListener(downEvent) {
        logger.log(`${this.ws_url} may be down !!!`);
    }

    /**
     * Callback connection status function
     */
    _callback(err, apis) {
        if (this._connect_callback) {
            let callback = this._connect_callback;
            this._connect_callback = null;
            callback(err, apis);
        }
    }

    /**
     * Login the Graphene system and initialization
     */
    loginGraphene() {
        let graphene = new GrapheneApi(this);
        let apis = [];
        let _this = this;
        graphene.login().then(() => {
            let db_init = new GrapheneApi(this, "database");
            let hist_init = new GrapheneApi(this, "history");
            let net_init = new GrapheneApi(this, "network_broadcast");
            return Promise.all([db_init.init(), hist_init.init(), net_init.init()]);
        }).then((_apis) => {
            let [db_api] = _apis;
            apis = _apis;
            return db_api.call(new ApiRequest("get_chain_id"));
        }).then((chainResult) => {
            ApisInstance.setChainId(chainResult);
            setTimeout(() => _this._callback(null, apis), 0); // Don't make callback function errors in Promise
        }).catch((err) => {
            setTimeout(() => _this._callback(err, null), 0); // Don't make callback function errors in Promise
        });
    }

    /**
     * Reconnect the WebSocket
     * @param callback Connection status callback function
     * @param keepEvent Whether to retain the original listener function
     */
    reconnect(callback, keepEvent) {
        logger.log(`reconnect to ${this.ws_url},and keepEvent: ${keepEvent}`);

        this._clearDefaultListeners();
        let oldListeners = this._rws.keep_listeners;
        let oldOnceListeners = this._rws.once_listeners;
        this._init(this.ws_url, this.options, callback);

        if (keepEvent) {
            this._rws.assignEventListener(oldListeners);
            this._rws.assignEventListener(oldOnceListeners, true);
        }
    }

    /**
     * Start the API call
     *
     * @param api ApiCall Type
     * @return Promise
     */
    requestApi(api) {
        let _this = this;
        return new Promise((resolve, reject) => {
            apiCallQueue.set(api.id, api);
            _this.ws.send(api.setResolve(resolve).setReject(reject).build());
        });
    }

    /**
     * Get the underlying WebSocket support based on your operating environment
     */
    static getWebSocketClient() {
        let WebSocketClient = null;
        if (typeof WebSocket === "undefined") {
            WebSocketClient = require("ws");
        } else {
            WebSocketClient = WebSocket;
        }
        return WebSocketClient;
    }

}

export default ChainWebSocket;