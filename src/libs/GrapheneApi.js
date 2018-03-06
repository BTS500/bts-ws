import ApiRequest from "./ApiRequest";
import ChainWebSocket from "./ChainWebSocket";

let logger = (require("./Logger")).instance("GrapheneApi");

class GrapheneApi {

    constructor(ws_rpc, api_name = "") {
        if (!ws_rpc || !(ws_rpc instanceof ChainWebSocket)) {
            throw new TypeError("The 'ws_rpc' parameter must be ChainWebSocket type.");
        }

        this.ws_rpc = ws_rpc;
        this.api_name = api_name;
        this.api_identifier = 1;
    }

    /**
     * Get the API token identifier
     */
    init() {
        let _this = this;
        return new Promise(function (resolve, reject) {
            _this.call(new ApiRequest(_this.api_name)).then((apiResult) => {
                _this.api_identifier = apiResult.result;
                resolve(_this);
            }).catch((err) => {
                reject(err);
            });
        })
    }

    /**
     * Send api json to WebSocket
     */
    call(api) {
        if (!(api instanceof ApiRequest)) {
            return Promise.reject(new TypeError("Only one instance of an ApiRequest object can be made to initiate an API call request"));
        }

        if (this.ws_rpc.readyState !== 1) {
            return Promise.reject(new ReferenceError("Not call the api，WebSocket state error:" + this.ws_rpc.readyState));
        }

        if (api.subscribe && !api.callback) {
            return Promise.reject(new TypeError("To subscribe to a type of API call, you must specify the callback parameter:" + api.api_name));
        }

        return this.ws_rpc.requestApi(api.setIdentifier(this.api_identifier));
    }

    // ===============================================================================================================

    /**
     * Logn Graphene System
     */
    login(user = "", pass = "") {
        let api = new ApiRequest("login", user, pass);
        return this.call(api);
    }
}


// Assembly API plug-in
GrapheneApi.prototype.getObjects = require("../apis/getObjects").funName;
GrapheneApi.prototype.setSubscribeCallback = require("../apis/setSubscribeCallback").funName;
GrapheneApi.prototype.cancelAllSubscriptions = require("../apis/cancelAllSubscriptions").funName;


export default GrapheneApi;