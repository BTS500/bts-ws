"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = require("./Logger").instance("ApiRequest");

var _id = 0; // Uniquely identifies
var _subscription_id = 100; // Uniquely identifies

var ApiRequest = function () {
    function ApiRequest() {
        var method = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";

        _classCallCheck(this, ApiRequest);

        this.id = _id++;
        this.method = "call";
        this.api_identifier = 1;
        this.api_method = method;

        if (arguments.length > 1) {
            this.api_params = Array.from(arguments).slice(1, arguments.length); // Ignore the first parameter
        } else {
            this.api_params = [];
        }

        this.resolve = null;
        this.reject = null;
        this.subscribe = false; // Whether it is a subscription type
        this.callback = null;
        if (this.api_method === "set_subscribe_callback" || this.api_method === "set_pending_transaction_callback" || this.api_method === "set_block_applied_callback" || this.api_method === "subscribe_to_market" || this.api_method === "get_full_accounts" || this.api_method === "set_block_applied_callback") {
            this.subscribe = true; // Subscribe to the API list
        }
    }

    /**
     * set call api name
     *
     * @param method api name
     */


    _createClass(ApiRequest, [{
        key: "setMethod",
        value: function setMethod(method) {
            this.api_method = method;
            return this;
        }

        /**
         * set api identifier
         *
         * @param identifier int
         */

    }, {
        key: "setIdentifier",
        value: function setIdentifier(identifier) {
            this.api_identifier = identifier;
            return this;
        }

        /**
         * Asynchronous call Promise
         *
         * @param resolve Promise.resolve
         */

    }, {
        key: "setResolve",
        value: function setResolve(resolve) {
            this.resolve = resolve;
            return this;
        }

        /**
         * Asynchronous call Promise
         *
         * @param reject Promise.reject
         */

    }, {
        key: "setReject",
        value: function setReject(reject) {
            this.reject = reject;
            return this;
        }

        /**
         * Subscription type callback function
         *
         * @param callback Function After the subscription information is released, this function is called back every time
         */

    }, {
        key: "setCallback",
        value: function setCallback(callback) {
            this.callback = callback;
            return this;
        }

        /**
         * Add parameters to the end
         *
         * @param param parameter
         */

    }, {
        key: "addParam",
        value: function addParam(param) {
            this.api_params.push(param);
            return this;
        }

        /**
         * build object to json
         *
         * @return json
         */

    }, {
        key: "build",
        value: function build() {
            var apiJSON = {
                id: this.id,
                method: this.method,
                params: [this.api_identifier, this.api_method, [].concat(_toConsumableArray(this.api_params))]
            };
            logger.log(JSON.stringify(apiJSON));
            return JSON.stringify(apiJSON);
        }

        /**
         * Set Subscription Id
         */

    }, {
        key: "setSubscriptionId",
        value: function setSubscriptionId(id) {
            this.subscription_id = id;
            return this;
        }

        /**
         * Get Subscription Id
         */

    }], [{
        key: "getSubscriptionId",
        value: function getSubscriptionId() {
            return _subscription_id;
        }
    }]);

    return ApiRequest;
}();

exports.default = ApiRequest;