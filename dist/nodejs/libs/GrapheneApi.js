"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ApiRequest = require("./ApiRequest");

var _ApiRequest2 = _interopRequireDefault(_ApiRequest);

var _ChainWebSocket = require("./ChainWebSocket");

var _ChainWebSocket2 = _interopRequireDefault(_ChainWebSocket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = require("./Logger").instance("GrapheneApi");

var GrapheneApi = function () {
    function GrapheneApi(ws_rpc) {
        var api_name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";

        _classCallCheck(this, GrapheneApi);

        if (!ws_rpc || !(ws_rpc instanceof _ChainWebSocket2.default)) {
            throw new TypeError("The 'ws_rpc' parameter must be ChainWebSocket type.");
        }

        this.ws_rpc = ws_rpc;
        this.api_name = api_name;
        this.api_identifier = 1;
    }

    /**
     * Get the API token identifier
     */


    _createClass(GrapheneApi, [{
        key: "init",
        value: function init() {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this.call(new _ApiRequest2.default(_this.api_name)).then(function (apiResult) {
                    _this.api_identifier = apiResult.result;
                    resolve(_this);
                }).catch(function (err) {
                    reject(err);
                });
            });
        }

        /**
         * Send api json to WebSocket
         */

    }, {
        key: "call",
        value: function call(api) {
            if (!(api instanceof _ApiRequest2.default)) {
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

    }, {
        key: "login",
        value: function login() {
            var user = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
            var pass = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";

            var api = new _ApiRequest2.default("login", user, pass);
            return this.call(api);
        }
    }]);

    return GrapheneApi;
}();

// Assembly API plug-in


GrapheneApi.prototype.getObjects = require("../apis/getObjects").funName;
GrapheneApi.prototype.setSubscribeCallback = require("../apis/setSubscribeCallback").funName;
GrapheneApi.prototype.cancelAllSubscriptions = require("../apis/cancelAllSubscriptions").funName;

exports.default = GrapheneApi;